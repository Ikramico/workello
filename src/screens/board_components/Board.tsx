import { useCallback, useMemo, useState } from "react";
import { DragDropProvider } from "@dnd-kit/react";
import List from "./List";
import useBoardReducer from "../../hooks/useBoardReducer";
import { mockBoard, mockCards } from "../../data/mockData";
import ConfirmMoveModal from "./confirmMoveModal";
import TaskCompletionModal from "./taskCompletionModal";
import BlockedMoveModal from "./blockedMoveModal";
import {
	BoardActionsProvider,
	BoardUIProvider,
} from "../../data/contexts/useBoardContext";

export default function Board() {
	const {
		cards,
		lists,
		completeTask,
		handleDragEnd,
		pendingCompletion,
		pendingConfirm,
		pendingStart,
		confirmCompletion,
		cancelCompletion,
		confirmBacklogMove,
		cancelBacklogMove,
		confirmStartMove,
		cancelStartMove,
		blockedMove,
		dismissBlockedMove,
	} = useBoardReducer(mockCards, mockBoard.lists);

	// First card of "To Do" is open by default
	const [openCardId, setOpenCardId] = useState<string | number | null>(
		mockBoard.lists.find((l) => l.id === "list-1")?.cardIds[0] ?? null,
	);

	const toggleCard = useCallback((cardId: string | number) => {
		setOpenCardId((prev) => (prev === cardId ? null : cardId));
	}, []);

	// Stable references so BoardActionsProvider's value only changes when
	// completeTask itself changes (which it doesn't, across renders).
	const actionsValue = useMemo(() => ({ completeTask }), [completeTask]);

	// This one DOES change every time openCardId changes — that's the point.
	// Kept in its own provider so it doesn't also invalidate actionsValue's
	// consumers.
	const uiValue = useMemo(
		() => ({ openCardId, toggleCard }),
		[openCardId, toggleCard],
	);

	// Only recompute per-list card arrays + done counts when `cards` or
	// `lists` actually change — i.e. a drag move, a task completion, or a
	// modal confirm. Toggling a card open/closed re-renders Board but
	// doesn't touch cards/lists, so this is skipped on that render.
	const hydratedLists = useMemo(() => {
		return lists.map((list) => {
			const listCards = list.cardIds
				.map((id) => cards[id])
				.filter(Boolean)
				.sort((a, b) => a.position - b.position);

			const totalDone = listCards.reduce(
				(sum, card) => sum + card.tasks.filter((t) => t.isCompleted).length,
				0,
			);

			return { list, listCards, totalDone };
		});
	}, [lists, cards]);

	return (
		<BoardActionsProvider value={actionsValue}>
			<BoardUIProvider value={uiValue}>
				<DragDropProvider onDragEnd={handleDragEnd}>
					<div className="flex gap-4 overflow-x-auto items-start pb-6 px-8 py-10">
						{hydratedLists.map(({ list, listCards, totalDone }) => (
							<List
								key={list.id}
								list={list}
								cards={listCards}
								totalDone={totalDone}
							/>
						))}
					</div>
				</DragDropProvider>

				{pendingCompletion && cards[pendingCompletion.cardId] && (
					<TaskCompletionModal
						card={cards[pendingCompletion.cardId]}
						onCompleteTask={completeTask}
						onCancel={cancelCompletion}
						onConfirm={confirmCompletion}
						targetListLabel="Done"
						requireAllTasks
					/>
				)}

				{pendingStart && cards[pendingStart.cardId] && (
					<TaskCompletionModal
						card={cards[pendingStart.cardId]}
						onCompleteTask={completeTask}
						onCancel={cancelStartMove}
						onConfirm={confirmStartMove}
						targetListLabel="In Progress"
						requireAllTasks={false}
					/>
				)}

				{pendingConfirm && cards[pendingConfirm.cardId] && (
					<ConfirmMoveModal
						card={cards[pendingConfirm.cardId]}
						message="Move this card to Backlog? It hasn't been finished."
						onCancel={cancelBacklogMove}
						onConfirm={confirmBacklogMove}
					/>
				)}

				{blockedMove && cards[blockedMove.cardId] && (
					<BlockedMoveModal
						card={cards[blockedMove.cardId]}
						reason={blockedMove.reason}
						onDismiss={dismissBlockedMove}
					/>
				)}
			</BoardUIProvider>
		</BoardActionsProvider>
	);
}
