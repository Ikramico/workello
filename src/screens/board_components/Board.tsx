import List from "./List";
import { mockBoard } from "../../data/mockData";
import useBoardState from "../../hooks/useBoardState";
import { useEffect, useState } from "react";
import type {  Card, List as ListType } from "../../types/board.types";

 function getTargetListId(tasks: Card["tasks"]): string {
		const total = tasks.length;
		const completed = tasks.filter((t) => t.isCompleted).length;

		if (total === 0 || completed === 0) return "list-1"; // To Do
		if (completed === total) return "list-3"; // Done
		return "list-2"; // In Progress
 }

 function listsAreEqual(prev: ListType[], next: ListType[]): boolean {
		return next.every((newList, i) => {
			const old = prev[i];
			return (
				newList.id === old.id &&
				newList.cardIds.length === old.cardIds.length &&
				newList.cardIds.every((id, j) => id === old.cardIds[j])
			);
		});
 }

 function redistributeCards(
		prevLists: ListType[],
		cards: Record<string, Card>,
 ): ListType[] {
		// Deep-clone: spread the array AND spread each list's cardIds array.
		const next = prevLists.map((l) => ({ ...l, cardIds: [...l.cardIds] }));

		Object.values(cards).forEach((card) => {
			const targetListId = getTargetListId(card.tasks);

			// Find the list that currently holds this card.
			const currentList = next.find((l) =>
				l.cardIds.includes(card.id as string),
			);
			if (!currentList) return; // Card not found — skip.
			if (currentList.id === targetListId) return; // Already in the right list — skip.

			const targetList = next.find((l) => l.id === targetListId);
			if (!targetList) return; // Target list doesn't exist — skip.

			// Remove the card from the old list …
			currentList.cardIds = currentList.cardIds.filter((id) => id !== card.id);
			// … and append it to the new list (guard against duplicates just in case).
			if (!targetList.cardIds.includes(card.id as string)) {
				targetList.cardIds.push(card.id as string);
			}
		});

		return next;
 }

export default function Board() {
	// Pull live card data and the task-completion action from our custom hook.
	const { cards, completeTask } = useBoardState();

	// Local state for the three columns (To Do / In Progress / Done).
	// We keep this in useState — not derived on every render — because we
	// need to mutate cardIds when a task is toggled.
	const [lists, setLists] = useState<ListType[]>(() =>
		// Sort once on mount so the columns appear in the right order.
		[...mockBoard.lists].sort((a, b) => a.position - b.position),
	);

	// Whenever any card changes (task checked/unchecked), recalculate which
	// column every card belongs to and update state if anything actually moved.
	useEffect(() => {
		setLists((prevLists) => {
			const next = redistributeCards(prevLists, cards);

			// Return the PREVIOUS reference if nothing changed — this tells React
			// "nothing to do" and skips an unnecessary re-render.
			return listsAreEqual(prevLists, next) ? prevLists : next;
		});
	}, [cards]); // ← dependency array: re-run this effect only when 'cards' changes

	return (
		<div className="flex gap-4 overflow-x-auto items-start pb-6 px-8 py-10">
			{lists.map((list) => {
				// Resolve card IDs → actual card objects, drop any that are missing,
				// then sort by position so cards appear in a stable order.
				const listCards = list.cardIds
					.map((id) => cards[id])
					.filter(Boolean)
					.sort((a, b) => a.position - b.position);

				// Count completed tasks across every card in this column — used by
				// <List> to show a progress summary in the column header.
				const totalDone = listCards.reduce(
					(sum, card) => sum + card.tasks.filter((t) => t.isCompleted).length,
					0, // ← initial value of 'sum'
				);

				return (
					<List
						key={list.id} // React needs a stable key to track list identity
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