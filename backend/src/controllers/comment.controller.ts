import { Response } from "express";
import { ProjectRequest } from "../middleware/rbacGuard.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Comment from "../models/Comment.js";
import { sendResponse } from "../utils/ApiResponse.js";
import Task from "../models/Task.js";
import { ApiError } from "../utils/ApiError.js";

export const getCommentsByTask = asyncHandler(
  async (req: ProjectRequest, res: Response) => {
    const { taskId } = req.params;
    const comments = await Comment.find({ taskId })
      .populate("author", "name email avatarUrl")
      .sort({ createdAt: 1 });
    return sendResponse(res, comments, "Comments retrieved", 200);
  },
);

export const addComment = asyncHandler(
  async (req: ProjectRequest, res: Response) => {
    const { taskId } = req.params;
    const { content } = req.body;
    const task = await Task.findById(taskId);
    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    const comment = await Comment.create({
      taskId,
      author: req.user!._id,
      content,
    });

    task.activityLogs.push({
      user: req.user!._id as any,
      action: `Commented: "${content.slice(0, 30)}${content.length > 30 ? "..." : ""}"`,
      timestamp: new Date(),
    });

    await task.save();

    const populatedComment = await comment.populate(
      "author",
      "name email avatarUrl",
    );
    const populatedTask = await Task.findById(taskId).populate(
      "assignedTo",
      "name email avatarUrl",
    );
    return sendResponse(
      res,
      { comment: populatedComment, task: populatedTask },
      "Comment added successfully",
      201,
    );
  },
);
