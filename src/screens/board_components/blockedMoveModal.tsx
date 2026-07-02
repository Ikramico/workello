import type { Card } from "../../types/board.types";

interface Props {
	card: Card;
	reason: "done" | "overdue" | "backward" | "not-started";
	onDismiss: () => void;
}

const REASON_MESSAGES: Record<Props["reason"], string> = {
	done: "This card is finished and lives in Done. Uncheck a task first if you need to move it elsewhere.",
	overdue:
		"This card has a stale, unfinished task and belongs in Backlog until that task is resolved.",
	backward:
		"This card has some unfinished tasks and belongs in In Progress and those can't be undone.",
	"not-started":
		"This card has a stale, unfinished task and belongs in Backlog until that task is resolved.",
};

export default function BlockedMoveModal({ card, reason, onDismiss }: Props) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
			<div className="w-full max-w-sm rounded-2xl bg-[#1a1d27] border border-white/10 p-5">
				<h3 className="text-sm font-semibold text-slate-100 mb-1">
					Can't move "{card.title}"
				</h3>
				<p className="text-xs text-slate-400 mb-4">{REASON_MESSAGES[reason]}</p>

				<button
					type="button"
					onClick={onDismiss}
					className="w-full text-xs font-medium rounded-lg px-3 py-2 bg-indigo-500 text-white hover:bg-indigo-400">
					Got it
				</button>
			</div>
		</div>
	);
}
