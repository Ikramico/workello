import { mockBoard } from "../data/mockData";
import Board from "./board_components/Board";

export default function Workspace() {
	return (
		<div className="min-h-screen bg-[#0f1117]">
			{/* Header */}
			<div className="text-center pt-10 pb-2">
				<h2 className="text-3xl font-bold text-white tracking-tight">
					{mockBoard.title}
				</h2>
				<p className="mt-1 text-sm text-slate-400">{mockBoard.description}</p>
			</div>

			
			<Board />
		</div>
	);
}
