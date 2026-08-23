import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import api from "../../api/axiosInstance";
import type { ITask, TaskFilters } from "../../types";

interface TaskState {
  tasks: ITask[];
  filters: TaskFilters;
  selectedTaskId: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: TaskState = {
  tasks: [],
  filters: {
    search: "",
    status: "",
    priority: "",
    assignedTo: "",
  },
  selectedTaskId: null,
  isLoading: false,
  error: null,
};

export const fetchTasks = createAsyncThunk(
  "tasks/fetchTasks",
  async (
    {
      projectId,
      filters,
    }: { projectId: string; filters?: Partial<TaskFilters> },
    { rejectWithValue },
  ) => {
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.append("search", filters.search);
      if (filters?.status) params.append("status", filters.status);
      if (filters?.priority) params.append("priority", filters.priority);
      if (filters?.assignedTo) params.append("assignedTo", filters.assignedTo);

      const res = await api.get(
        `/projects/${projectId}/tasks?${params.toString()}`,
      );
      return res.data.data.tasks;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch tasks",
      );
    }
  },
);

export const updateTaskStatusApi = createAsyncThunk(
  "tasks/updateStatus",
  async (
    {
      taskId,
      status,
      boardId,
      orderIndex,
    }: { taskId: string; status: string; boardId: string; orderIndex: number },
    { rejectWithValue },
  ) => {
    try {
      const res = await api.patch(`/tasks/${taskId}/status`, {
        status,
        boardId,
        orderIndex,
      });
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to update task",
      );
    }
  },
);

const taskSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    clearTasks: (state) => {
      state.tasks = [];
      state.selectedTaskId = null;
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<Partial<TaskFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setSelectedTaskId: (state, action: PayloadAction<string | null>) => {
      state.selectedTaskId = action.payload;
    },
    // Optimistic reorder during drag-and-drop
    moveTaskOptimistic: (
      state,
      action: PayloadAction<{
        taskId: string;
        newBoardId: string;
        newStatus: "todo" | "in_progress" | "done";
        newIndex: number;
      }>,
    ) => {
      const { taskId, newBoardId, newStatus, newIndex } = action.payload;
      const task = state.tasks.find((t) => t._id === taskId);
      if (task) {
        task.boardId = newBoardId;
        task.status = newStatus;
        task.orderIndex = newIndex;
      }
    },
    taskCreatedLocally: (state, action: PayloadAction<ITask>) => {
      state.tasks.push(action.payload);
    },
    taskUpdatedLocally: (state, action: PayloadAction<ITask>) => {
      const idx = state.tasks.findIndex((t) => t._id === action.payload._id);
      if (idx !== -1) state.tasks[idx] = action.payload;
    },
    taskDeletedLocally: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter((t) => t._id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearTasks,
  setFilters,
  setSelectedTaskId,
  moveTaskOptimistic,
  taskCreatedLocally,
  taskUpdatedLocally,
  taskDeletedLocally,
} = taskSlice.actions;

export default taskSlice.reducer;
