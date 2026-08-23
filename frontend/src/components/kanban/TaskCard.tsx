import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import type { ITask } from '../../types';
import { useAppDispatch } from '../../store';
import { setSelectedTaskId } from '../../store/slices/taskSlice';
import { Calendar, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

interface Props {
  task: ITask;
  index: number;
}

const PRIORITY_BADGES = {
  low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  medium: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  high: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  urgent: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

export const TaskCard: React.FC<Props> = ({ task, index }) => {
  const dispatch = useAppDispatch();

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => dispatch(setSelectedTaskId(task._id))}
          className={cn(
            'bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 mb-2.5 cursor-pointer select-none transition-all shadow-sm group hover:border-indigo-500/40',
            snapshot.isDragging ? 'rotate-1 shadow-2xl ring-2 ring-indigo-500/50 scale-[1.02] bg-slate-900 z-50' : ''
          )}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span
              className={cn(
                'text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border',
                PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.medium
              )}
            >
              {task.priority}
            </span>

            {task.dueDate && (
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              </div>
            )}
          </div>

          <h4 className="text-sm font-medium text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-2">
            {task.title}
          </h4>

          {task.description && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.description}</p>
          )}

          <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {task.assignedTo ? (
                <div
                  className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-[10px] font-bold"
                  title={`Assigned to ${task.assignedTo.name}`}
                >
                  {task.assignedTo.name.charAt(0).toUpperCase()}
                </div>
              ) : (
                <span className="text-[11px] text-slate-500 italic">Unassigned</span>
              )}
            </div>

            <div className="flex items-center gap-2 text-slate-500 text-[11px]">
              {task.activityLogs?.length > 0 && (
                <div className="flex items-center gap-0.5">
                  <AlertCircle className="w-3 h-3" />
                  <span>{task.activityLogs.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};