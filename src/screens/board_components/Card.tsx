import type { Card as CardType } from "../../types/board.types";
// import { TaskItem } from "./TaskItem";

interface Props {
	card: CardType;
}

export default function  Card({ card }: Props) {
	const total = card.tasks.length;
	const done = card.tasks.filter((t) => t.isCompleted).length;
	const pct = total > 0 ? Math.round((done / total) * 100) : 0;
	const allDone = total > 0 && done === total;

	return (
		<div
			className="rounded-xl bg-[#22263a] border border-white/5
                    hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5
                    transition-all duration-200 overflow-hidden">
			{/* Color bar */}
			<div
				className="h-0.5 w-full"
				style={{
					backgroundColor: card.color === "Black" ? "#6366f1" : card.color,
				}}
			/>

			<div className="p-3">
				{/* Title + position badge */}
				<div className="flex items-start justify-between gap-2 mb-1">
					<p className="text-sm font-semibold text-slate-100 leading-snug">
						{card.title}
					</p>
					<span
						className="flex-shrink-0 text-[10px] font-mono
                           text-slate-500 bg-white/5 rounded px-1.5 py-0.5 mt-0.5">
						#{card.position + 1}
					</span>
				</div>

				{/* Description */}
				<p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-3">
					{card.description}
				</p>

				{/* Tasks + progress */}
				
			</div>
		</div>
	);
}
