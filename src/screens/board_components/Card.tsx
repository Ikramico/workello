import { useState } from "react";
import type { Card, Task } from "../../types/board.types";
import TaskItem from "./TaskItem";

interface Props {
	card: Card;
}

export default function CardItem({ card }: Props) {
	const [tasks, setTasks] = useState<Task[]>(card.tasks);

	function completeTask(taskId: string | number) {
		setTasks((prev) =>
			prev.map((t) => (t.id === taskId ? { ...t, isCompleted: true } : t)),
		);
	}

	const total = tasks.length;
	const done = tasks.filter((t) => t.isCompleted).length;
	const pct = total > 0 ? Math.round((done / total) * 100) : 0;
	const allDone = total > 0 && done === total;

	return (
		<div
			className="rounded-xl bg-[#22263a] border border-white/5
                    hover:border-indigo-500/40 transition-all duration-200 overflow-hidden">
			{/* Color bar */}
			<div
				className="h-0.5 w-full"
				style={{
					backgroundColor: card.color === "Black" ? "#6366f1" : card.color,
				}}
			/>

			<div className="p-3">
				{/* Title + position */}
				<div className="flex items-start justify-between gap-2 mb-1">
					<p className="text-sm font-semibold text-slate-100 leading-snug">
						{card.title}
					</p>
					<span
						className="text-[10px] font-mono text-slate-500 bg-white/5
                           rounded px-1.5 py-0.5 mt-0.5">
						#{card.position + 1}
					</span>
				</div>

				{/* Description */}
				<p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-3">
					{card.description}
				</p>

				{/* Tasks */}
				{total > 0 && (
					<div className="flex flex-col gap-1.5">
						{tasks.map((task) => (
							<TaskItem
								key={task.id}
								task={task}
								onComplete={() => completeTask(task.id)}
							/>
						))}

						{/* Progress bar — NOW works because tasks state lives here */}
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
			</div>
		</div>
	);
}
