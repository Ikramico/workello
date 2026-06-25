
// import { List } from "./List";

import { mockBoard, mockCards } from "../../data/mockData";
import List from "./List";

export default function Board() {
	const sortedLists = [...mockBoard.lists].sort(
		(a, b) => a.position - b.position,
	);

	return (
		<div className="flex gap-4 overflow-x-auto items-start pb-6 px-8 py-10">
			{sortedLists.map((list) => {
				const cards = list.cardIds
					.map((id) => mockCards[id])
					.filter(Boolean)
					.sort((a, b) => a.position - b.position);

				return <List key={list.id} list={list} cards={cards} />;
			})}
		</div>
	);
}
