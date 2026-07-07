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


