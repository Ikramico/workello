import { useDraggable } from "@dnd-kit/react";
import type { Card } from "../../types/board.types";
import TaskItem from "./TaskItem";
import {
	useBoardActions,
	useBoardUI,
} from "../../data/contexts/useBoardContext";

interface Props {
	card: Card;
}

export default function CardItem({ card }: Props) {
	const { completeTask } = useBoardActions();
	const { openCardId, toggleCard } = useBoardUI();
	const isOpen = openCardId === card.id;

	const total = card.tasks.length;
	const done = card.tasks.filter((t) => t.isCompleted).length;
	const pct = total > 0 ? Math.round((done / total) * 100) : 0;
	const allDone = total > 0 && done === total;

	const { ref, handleRef, isDragging } = useDraggable({ id: card.id });

	return (
		<div
			ref={ref}
			className={`rounded-xl bg-[#22263a] border transition-all duration-200 overflow-hidden
                  ${isDragging ? "opacity-50 " : ""}
                  ${isOpen ? "border-indigo-500/50" : "border-white/5 hover:border-indigo-500/40"}`}>
			{/* Color bar */}
			<div
				className="h-0.5 w-full"
				style={{
					backgroundColor: card.color === "Black" ? "#6366f1" : card.color,
				}}
			/>

			<button
				type="button"
				onClick={() => toggleCard(card.id)}
				className="w-full text-left p-3 cursor-pointer">
				{/* Title + position */}
				<div className="flex items-start justify-between gap-2 mb-1">
					{/* Drag handle */}
					<span
						ref={handleRef}
						onClick={(e) => e.stopPropagation()}
						className="shrink-0 mt-0.5 cursor-grab active:cursor-grabbing touch-none text-slate-600 hover:text-slate-400">
						<svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
							<circle cx="2" cy="2" r="1.4" />
							<circle cx="8" cy="2" r="1.4" />
							<circle cx="2" cy="7" r="1.4" />
							<circle cx="8" cy="7" r="1.4" />
							<circle cx="2" cy="12" r="1.4" />
							<circle cx="8" cy="12" r="1.4" />
						</svg>
					</span>
					<p className="text-sm font-semibold text-slate-100 leading-snug flex-1">
						{card.title}
					</p>
					<div className="flex items-center gap-1.5 mt-0.5 shrink-0">
						<span
							className="text-[10px] font-mono text-slate-500 bg-white/5
                           rounded px-1.5 py-0.5">
							#{card.position + 1}
						</span>
						<svg
							className={`w-3 h-3 text-slate-500 transition-transform duration-200
                          ${isOpen ? "rotate-180" : ""}`}
							viewBox="0 0 12 12"
							fill="none">
							<path
								d="M2.5 4.5L6 8l3.5-3.5"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</div>
				</div>

				{/* Description — full when open, clamped when collapsed */}
				<p
					className={`text-xs text-slate-400 leading-relaxed ${isOpen ? "" : "line-clamp-2"}`}>
					{card.description}
				</p>
			</button>

			{/* Tasks — only mounted + scrollable when open */}
			{isOpen && total > 0 && (
				<div className="px-3 pb-3">
					<div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
						{card.tasks.map((task) => (
							<TaskItem
								key={task.id}
								task={task}
								onComplete={() => completeTask(card.id, task.id)}
							/>
						))}
					</div>

					<div className="mt-2 pt-2 border-t border-white/5">
						<div className="flex items-center justify-between mb-1">
							<span className="text-[10px] text-slate-500">
								{done}/{total} completed
							</span>
							{allDone ? (
								<span className="text-[10px] font-semibold text-emerald-400">
									All done ✓
								</span>
							) : (
								<span className="text-[10px] text-slate-500">{pct}%</span>
							)}
						</div>
						<div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
							<div
								className={`h-full rounded-full transition-all duration-500
                              ${allDone ? "bg-emerald-500" : "bg-indigo-500"}`}
								style={{ width: `${pct}%` }}
							/>
						</div>
					</div>
				</div>
			)}

			{/* Collapsed summary strip */}
			{!isOpen && total > 0 && (
				<div className="px-3 pb-3 -mt-1">
					<div className="flex items-center justify-between mb-1">
						<span className="text-[10px] text-slate-500">
							{done}/{total} tasks
						</span>
						<span className="text-[10px] text-slate-500">{pct}%</span>
					</div>
					<div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
						<div
							className={`h-full rounded-full ${allDone ? "bg-emerald-500" : "bg-indigo-500"}`}
							style={{ width: `${pct}%` }}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
