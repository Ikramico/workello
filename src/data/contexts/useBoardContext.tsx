import { createContext, useContext } from "react";
import type { BoardActionsValue, BoardUIValue } from "../../types/board.types";




const BoardActionsContext = createContext<BoardActionsValue | null>(null);

export function BoardActionsProvider({
	value,
	children,
}: {
	value: BoardActionsValue;
	children: React.ReactNode;
}) {
	return (
		<BoardActionsContext.Provider value={value}>
			{children}
		</BoardActionsContext.Provider>
	);
}

export function useBoardActions() {
	const ctx = useContext(BoardActionsContext);
	if (!ctx) {
		throw new Error("useBoardActions must be used within BoardActionsProvider");
	}
	return ctx;
}


const BoardUIContext = createContext<BoardUIValue | null>(null);

export function BoardUIProvider({
	value,
	children,
}: {
	value: BoardUIValue;
	children: React.ReactNode;
}) {
	return (
		<BoardUIContext.Provider value={value}>{children}</BoardUIContext.Provider>
	);
}

export function useBoardUI() {
	const ctx = useContext(BoardUIContext);
	if (!ctx) {
		throw new Error("useBoardUI must be used within BoardUIProvider");
	}
	return ctx;
}

