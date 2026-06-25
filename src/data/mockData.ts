import type { Board, Card } from "../types/board.types";

// Cards live separately (keyed by id) so they're easy to look up
export const mockCards: Record<string | number, Card> = {
	"card-1": {
		id: "card-1",
		title: "Design system setup",
		description:
			"Define color tokens, typography scale, and spacing units for the whole app.",
		color: "Blue",
		position: 0,
		tasks: [
			{
				id: "task-1",
				title: "Pick primary font",
				description: "Choose between Inter and Geist",
				isCompleted: true,
			},
			{
				id: "task-2",
				title: "Define color palette",
				description: "5 neutrals + 2 accent colors",
				isCompleted: false,
			},
		],
	},
	"card-2": {
		id: "card-2",
		title: "Set up Vite + React",
		description:
			"Scaffold the project, install dependencies, clean up default files.",
		color: "Green",
		position: 1,
		tasks: [
			{
				id: "task-3",
				title: "Run create vite",
				description: "Use react-ts template",
				isCompleted: true,
			},
			{
				id: "task-4",
				title: "Install Zustand",
				description: "npm install zustand",
				isCompleted: true,
			},
		],
	},
	"card-3": {
		id: "card-3",
		title: "Write TypeScript interfaces",
		description:
			"Board, List, Card, Task — all interfaces defined and exported.",
		color: "Teal",
		position: 2,
		tasks: [
			{
				id: "task-5",
				title: "Board interface",
				description: "Includes lists array",
				isCompleted: true,
			},
			{
				id: "task-6",
				title: "Card interface",
				description: "Includes tasks and color",
				isCompleted: false,
			},
		],
	},
	"card-4": {
		id: "card-4",
		title: "Build Zustand board store",
		description: "Create the global store slice with lists and cards state.",
		color: "Red",
		position: 0,
		tasks: [
			{
				id: "task-7",
				title: "Create store file",
				description: "src/store/index.ts",
				isCompleted: false,
			},
			{
				id: "task-8",
				title: "Load mock data on init",
				description: "Seed store from mockBoard.ts",
				isCompleted: false,
			},
		],
	},
	"card-5": {
		id: "card-5",
		title: "Render List columns",
		description:
			"Map over lists in the store, render each as a vertical column.",
		color: "Black",
		position: 1,
		tasks: [
			{
				id: "task-9",
				title: "List component",
				description: "Takes list as prop",
				isCompleted: false,
			},
			{
				id: "task-10",
				title: "Board layout",
				description: "Horizontal flex container",
				isCompleted: false,
			},
		],
	},
	"card-6": {
		id: "card-6",
		title: "Render Cards inside Lists",
		description:
			"For each list, look up cards by cardIds and render them vertically.",
		color: "#fff8e6",
		position: 2,
		tasks: [
			{
				id: "task-11",
				title: "Card component",
				description: "Title, description, task count",
				isCompleted: false,
			},
		],
	},
	"card-7": {
		id: "card-7",
		title: "Inline editing",
		description:
			"Click any text to edit it. Blur or Enter saves. No submit button.",
		color: "#edf7ed",
		position: 0,
		tasks: [
			{
				id: "task-12",
				title: "useInlineEdit hook",
				description: "Handles value, editing state, commit",
				isCompleted: false,
			},
			{
				id: "task-13",
				title: "Apply to card title",
				description: "Click title → input field",
				isCompleted: false,
			},
			{
				id: "task-14",
				title: "Apply to list title",
				description: "Same hook, list context",
				isCompleted: false,
			},
		],
	},
	"card-8": {
		id: "card-8",
		title: "Drag and drop cards",
		description: "Reorder cards within a list. Move cards across lists.",
		color: "#edf7ed",
		position: 1,
		tasks: [
			{
				id: "task-15",
				title: "Install dnd-kit",
				description: "npm install @dnd-kit/core",
				isCompleted: false,
			},
			{
				id: "task-16",
				title: "Within-list reorder",
				description: "SortableContext per list",
				isCompleted: false,
			},
			{
				id: "task-17",
				title: "Cross-list move",
				description: "DragOverlay + droppable lists",
				isCompleted: false,
			},
		],
	},
	"card-9": {
		id: "card-9",
		title: "Undo / Redo stack",
		description:
			"Ctrl+Z restores prior state. Ctrl+Y re-applies. Max 50 entries.",
		color: "#f3eefe",
		position: 0,
		tasks: [
			{
				id: "task-18",
				title: "History slice",
				description: "past[] and future[] arrays",
				isCompleted: false,
			},
			{
				id: "task-19",
				title: "pushSnapshot on mutations",
				description: "Deep clone before each change",
				isCompleted: false,
			},
			{
				id: "task-20",
				title: "Global keyboard listener",
				description: "useEffect on window keydown",
				isCompleted: false,
			},
		],
	},
	"card-10": {
		id: "card-10",
		title: "Canvas mode",
		description:
			"Toggle from board view to a free-form infinite canvas. Cards become draggable nodes.",
		color: "#fdeef0",
		position: 1,
		tasks: [
			{
				id: "task-21",
				title: "Pan with spacebar + drag",
				description: "Track viewport x/y offset",
				isCompleted: false,
			},
			{
				id: "task-22",
				title: "Zoom with scroll wheel",
				description: "Scale transform, clamped 0.2–2",
				isCompleted: false,
			},
			{
				id: "task-23",
				title: "CanvasCard component",
				description: "Absolutely positioned, draggable",
				isCompleted: false,
			},
		],
	},
};

export const mockBoard: Board = {
	id: "board-1",
	title: "Workello",
	description: "A collaborative Kanban + Canvas workspace.",
	lists: [
		{
			id: "list-1",
			title: "To Do",
			color: "#e8f4fd",
			position: 0,
			cardIds: ["card-1", "card-2", "card-3"],
		},
		{
			id: "list-2",
			title: "In Progress",
			color: "#fff8e6",
			position: 1,
			cardIds: ["card-4", "card-5", "card-6"],
		},
		{
			id: "list-3",
			title: "Done",
			color: "#edf7ed",
			position: 2,
			cardIds: ["card-7", "card-8"],
		},
		{
			id: "list-4",
			title: "Backlog",
			color: "#f3eefe",
			position: 3,
			cardIds: ["card-9", "card-10"],
		},
	],
};
