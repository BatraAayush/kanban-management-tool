import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setFilters, fetchTasks } from '../../store/slices/taskSlice';
import { Search, X } from 'lucide-react';

interface Props {
  projectId: string;
}

export const TaskFilterBar: React.FC<Props> = ({ projectId }) => {
  const dispatch = useAppDispatch();
  const { filters } = useAppSelector((state) => state.tasks);
  const { currentProject } = useAppSelector((state) => state.projects);

  const [searchTerm, setSearchTerm] = useState(filters.search);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      dispatch(setFilters({ search: searchTerm }));
      dispatch(fetchTasks({ projectId, filters: { ...filters, search: searchTerm } }));
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, dispatch, projectId]);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    dispatch(setFilters({ [key]: value }));
    dispatch(fetchTasks({ projectId, filters: newFilters }));
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    dispatch(setFilters({ search: '', status: '', priority: '', assignedTo: '' }));
    dispatch(fetchTasks({ projectId, filters: { search: '', status: '', priority: '', assignedTo: '' } }));
  };

  const hasActiveFilters = Boolean(filters.search || filters.status || filters.priority || filters.assignedTo);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800 mb-6">
      <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
        {/* Search Input */}
        <div className="relative w-full max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tasks..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Priority Filter */}
        <select
          value={filters.priority}
          onChange={(e) => handleFilterChange('priority', e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>

        {/* Assignee Filter */}
        <select
          value={filters.assignedTo}
          onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Assignees</option>
          {currentProject?.members.map((m) => (
            <option key={m.user._id} value={m.user._id}>
              {m.user.name}
            </option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <button
          onClick={handleClearFilters}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded bg-slate-800/80 hover:bg-slate-800 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          <span>Clear Filters</span>
        </button>
      )}
    </div>
  );
};