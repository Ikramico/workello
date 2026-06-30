import List from "./List";
import useBoardState from "../../hooks/useBoardState";
import useDistributeEffects from "../../hooks/useDistributeEffects";
import { mockBoard } from "../../data/mockData";




export default function Board() {
	
	const { cards, completeTask } = useBoardState();
	const lists = useDistributeEffects(mockBoard.lists, cards);

	
	
	
	return (
		<div className="flex gap-4 overflow-x-auto items-start pb-6 px-8 py-10">
			{lists.map((list) => {
				const listCards = list.cardIds
					.map((id) => cards[id])
					.filter(Boolean)
					.sort((a, b) => a.position - b.position);

					const totalDone = listCards.reduce(
					(sum, card) => sum + card.tasks.filter((t) => t.isCompleted).length,
					0, 
				);

				return (
					<List
						key={list.id} 
						list={list}
						cards={listCards}
						totalDone={totalDone}
						onCompleteTask={completeTask}
					/>
				);
			})}
		</div>
	);
}