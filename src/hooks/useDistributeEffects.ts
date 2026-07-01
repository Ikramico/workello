import type { Card, List as ListType } from "../types/board.types";
import { useState, useEffect, useRef } from "react";

// Tune this — anything incomplete and older than this gets bumped to Backlog
const STALE_THRESHOLD_MS = 3 * 24 * 60 * 60 * 1000;

type TaskItem = Card["tasks"][number];

export function isTaskOverdue(task: TaskItem): boolean {
	if (task.isCompleted || !task.createdAt) return false;
	return Date.now() - new Date(task.createdAt).getTime() > STALE_THRESHOLD_MS;
}

export function getTargetListId(tasks: Card["tasks"]): string {
	const total = tasks.length;
	const completed = tasks.filter((t) => t.isCompleted).length;

	// Finished work always lands in Done, no matter how long it took
	if (total > 0 && completed === total) return "list-3";

	// Stuck too long on an incomplete task -> Backlog
	if (tasks.some(isTaskOverdue)) return "list-4";

	if (total === 0 || completed === 0) return "list-1";
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

	// Skip redistribution if this exact cards reference was already processed
	const prevCardsRef = useRef<Record<string, Card> | null>(null);

	useEffect(() => {
		if (prevCardsRef.current === cards) return;
		prevCardsRef.current = cards;

		setLists((prevLists: ListType[]) => {
			const next = redistributeCards(prevLists, cards);
			return listsAreEqual(prevLists, next) ? prevLists : next;
		});
	}, [cards]);

	function moveCard(cardId: string, targetListId: string) {
		setLists((prevLists) => {
			const next = prevLists.map((l) => ({ ...l, cardIds: [...l.cardIds] }));

			const sourceList = next.find((l) => l.cardIds.includes(cardId));
			const targetList = next.find((l) => l.id === targetListId);

			if (!sourceList || !targetList || sourceList.id === targetListId) {
				return prevLists;
			}

			sourceList.cardIds = sourceList.cardIds.filter((id) => id !== cardId);
			if (!targetList.cardIds.includes(cardId)) {
				targetList.cardIds.push(cardId);
			}

			return next;
		});
	}

	return [lists, moveCard] as const;
}
