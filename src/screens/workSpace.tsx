// import { mockBoard, mockCards } from "../../data/mockBoard";

// export function Workspace() {
// 	const sortedLists = [...mockBoard.lists].sort(
// 		(a, b) => a.position - b.position,
// 	);

// 	return (
// 		<div className="h-screen flex flex-col bg-slate-900 font-sans overflow-hidden">
// 			{/* ── Toolbar ── */}
// 			<header
// 				className="h-12 flex-shrink-0 flex items-center justify-between px-5
//                          bg-slate-900 border-b border-slate-700/60">
// 				<div className="flex items-center gap-3">
// 					{/* Logo mark */}
// 					<div
// 						className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center
//                           text-white text-sm font-bold tracking-tight shadow-md">
// 						S
// 					</div>
// 					<div>
// 						<span className="text-white font-semibold text-sm tracking-wide">
// 							{mockBoard.title}
// 						</span>
// 						<span className="ml-2 text-slate-400 text-xs hidden sm:inline">
// 							{mockBoard.description}
// 						</span>
// 					</div>
// 				</div>

// 				{/* Right side actions — placeholders for later steps */}
// 				<div className="flex items-center gap-2">
// 					<button
// 						className="text-xs text-slate-400 hover:text-white px-3 py-1.5
//                              rounded-md hover:bg-slate-700 transition-colors">
// 						Board
// 					</button>
// 					<button
// 						className="text-xs text-slate-400 hover:text-white px-3 py-1.5
//                              rounded-md hover:bg-slate-700 transition-colors">
// 						Canvas
// 					</button>
// 					<div className="w-px h-4 bg-slate-700 mx-1" />
// 					<div
// 						className="w-7 h-7 rounded-full bg-indigo-500 text-white text-xs
//                           font-semibold flex items-center justify-center cursor-pointer
//                           hover:bg-indigo-400 transition-colors">
// 						D
// 					</div>
// 				</div>
// 			</header>

// 			{/* ── Board canvas ── */}
// 			<main
// 				className="flex-1 overflow-x-auto overflow-y-hidden
//                        flex items-start gap-4 p-6
//                        bg-slate-800">
// 				{sortedLists.map((list) => {
// 					const cards = list.cardIds
// 						.map((id) => mockCards[id])
// 						.filter(Boolean)
// 						.sort((a, b) => a.position - b.position);

// 					return (
// 						<div
// 							key={list.id}
// 							className="w-68 flex-shrink-0 flex flex-col rounded-xl
//                          bg-slate-700/50 backdrop-blur-sm
//                          border border-slate-600/40
//                          max-h-[calc(100vh-7rem)]"
// 							style={{ minWidth: "272px" }}>
// 							{/* List header */}
// 							<div className="flex items-center justify-between px-3 pt-3 pb-2">
// 								<div className="flex items-center gap-2">
// 									{/* Color dot */}
// 									<span
// 										className="w-2.5 h-2.5 rounded-full flex-shrink-0"
// 										style={{ backgroundColor: list.color }}
// 									/>
// 									<h2 className="text-sm font-semibold text-slate-100 tracking-wide">
// 										{list.title}
// 									</h2>
// 								</div>
// 								<span
// 									className="text-xs font-medium text-slate-400
//                                  bg-slate-600/60 rounded-full px-2 py-0.5">
// 									{cards.length}
// 								</span>
// 							</div>

// 							{/* Divider */}
// 							<div className="mx-3 h-px bg-slate-600/50 mb-2" />

// 							{/* Cards scroll area */}
// 							<div
// 								className="flex flex-col gap-2 overflow-y-auto px-2 pb-2
//                               scrollbar-thin scrollbar-track-transparent
//                               scrollbar-thumb-slate-600">
// 								{cards.map((card) => {
// 									const completedCount = card.tasks.filter(
// 										(t) => t.isCompleted,
// 									).length;
// 									const totalTasks = card.tasks.length;
// 									const progress =
// 										totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

