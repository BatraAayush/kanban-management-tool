import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import type { IBoard, ITask } from '../../types';
import { TaskCard } from './TaskCard';
import { Plus } from 'lucide-react';
import { cn } from '../../utils/cn';

interface Props {
  board: IBoard;
  tasks: ITask[];
  onAddTask: (boardId: string) => void;
}

export const KanbanColumn: React.FC<Props> = ({ board, tasks, onAddTask }) => {
  return (
    <div className="w-80 shrink-0 bg-slate-900/50 border border-slate-800 rounded-xl flex flex-col max-h-full">
      {/* Column Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-200">{board.title}</h3>
          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-medium">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(board._id)}
          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
          title="Add task"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={board._id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'p-2.5 flex-1 overflow-y-auto min-h-[150px] transition-colors rounded-b-xl',
              snapshot.isDraggingOver ? 'bg-slate-800/40 ring-1 ring-indigo-500/30' : ''
            )}
          >
            {tasks.map((task, idx) => (
              <TaskCard key={task._id} task={task} index={idx} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};