import type { Task } from "../../types/board.types";

interface Props {
	task: Task;
	onComplete: () => void;
}

export default function TaskItem({ task, onComplete }: Props) {
	return (
		<button
			onClick={onComplete}
			disabled={task.isCompleted}
			className={`flex items-start gap-2 w-full text-left rounded-lg px-2 py-1.5
                  transition-colors duration-150
                  ${
										task.isCompleted
											? "opacity-60 cursor-not-allowed"
											: "hover:bg-white/5 cursor-pointer"
									}`}>
			<div
				className={`mt-0.5 w-3.5 h-3.5 shrink-0 rounded
                       flex items-center justify-center border transition-colors duration-200
                       ${
													task.isCompleted
														? "bg-emerald-500 border-emerald-500"
														: "border-slate-600 bg-transparent"
												}`}>
				{task.isCompleted && (
					<svg className="w-2 h-2 text-white" viewBox="0 0 10 10" fill="none">
						<path
							d="M1.5 5l2.5 2.5 4.5-4.5"
							stroke="currentColor"
							strokeWidth="1.8"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				)}
			</div>

			<div className="flex flex-col min-w-0">
				<span
					className={`text-xs font-medium leading-tight
                          ${
														task.isCompleted
															? "line-through text-slate-500"
															: "text-slate-300"
													}`}>
					{task.title}
				</span>
				<span className="text-[11px] text-slate-500 leading-tight truncate">
					{task.description}
				</span>
			</div>

			{task.isCompleted && (
				<span className="ml-auto text-[10px] text-slate-600">🔒</span>
			)}
		</button>
	);
}
