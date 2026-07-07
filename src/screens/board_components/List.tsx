import { useDroppable } from "@dnd-kit/react";
import type { Card, List } from "../../types/board.types";
import CardItem from "./Card";

interface Props {
	list: List;
	cards: Card[];
	totalDone: number;
}

export default function List({ list, cards, totalDone }: Props) {
	const { ref, isDropTarget } = useDroppable({ id: list.id });
	return (
		<div
			ref={ref}
			className={`shrink-0 w-72 max-h-[80vh] rounded-2xl bg-[#1a1d27]
	border flex flex-col overflow-hidden
	${isDropTarget ? "border-indigo-500/50" : "border-white/5"}
	`}>
			{/* Header */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
				<div className="flex items-center gap-2">
					<span
						className="w-2 h-2 rounded-full"
						style={{ backgroundColor: list.color }}
					/>
					<h3 className="text-sm font-semibold text-slate-200 tracking-wide">
						{list.title}
					</h3>
				</div>

				<div className="flex items-center gap-2">
					<span className="text-[10px] text-emerald-400 font-medium">
						{totalDone} done
					</span>
					<span
						className="text-xs font-medium text-slate-500
                           bg-white/5 rounded-full px-2 py-0.5">
						{cards.length}
					</span>
				</div>
			</div>

			{/* Cards — scrollable list */}

			<div className="flex flex-col gap-3 p-3 overflow-y-auto flex-1 min-h-0">
				{cards.map((card) => (
					<CardItem key={card.id} card={card} />
				))}
			</div>
		</div>
	);
}
