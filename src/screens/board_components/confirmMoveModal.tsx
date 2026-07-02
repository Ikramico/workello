import type { Card } from "../../types/board.types";

interface Props {
	card: Card;
	message: string;
	onCancel: () => void;
	onConfirm: () => void;
}

export default function ConfirmMoveModal({
	card,
	message,
	onCancel,
	onConfirm,
}: Props) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
			<div className="w-full max-w-sm rounded-2xl bg-[#1a1d27] border border-white/10 p-5">
				<h3 className="text-sm font-semibold text-slate-100 mb-1">
					{card.title}
				</h3>
				<p className="text-xs text-slate-400 mb-4">{message}</p>

				<div className="flex gap-2">
					<button
						type="button"
						onClick={onCancel}
						className="flex-1 text-xs font-medium rounded-lg px-3 py-2 border border-white/10 text-slate-300 hover:bg-white/5">
						Cancel
					</button>
					<button
						type="button"
						onClick={onConfirm}
						className="flex-1 text-xs font-medium rounded-lg px-3 py-2 bg-indigo-500 text-white hover:bg-indigo-400">
						Yes, move it
					</button>
				</div>
			</div>
		</div>
	);
}
