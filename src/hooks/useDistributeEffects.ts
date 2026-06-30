import type { Card, List as ListType } from "../types/board.types";
import { useState, useEffect } from "react";

export function getTargetListId(tasks: Card["tasks"]): string {
	const total = tasks.length;
	const completed = tasks.filter((t) => t.isCompleted).length;

	if (total === 0 || completed === 0) return "list-1";
	if (completed === total) return "list-3";
	return "list-2";
}

export function listsAreEqual(prev: ListType[], next: ListType[]): boolean {
	return next.every((newList, i) => {
		const old = prev[i];
		return (
			newList.id === old.id &&
			newList.cardIds.length === old.cardIds.length &&
			newList.cardIds.every((id, j) => id === old.cardIds[j])
		);
	});
}

export function redistributeCards(
	prevLists: ListType[],
	cards: Record<string, Card>,
): ListType[] {
	const next = prevLists.map((l) => ({ ...l, cardIds: [...l.cardIds] }));

	Object.values(cards).forEach((card) => {
		const targetListId = getTargetListId(card.tasks);

		const currentList = next.find((l) => l.cardIds.includes(card.id as string));
		if (!currentList) return;
		if (currentList.id === targetListId) return;

		const targetList = next.find((l) => l.id === targetListId);
		if (!targetList) return;

		currentList.cardIds = currentList.cardIds.filter((id) => id !== card.id);

		if (!targetList.cardIds.includes(card.id as string)) {
			targetList.cardIds.push(card.id as string);
		}
	});

	return next;
}

export default function useDistributeEffects(
	initialLists: ListType[],
	cards: Record<string, Card>,
) {
	const [lists, setLists] = useState<ListType[]>(() =>
		[...initialLists].sort((a, b) => a.position - b.position),
	);
	useEffect(() => {
		setLists((prevLists: ListType[]) => {
			const next = redistributeCards(prevLists, cards);

			return listsAreEqual(prevLists, next) ? prevLists : next;
		});
	}, [cards]);

	return lists;
}

	