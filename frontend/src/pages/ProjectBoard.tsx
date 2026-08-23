import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { useAppDispatch, useAppSelector } from '../store';
import {
  fetchProjectDetails,
  updateProjectApi,
  deleteProjectApi,
  clearCurrentProject,
} from '../store/slices/projectSlice';
import {
  clearTasks,
  fetchTasks,
  moveTaskOptimistic,
  updateTaskStatusApi,
} from '../store/slices/taskSlice';
import { Navbar } from '../components/Navbar';
import { KanbanColumn } from '../components/kanban/KanbanColumn';
import { TaskFilterBar } from '../components/kanban/TaskFilterBar';
import { CreateTaskModal } from '../components/kanban/CreateTaskModal';
import { TaskDetailModal } from '../components/kanban/TaskDetailModal';
import {
  ArrowLeft,
  UserPlus,
  Trash2,
  X,
  AlertTriangle,
  Edit,
} from 'lucide-react';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

export const ProjectBoard: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentProject, boards, isLoading: projectLoading } = useAppSelector(
    (state) => state.projects 
  );
  const { tasks } = useAppSelector((state) => state.tasks);

  // Modals state
  const [activeBoardModal, setActiveBoardModal] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  // Project Edit State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [updating, setUpdating] = useState(false);

  // Project Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (projectId) {
      dispatch(fetchProjectDetails(projectId));
      dispatch(fetchTasks({ projectId }));
    }
  }, [projectId, dispatch]);

  useEffect(() => {
    if (currentProject) {
      setEditTitle(currentProject.title);
      setEditDesc(currentProject.description || '');
    }
  }, [currentProject]);

  useEffect(() => {
  if (projectId) {
    // Clear previous project data immediately before fetching new data
    dispatch(clearCurrentProject());
    dispatch(clearTasks());

    dispatch(fetchProjectDetails(projectId));
    dispatch(fetchTasks({ projectId }));
  }

  // Cleanup when navigating away from the page
  return () => {
    dispatch(clearCurrentProject());
    dispatch(clearTasks());
  };
}, [projectId, dispatch]);

  // Determine user role in this project
  const userRole = currentProject?.members.find((m) => m.user._id === user?._id)?.role;
  const isOwner = userRole === 'owner' || currentProject?.owner._id === user?._id;
  const isAdminOrOwner = isOwner || userRole === 'admin';

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    const targetBoard = boards.find((b) => b._id === destination.droppableId);
    let newStatus: 'todo' | 'in_progress' | 'done' = 'todo';
    if (targetBoard) {
      const title = targetBoard.title.toLowerCase();
      if (title.includes('progress')) newStatus = 'in_progress';
      if (title.includes('done')) newStatus = 'done';
    }

    dispatch(
      moveTaskOptimistic({
        taskId: draggableId,
        newBoardId: destination.droppableId,
        newStatus,
        newIndex: destination.index,
      })
    );

    dispatch(
      updateTaskStatusApi({
        taskId: draggableId,
        boardId: destination.droppableId,
        status: newStatus,
        orderIndex: destination.index,
      })
    );
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !projectId) return;
    setInviting(true);

    try {
      await api.post(`/projects/${projectId}/invite`, {
        email: inviteEmail,
        role: 'member',
      });
      toast.success(`Invite sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteModalOpen(false);
      dispatch(fetchProjectDetails(projectId));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to invite user');
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !projectId) return;
    setUpdating(true);

    try {
      const res = await dispatch(
        updateProjectApi({
          projectId,
          title: editTitle,
          description: editDesc,
        })
      );
      if (updateProjectApi.fulfilled.match(res)) {
        toast.success('Project updated successfully');
        setEditModalOpen(false);
      } else {
        toast.error((res.payload as string) || 'Failed to update project');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectId) return;
    setDeleting(true);

    try {
      const res = await dispatch(deleteProjectApi(projectId));
      if (deleteProjectApi.fulfilled.match(res)) {
        toast.success('Project deleted successfully');
        setDeleteModalOpen(false);
        navigate('/');
      } else {
        toast.error((res.payload as string) || 'Failed to delete project');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setDeleting(false);
    }
  };

  if (projectLoading || !currentProject) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
          Loading workspace...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col h-screen overflow-hidden">
      <Navbar />

      <main className="flex-1 flex flex-col px-4 sm:px-6 lg:px-8 py-4 overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">{currentProject.title}</h1>
              <p className="text-xs text-slate-400">
                {currentProject.description || 'Kanban workspace'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdminOrOwner && (
              <>
                <button
                  onClick={() => setInviteModalOpen(true)}
                  className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs px-3 py-2 rounded-lg transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Invite</span>
                </button>

                <button
                  onClick={() => setEditModalOpen(true)}
                  className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs px-3 py-2 rounded-lg transition-colors"
                  title="Edit Project Details"
                >
                  <Edit className="w-3.5 h-3.5 text-slate-400" />
                  <span>Edit</span>
                </button>
              </>
            )}

            {isOwner && (
              <button
                onClick={() => setDeleteModalOpen(true)}
                className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 text-xs px-3 py-2 rounded-lg transition-colors"
                title="Delete Project"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <TaskFilterBar projectId={currentProject._id} />

        {/* Kanban Drag-Drop View */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 h-full items-start">
              {boards.map((board) => {
                const columnTasks = tasks.filter((t) => t.boardId === board._id);
                return (
                  <KanbanColumn
                    key={board._id}
                    board={board}
                    tasks={columnTasks}
                    onAddTask={(boardId) => setActiveBoardModal(boardId)}
                  />
                );
              })}
            </div>
          </DragDropContext>
        </div>
      </main>

      {/* Task Creation Modal */}
      {activeBoardModal && (
        <CreateTaskModal
          projectId={currentProject._id}
          defaultBoardId={activeBoardModal}
          onClose={() => setActiveBoardModal(null)}
        />
      )}

      {/* Task Details Modal */}
      <TaskDetailModal />

      {/* Edit Project Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Edit Project Details</h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Project Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <div className="p-2 bg-rose-500/10 rounded-lg border border-rose-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Delete Entire Project</h4>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Are you sure you want to delete <strong className="text-slate-200">"{currentProject.title}"</strong>? All associated boards, tasks, and comments will be permanently purged.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProject}
                disabled={deleting}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Invite Project Member</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter registered user email to collaborate on this board.
            </p>

            <form onSubmit={handleInvite} className="space-y-3">
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {inviting ? 'Inviting...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};