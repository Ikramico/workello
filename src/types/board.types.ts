export interface Task {
	id: number | string;
	title: string;
	description: string;
	image?: string;
	isCompleted: boolean;
	createdAt: string;
}

export interface Card {
	id: number | string;
	title: string;
	description: string;
	tasks: Task[];
	position: number;
	color: string;
}

export interface List {
	id: number | string;
	title: string;
	cardIds: (number | string)[];
	position: number;
	color: string;
}

export interface Board {
	id: number | string;
	title: string;
	description: string;
	lists: List[];
}

// ---- moved from useBoardReducer.ts ----

export type PendingMove = {
	cardId: string;
	targetListId: string;
} | null;

export type BlockedMove = {
	cardId: string;
	reason: "done" | "overdue" | "backward" | "not-started";
} | null;

export interface BoardState {
	cards: Record<string | number, Card>;
	lists: List[];
	pendingCompletion: PendingMove;
	pendingConfirm: PendingMove;
	pendingStart: PendingMove;
	blockedMove: BlockedMove;
}

export type BoardAction =
	| { type: "COMPLETE_TASK"; cardId: string | number; taskId: string | number }
	| { type: "REQUEST_MOVE"; cardId: string; targetListId: string }
	| { type: "CONFIRM_COMPLETION" }
	| { type: "CANCEL_COMPLETION" }
	| { type: "CONFIRM_BACKLOG_MOVE" }
	| { type: "CANCEL_BACKLOG_MOVE" }
	| { type: "CONFIRM_START_MOVE" }
	| { type: "CANCEL_START_MOVE" }
	| { type: "DISMISS_BLOCKED_MOVE" };

// Decides the outcome of a requested move: direct move, one of the two
// confirmation modals, a block, or nothing.
export type MoveOutcome =
	| { kind: "move" }
	| { kind: "confirm-backlog" }
	| { kind: "confirm-completion" }
	| { kind: "confirm-start" }
	| { kind: "blocked"; reason: NonNullable<BlockedMove>["reason"] };

export interface DragOperationEvent {
	operation: {
		source: { id: string | number } | null;
		target: { id: string | number } | null;
	};
}

export interface BoardActionsValue {
	completeTask: (cardId: string | number, taskId: string | number) => void;
}
export interface BoardUIValue {
	openCardId: string | number | null;
	toggleCard: (cardId: string | number) => void;
}

