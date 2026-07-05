import { useReducer, useCallback } from "react";
import type { Card, List as ListType } from "../types/board.types";
import { redistributeCards, listsAreEqual } from "./useDistributeEffects";

const TODO_LIST_ID = "list-1";
const IN_PROGRESS_LIST_ID = "list-2";
const DONE_LIST_ID = "list-3";
const BACKLOG_LIST_ID = "list-4";

type PendingMove = {
	cardId: string;
	targetListId: string;
} | null;

type BlockedMove = {
	cardId: string;
	reason: "done" | "overdue" | "backward" | "not-started";
} | null;

interface BoardState {
	cards: Record<string | number, Card>;
	lists: ListType[];
	pendingCompletion: PendingMove;
	pendingConfirm: PendingMove;
	blockedMove: BlockedMove;
}

type BoardAction =
	| { type: "COMPLETE_TASK"; cardId: string | number; taskId: string | number }
	| { type: "REQUEST_MOVE"; cardId: string; targetListId: string }
	| { type: "CONFIRM_COMPLETION" }
	| { type: "CANCEL_COMPLETION" }
	| { type: "CONFIRM_BACKLOG_MOVE" }
	| { type: "CANCEL_BACKLOG_MOVE" }
	| { type: "DISMISS_BLOCKED_MOVE" };

// ---- pure helpers (ported from useCardMoveGuard.ts, now data-in/data-out) ----

function findListIdForCard(lists: ListType[], cardId: string) {
	return lists.find((l) => l.cardIds.includes(cardId))?.id;
}

function isCardFullyDone(cards: BoardState["cards"], cardId: string) {
	const card = cards[cardId];
	const total = card?.tasks.length ?? 0;
	const done = card?.tasks.filter((t) => t.isCompleted).length ?? 0;
	return total > 0 && done === total;
}

function isCardAllPending(cards: BoardState["cards"], cardId: string) {
	const card = cards[cardId];
	const total = card?.tasks.length ?? 0;
	const done = card?.tasks.filter((t) => t.isCompleted).length ?? 0;
	return total > 0 && done === 0;
}

function moveCardInLists(
	lists: ListType[],
	cardId: string,
	targetListId: string,
): ListType[] {
	const next = lists.map((l) => ({ ...l, cardIds: [...l.cardIds] }));

	const sourceList = next.find((l) => l.cardIds.includes(cardId));
	const targetList = next.find((l) => l.id === targetListId);

	if (!sourceList || !targetList || sourceList.id === targetListId) {
		return lists;
	}

	sourceList.cardIds = sourceList.cardIds.filter((id) => id !== cardId);
	if (!targetList.cardIds.includes(cardId)) {
		targetList.cardIds.push(cardId);
	}

	return next;
}

// Decides the outcome of a requested move: direct move, one of the two
// confirmation modals, a block, or nothing. Pure — no setState calls,
// just returns what the reducer should do.
type MoveOutcome =
	| { kind: "move" }
	| { kind: "confirm-backlog" }
	| { kind: "confirm-completion" }
	| { kind: "blocked"; reason: NonNullable<BlockedMove>["reason"] };

function decideMoveOutcome(
	cards: BoardState["cards"],
	cardId: string,
	sourceListId: string,
	targetListId: string,
): MoveOutcome {
	if (isCardFullyDone(cards, cardId) && targetListId !== DONE_LIST_ID) {
		return { kind: "blocked", reason: "done" };
	}

	if (sourceListId === IN_PROGRESS_LIST_ID && targetListId === TODO_LIST_ID) {
		return { kind: "blocked", reason: "backward" };
	}

	if (
		sourceListId === BACKLOG_LIST_ID &&
		targetListId === IN_PROGRESS_LIST_ID &&
		isCardAllPending(cards, cardId)
	) {
		return { kind: "blocked", reason: "not-started" };
	}

	if (sourceListId === TODO_LIST_ID && targetListId === BACKLOG_LIST_ID) {
		return { kind: "confirm-backlog" };
	}

	if (targetListId === DONE_LIST_ID && !isCardFullyDone(cards, cardId)) {
		return { kind: "confirm-completion" };
	}

	return { kind: "move" };
}

// ---- reducer ----

