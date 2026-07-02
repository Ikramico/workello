import { useState } from "react";
import { DragDropProvider } from "@dnd-kit/react";
import List from "./List";
import useBoardState from "../../hooks/useBoardState";
import useDistributeEffects from "../../hooks/useDistributeEffects";
import { mockBoard } from "../../data/mockData";
import useCardMoveGuard from "../../hooks/useCardMoveGuard";
import ConfirmMoveModal from "./confirmMoveModal";
import TaskCompletionModal from "./taskCompletionModal";
import BlockedMoveModal from "./blockedMoveModal";

export default function Board() {
	const { cards, completeTask } = useBoardState();
	const [lists, moveCard] = useDistributeEffects(mockBoard.lists, cards);

	const {
		handleDragEnd,
		pendingCompletion,
		pendingConfirm,
		confirmCompletion,
		cancelCompletion,
		confirmBacklogMove,
		cancelBacklogMove,
		blockedMove,
		dismissBlockedMove,
	} = useCardMoveGuard(lists, cards, moveCard);

	// First card of "To Do" is open by default
	const [openCardId, setOpenCardId] = useState<string | number | null>(
		mockBoard.lists.find((l) => l.id === "list-1")?.cardIds[0] ?? null,
	);

	function toggleCard(cardId: string | number) {
		setOpenCardId((prev) => (prev === cardId ? null : cardId));
	}

	return (
		<>
			<DragDropProvider onDragEnd={handleDragEnd}>
				<div className="flex gap-4 overflow-x-auto items-start pb-6 px-8 py-10">
					{lists.map((list) => {
						const listCards = list.cardIds
							.map((id) => cards[id])
							.filter(Boolean)
							.sort((a, b) => a.position - b.position);

						const totalDone = listCards.reduce(
							(sum, card) =>
								sum + card.tasks.filter((t) => t.isCompleted).length,
							0,
						);

						return (
							<List
								key={list.id}
								list={list}
								cards={listCards}
								totalDone={totalDone}
								onCompleteTask={completeTask}
								openCardId={openCardId}
								onToggleCard={toggleCard}
							/>
						);
					})}
				</div>
			</DragDropProvider>

			{pendingCompletion && cards[pendingCompletion.cardId] && (
				<TaskCompletionModal
					card={cards[pendingCompletion.cardId]}
					onCompleteTask={completeTask}
					onCancel={cancelCompletion}
					onConfirm={confirmCompletion}
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
		</>
	);
}
