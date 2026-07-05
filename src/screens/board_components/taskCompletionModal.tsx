import type { Card } from "../../types/board.types";

interface Props {
	card: Card;
	onCompleteTask: (cardId: string | number, taskId: string | number) => void;
	onCancel: () => void;
	onConfirm: () => void;
	/** Where confirming will move the card, e.g. "Done" or "In Progress". */
	targetListLabel?: string;
	/**
	 * true  -> every task must be checked off (Done flow)
	 * false -> at least one task must be checked off (Start flow)
	 */
	requireAllTasks?: boolean;
}

export default function TaskCompletionModal({
	card,
	onCompleteTask,
	onCancel,
	onConfirm,
	targetListLabel = "Done",
	requireAllTasks = true,
}: Props) {
	const total = card.tasks.length;
	const done = card.tasks.filter((t) => t.isCompleted).length;
	const allDone = total === 0 || done === total;
	const isReady = requireAllTasks ? allDone : done > 0;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
			<div className="w-full max-w-sm rounded-2xl bg-[#1a1d27] border border-white/10 p-5">
				<h3 className="text-sm font-semibold text-slate-100 mb-1">
					Finish "{card.title}" first
				</h3>
				<p className="text-xs text-slate-400 mb-4">
					{requireAllTasks
						? `All tasks need to be checked off before this card can move to ${targetListLabel}.`
						: `At least one task needs to be checked off before this card can move to ${targetListLabel}.`}
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
						disabled={!isReady}
						className={`flex-1 text-xs font-medium rounded-lg px-3 py-2
              ${
								isReady
									? "bg-emerald-500 text-white hover:bg-emerald-400"
									: "bg-slate-700 text-slate-500 cursor-not-allowed"
							}`}>
						Move to {targetListLabel}
					</button>
				</div>
			</div>
		</div>
	);
}
