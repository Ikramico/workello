import type { Card } from "../../types/board.types";

interface Props {
	card: Card;
	onCompleteTask: (cardId: string | number, taskId: string | number) => void;
	onCancel: () => void;
	onConfirm: () => void;
}

export default function TaskCompletionModal({
	card,
	onCompleteTask,
	onCancel,
	onConfirm,
}: Props) {
	const total = card.tasks.length;
	const done = card.tasks.filter((t) => t.isCompleted).length;
	const allDone = total === 0 || done === total;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
			<div className="w-full max-w-sm rounded-2xl bg-[#1a1d27] border border-white/10 p-5">
				<h3 className="text-sm font-semibold text-slate-100 mb-1">
					Finish "{card.title}" first
				</h3>
				<p className="text-xs text-slate-400 mb-4">
					All tasks need to be checked off before this card can move to Done.
				</p>

				{total > 0 && (
					<div className="flex flex-col gap-2 max-h-64 overflow-y-auto mb-4">
						{card.tasks.map((task) => (
							<label
								key={task.id}
								className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 border
                  ${
										task.isCompleted
											? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"
											: "border-white/5 bg-white/5 text-slate-300"
									}`}>
								<input
									type="checkbox"
									checked={task.isCompleted}
									disabled={task.isCompleted}
									onChange={() => onCompleteTask(card.id, task.id)}
									className="accent-indigo-500"
								/>
								<span className={task.isCompleted ? "line-through" : ""}>
									{task.title}
								</span>
							</label>
						))}
					</div>
				)}

				<div className="flex gap-2">
					<button
						type="button"
						onClick={onCancel}
						className="flex-1 text-xs font-medium rounded-lg px-3 py-2 border border-white/10 text-slate-300 hover:bg-white/5">
						Back to previous list
					</button>
					<button
						type="button"
						onClick={onConfirm}
						disabled={!allDone}
						className={`flex-1 text-xs font-medium rounded-lg px-3 py-2
              ${
								allDone
									? "bg-emerald-500 text-white hover:bg-emerald-400"
									: "bg-slate-700 text-slate-500 cursor-not-allowed"
							}`}>
						Move to Done
					</button>
				</div>
			</div>
		</div>
	);
}
