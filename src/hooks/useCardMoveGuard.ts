import { useState } from "react";
import type { Card, List as ListType } from "../types/board.types";

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

interface DragOperationEvent {
	operation: {
		source: { id: string | number } | null;
		target: { id: string | number } | null;
	};
}

export default function useCardMoveGuard(
	lists: ListType[],
	cards: Record<string | number, Card>,
	moveCard: (cardId: string, targetListId: string) => void,
) {
	const [pendingCompletion, setPendingCompletion] = useState<PendingMove>(null);
	const [pendingConfirm, setPendingConfirm] = useState<PendingMove>(null);

	const [blockedMove, setBlockedMove] = useState<BlockedMove>(null);

	function findListIdForCard(cardId: string) {
		return lists.find((l) => l.cardIds.includes(cardId))?.id;
	}

	function isCardFullyDone(cardId: string) {
		const card = cards[cardId];
		const total = card?.tasks.length ?? 0;
		const done = card?.tasks.filter((t) => t.isCompleted).length ?? 0;
		return total > 0 && done === total;
	}

	function isCardAllPending(cardId: string) {
		const card = cards[cardId];
		const total = card?.tasks.length ?? 0;
		const done = card?.tasks.filter((t) => t.isCompleted).length ?? 0;
		return total > 0 && done === 0;
	}

	function attemptMove(
		cardId: string,
		sourceListId: string,
		targetListId: string,
	) {
		if (isCardFullyDone(cardId) && targetListId !== DONE_LIST_ID) {
			setBlockedMove({ cardId, reason: "done" });
			return;
		}

		if (sourceListId === IN_PROGRESS_LIST_ID && targetListId === TODO_LIST_ID) {
			setBlockedMove({ cardId, reason: "backward" });
			return;
		}

		if (
			sourceListId === BACKLOG_LIST_ID &&
			targetListId === IN_PROGRESS_LIST_ID &&
			isCardAllPending(cardId)
		) {
			setBlockedMove({ cardId, reason: "not-started" });
			return;
		}

		if (sourceListId === TODO_LIST_ID && targetListId === BACKLOG_LIST_ID) {
			setPendingConfirm({ cardId, targetListId });
			return;
		}

		if (targetListId === DONE_LIST_ID && !isCardFullyDone(cardId)) {
			setPendingCompletion({ cardId, targetListId });
			return;
		}

		moveCard(cardId, targetListId);
	}

	function handleDragEnd(event: DragOperationEvent) {
		const { source, target } = event.operation;
		if (!source || !target) return;

		const cardId = String(source.id);
		const targetListId = String(target.id);
		const sourceListId = String(findListIdForCard(cardId));

		if (!sourceListId || sourceListId === targetListId) return;

		attemptMove(cardId, sourceListId, targetListId);
	}

	function confirmCompletion() {
		if (!pendingCompletion) return;
		moveCard(pendingCompletion.cardId, pendingCompletion.targetListId);
		setPendingCompletion(null);
	}

	function cancelCompletion() {
		setPendingCompletion(null);
	}

	function confirmBacklogMove() {
		if (!pendingConfirm) return;
		moveCard(pendingConfirm.cardId, pendingConfirm.targetListId);
		setPendingConfirm(null);
	}

	function cancelBacklogMove() {
		setPendingConfirm(null);
	}

	function dismissBlockedMove() {
		setBlockedMove(null);
	}

	return {
		handleDragEnd,
		pendingCompletion,
		pendingConfirm,
		blockedMove,
		confirmCompletion,
		cancelCompletion,
		confirmBacklogMove,
		cancelBacklogMove,
		dismissBlockedMove,
	};
}
