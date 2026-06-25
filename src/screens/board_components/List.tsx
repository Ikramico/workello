import type { List as ListType } from "../../types/board.types";
import type { Card as CardType } from "../../types/board.types";
import Card from "./Card";


interface Props {
	list: ListType;
	cards: CardType[];
}

export default function List({ list, cards }: Props) {
	return (
		<div
			className="flex-shrink-0 w-72 rounded-2xl bg-[#1a1d27]
                    border border-white/5 flex flex-col overflow-hidden">
			{/* Header */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
				<div className="flex items-center gap-2">
					<span
						className="w-2 h-2 rounded-full"
						style={{ backgroundColor: list.color }}
					/>
					<h3 className="text-sm font-semibold text-slate-200 tracking-wide">
						{list.title}
					</h3>
				</div>
				<span
					className="text-xs font-medium text-slate-500
                         bg-white/5 rounded-full px-2 py-0.5">
					{cards.length}
				</span>
			</div>

			{/* Cards */}
			<div className="flex flex-col gap-3 p-3 overflow-y-auto max-h-[70vh]">
				{cards.map((card) => (
					<Card key={card.id} card={card} />
				))}
			</div>
		</div>
	);
}
