import type { Card, List } from "../../types/board.types";
import CardItem from "./Card";

interface Props {
	list: List;
	cards: Card[];
	totalDone: number;
	onCompleteTask: (cardId: string | number, taskId: string | number) => void;
	openCardId: string | number | null;
	onToggleCard: (cardId: string | number) => void;
}

export default function List({
	list,
	cards,
	totalDone,
	onCompleteTask,
	openCardId,
	onToggleCard,
}: Props) {
	return (
		<div
			className="shrink-0 w-72 max-h-[80vh] rounded-2xl bg-[#1a1d27]
                    border border-white/5 flex flex-col overflow-hidden">
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
					<CardItem
						key={card.id}
						card={card}
						onCompleteTask={onCompleteTask}
						isOpen={openCardId === card.id}
						onToggle={() => onToggleCard(card.id)}
					/>
				))}
			</div>
		</div>
	);
}