function boardReducer(state: BoardState, action: BoardAction): BoardState {
	switch (action.type) {
		case "COMPLETE_TASK": {
			const { cardId, taskId } = action;
			const card = state.cards[cardId];
			if (!card) return state;

			const task = card.tasks.find((t) => t.id === taskId);
			if (!task || task.isCompleted) return state; // can't reverse

			const nextCards = {
				...state.cards,
				[cardId]: {
					...card,
					tasks: card.tasks.map((t) =>
						t.id === taskId ? { ...t, isCompleted: true } : t,
					),
				},
			};

			// Redistribute in the SAME transition — no effect, no lagging render.
			const redistributed = redistributeCards(state.lists, nextCards);
			const nextLists = listsAreEqual(state.lists, redistributed)
				? state.lists
				: redistributed;

			return { ...state, cards: nextCards, lists: nextLists };
		}

		case "REQUEST_MOVE": {
			const { cardId, targetListId } = action;
			const sourceListId = String(findListIdForCard(state.lists, cardId));
			if (!sourceListId || sourceListId === targetListId) return state;

			const outcome = decideMoveOutcome(
				state.cards,
				cardId,
				sourceListId,
				targetListId,
			);

			switch (outcome.kind) {
				case "blocked":
					return {
						...state,
						blockedMove: { cardId, reason: outcome.reason },
					};
				case "confirm-backlog":
					return {
						...state,
						pendingConfirm: { cardId, targetListId },
					};
				case "confirm-completion":
					return {
						...state,
						pendingCompletion: { cardId, targetListId },
					};
				case "move":
					return {
						...state,
						lists: moveCardInLists(state.lists, cardId, targetListId),
					};
				default:
					return state;
			}
		}

		case "CONFIRM_COMPLETION": {
			if (!state.pendingCompletion) return state;
			const { cardId, targetListId } = state.pendingCompletion;
			return {
				...state,
				lists: moveCardInLists(state.lists, cardId, targetListId),
				pendingCompletion: null,
			};
		}

		case "CANCEL_COMPLETION":
			return { ...state, pendingCompletion: null };

		case "CONFIRM_BACKLOG_MOVE": {
			if (!state.pendingConfirm) return state;
			const { cardId, targetListId } = state.pendingConfirm;
			return {
				...state,
				lists: moveCardInLists(state.lists, cardId, targetListId),
				pendingConfirm: null,
			};
		}

		case "CANCEL_BACKLOG_MOVE":
			return { ...state, pendingConfirm: null };

		case "DISMISS_BLOCKED_MOVE":
			return { ...state, blockedMove: null };

		default:
			return state;
	}
}

interface DragOperationEvent {
	operation: {
		source: { id: string | number } | null;
		target: { id: string | number } | null;
	};
}

export default function useBoardReducer(
	initialCards: Record<string | number, Card>,
	initialLists: ListType[],
) {
	const [state, dispatch] = useReducer(boardReducer, {
		cards: initialCards,
		lists: [...initialLists].sort((a, b) => a.position - b.position),
		pendingCompletion: null,
		pendingConfirm: null,
		blockedMove: null,
	});

	const completeTask = useCallback(
		(cardId: string | number, taskId: string | number) =>
			dispatch({ type: "COMPLETE_TASK", cardId, taskId }),
		[],
	);

	const handleDragEnd = useCallback((event: DragOperationEvent) => {
		const { source, target } = event.operation;
		if (!source || !target) return;
		dispatch({
			type: "REQUEST_MOVE",
			cardId: String(source.id),
			targetListId: String(target.id),
		});
	}, []);

	const confirmCompletion = useCallback(
		() => dispatch({ type: "CONFIRM_COMPLETION" }),
		[],
	);
	const cancelCompletion = useCallback(
		() => dispatch({ type: "CANCEL_COMPLETION" }),
		[],
	);
	const confirmBacklogMove = useCallback(
		() => dispatch({ type: "CONFIRM_BACKLOG_MOVE" }),
		[],
	);
	const cancelBacklogMove = useCallback(
		() => dispatch({ type: "CANCEL_BACKLOG_MOVE" }),
		[],
	);
	const dismissBlockedMove = useCallback(
		() => dispatch({ type: "DISMISS_BLOCKED_MOVE" }),
		[],
	);

	return {
		cards: state.cards,
		lists: state.lists,
		completeTask,
		handleDragEnd,
		pendingCompletion: state.pendingCompletion,
		pendingConfirm: state.pendingConfirm,
		blockedMove: state.blockedMove,
		confirmCompletion,
		cancelCompletion,
		confirmBacklogMove,
		cancelBacklogMove,
		dismissBlockedMove,
	};
}