// 									return (
// 										<div
// 											key={card.id}
// 											className="group bg-slate-800 rounded-lg px-3 py-3
//                                  border border-slate-600/30
//                                  hover:border-indigo-500/50 hover:shadow-lg
//                                  hover:shadow-indigo-500/5
//                                  transition-all duration-150 cursor-pointer">
// 											{/* Card color accent bar */}
// 											<div
// 												className="w-full h-0.5 rounded-full mb-2.5 opacity-70"
// 												style={{ backgroundColor: card.color }}
// 											/>

// 											{/* Card title */}
// 											<p className="text-sm font-medium text-slate-100 leading-snug mb-1">
// 												{card.title}
// 											</p>

// 											{/* Card description */}
// 											<p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
// 												{card.description}
// 											</p>

// 											{/* Task progress — only if tasks exist */}
// 											{totalTasks > 0 && (
// 												<div className="mt-3 flex flex-col gap-1.5">
// 													{/* Progress bar */}
// 													<div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
// 														<div
// 															className="h-full bg-indigo-500 rounded-full transition-all duration-300"
// 															style={{ width: `${progress}%` }}
// 														/>
// 													</div>
// 													{/* Task count */}
// 													<div className="flex items-center justify-between">
// 														<span className="text-xs text-slate-500">
// 															{completedCount}/{totalTasks} tasks
// 														</span>
// 														{completedCount === totalTasks && (
// 															<span className="text-xs text-emerald-400 font-medium">
// 																✓ Done
// 															</span>
// 														)}
// 													</div>
// 												</div>
// 											)}
// 										</div>
// 									);
// 								})}
// 							</div>

// 							{/* Add card button — placeholder for Step 9 */}
// 							<button
// 								className="mx-2 mb-2 mt-1 flex items-center gap-2 px-3 py-2
//                                  text-xs text-slate-500 hover:text-slate-300
//                                  hover:bg-slate-600/40 rounded-lg
//                                  transition-colors duration-150">
// 								<span className="text-base leading-none">+</span>
// 								Add card
// 							</button>
// 						</div>
// 					);
// 				})}

// 				{/* Add list button — placeholder for Step 9 */}
// 				<button
// 					className="flex-shrink-0 w-68 h-12 flex items-center justify-center gap-2
//                      rounded-xl border-2 border-dashed border-slate-600/50
//                      text-slate-500 hover:text-slate-300 hover:border-slate-500
//                      text-sm transition-colors duration-150"
// 					style={{ minWidth: "272px" }}>
// 					<span className="text-lg leading-none">+</span>
// 					Add list
// 				</button>
// 			</main>
// 		</div>
// 	);
// }

import { mockBoard, mockCards } from "../data/mockData";

export default function WorkSpace() {
	return (
		<div className="bg-slate-800 py-20 px-16">
			<h2 className="text-2xl text-white text-center">{mockBoard.title}</h2>
			<div className="board-details text-md text-white/80 text-center ">
				{mockBoard.description}
			</div>
			<div className="board-cards p-2 flex justify-center text-center text-white/80 text-xl">
				{mockBoard.lists.map((list) => (
					<div className="p-5 rounded-md bg-gray-900 m-2" key={list.id}>
						<h1 className="text-bold">{list.title}</h1>
						<div className="border border-blue-100">
							{list.cardIds.map((id) => {
								const card = mockCards[id];
								if (!card) {
									return <p className="text-red-300">No Card Available</p>;
								} else {
									return (
										<div className="p-3 mb-5 text-white text-md bg-red-900" key={id}>
											<p className={` text-md text-white/70 `}>{card.title}</p>
											<div className=" rounded-xl text-red">
												{card.tasks.map((task) => {
													if (!task) {
														return (
															<p className="text-orange-500 text-md font-bold">
																Add your task
															</p>
														);
													} else {
														return (
															<div className="bg-white text-black rounded-md mb-3">
																<p className="task-title text-xl">
																	{task.title}
																</p>
																<p className="task-description text-2xl font-bold">
																	{task.description}
																</p>
                                                                
															</div>
														);
													}
												})}
											</div>
										</div>
									);
								}
							})}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
