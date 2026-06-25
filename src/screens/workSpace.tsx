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
		<div className="min-h-screen bg-[#0f1117] px-8 py-10">
			{/* Board Header */}
			<div className="mb-8 text-center">
				<h2 className="text-3xl font-bold text-white tracking-tight">
					{mockBoard.title}
				</h2>
				<p className="mt-1 text-sm text-slate-400">{mockBoard.description}</p>
			</div>

			{/* Lists row */}
			<div className="flex gap-4 overflow-x-auto items-start pb-6">
				{[...mockBoard.lists]
					.sort((a, b) => a.position - b.position)
					.map((list) => {
						const cards = list.cardIds
							.map((id) => mockCards[id])
							.filter(Boolean)
							.sort((a, b) => a.position - b.position);

						return (
							<div
								key={list.id}
								className="shrink-0 w-72 rounded-2xl bg-[#1a1d27]
                       border border-white/5 flex flex-col overflow-hidden">
								{/* List header */}
								<div
									className="flex items-center justify-between px-4 py-3
                            border-b border-white/5">
									<div className="flex items-center gap-2">
										<span
											className="w-2 h-2 rounded-full"
											style={{ backgroundColor: list.color }}
										/>
										<h3 className="text-sm font-semibold text-slate-200 tracking-wide">
											{list.title}
										</h3>
									</div>
									<span
										className="text-xs font-medium text-slate-500
                               bg-white/5 rounded-full px-2 py-0.5">
										{cards.length}
									</span>
								</div>

								{/* Cards */}
								<div className="flex flex-col gap-3 p-3 overflow-y-auto max-h-[70vh]">
									{cards.map((card) => {
										if (!card) return null;

										const total = card.tasks.length;
										const done = card.tasks.filter((t) => t.isCompleted).length;
										const pct =
											total > 0 ? Math.round((done / total) * 100) : 0;
										const allDone = total > 0 && done === total;

										return (
											<div
												key={card.id}
												className="rounded-xl bg-[#22263a] border border-white/5
                               hover:border-indigo-500/40 hover:shadow-lg
                               hover:shadow-indigo-500/5
                               transition-all duration-200 overflow-hidden">
												{/* Card color bar */}
												<div
													className="h-0.5 w-full"
													style={{
														backgroundColor:
															card.color === "Black" ? "#6366f1" : card.color,
													}}
												/>

												<div className="p-3">
													{/* Card position badge + title */}
													<div className="flex items-start justify-between gap-2 mb-1">
														<p className="text-sm font-semibold text-slate-100 leading-snug">
															{card.title}
														</p>
														<span
															className="shrink-0 text-[10px] font-mono
                                         text-slate-500 bg-white/5
                                         rounded px-1.5 py-0.5 mt-0.5">
															#{card.position + 1}
														</span>
													</div>

													{/* Description */}
													<p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-3">
														{card.description}
													</p>

													{/* Tasks */}
													{total > 0 && (
														<div className="flex flex-col gap-1.5">
															{card.tasks.map((task) => (
																<div
																	key={task.id}
																	className="flex items-start gap-2">
																	{/* Checkbox indicator */}
																	<div
																		className={`mt-0.5 w-3.5 h-3.5 shrink-0 rounded
                                              flex items-center justify-center border
                                              ${
																								task.isCompleted
																									? "bg-emerald-500 border-emerald-500"
																									: "border-slate-600 bg-transparent"
																							}`}>
																		{task.isCompleted && (
																			<svg
																				className="w-2 h-2 text-white"
																				viewBox="0 0 10 10"
																				fill="none">
																				<path
																					d="M1.5 5l2.5 2.5 4.5-4.5"
																					stroke="currentColor"
																					strokeWidth="1.8"
																					strokeLinecap="round"
																					strokeLinejoin="round"
																				/>
																			</svg>
																		)}
																	</div>

																	{/* Task text */}
																	<div className="flex flex-col min-w-0">
																		<span
																			className={`text-xs font-medium leading-tight
                                                  ${
																										task.isCompleted
																											? "line-through text-slate-500"
																											: "text-slate-300"
																									}`}>
																			{task.title}
																		</span>
																		<span className="text-[11px] text-slate-500 leading-tight truncate">
																			{task.description}
																		</span>
																	</div>
																</div>
															))}

															{/* Progress bar */}
															<div className="mt-2 pt-2 border-t border-white/5">
																<div className="flex items-center justify-between mb-1">
																	<span className="text-[10px] text-slate-500">
																		{done}/{total} completed
																	</span>
																	{allDone ? (
																		<span className="text-[10px] font-semibold text-emerald-400">
																			All done ✓
																		</span>
																	) : (
																		<span className="text-[10px] text-slate-500">
																			{pct}%
																		</span>
																	)}
																</div>
																<div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
																	<div
																		className={`h-full rounded-full transition-all duration-500
                                            ${allDone ? "bg-emerald-500" : "bg-indigo-500"}`}
																		style={{ width: `${pct}%` }}
																	/>
																</div>
															</div>
														</div>
													)}
												</div>
											</div>
										);
									})}
								</div>
							</div>
						);
					})}
			</div>
		</div>
	);
}
