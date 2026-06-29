import { useState } from 'react';

import type { Card } from '../../types/board.types';
import List from './List';
import { mockBoard, mockCards } from '../../data/mockData';

export default function Board() {
  const [cards, setCards] = useState<Record<string | number, Card>>(mockCards);

  function completeTask(cardId: string | number, taskId: string | number) {
    setCards((prev) => {
      const card = prev[cardId];
      if (!card) return prev;

      const task = card.tasks.find((t) => t.id === taskId);
      if (!task || task.isCompleted) return prev; // can't reverse

      return {
        ...prev,
        [cardId]: {
          ...card,
          tasks: card.tasks.map((t) =>
            t.id === taskId ? { ...t, isCompleted: true } : t
          ),
        },
      };
    });
  }

  const sortedLists = [...mockBoard.lists].sort((a, b) => a.position - b.position);

  return (
    <div className="flex gap-4 overflow-x-auto items-start pb-6 px-8 py-10">
      {sortedLists.map((list) => {
        const listCards = list.cardIds
          .map((id) => cards[id])
          .filter(Boolean)
          .sort((a, b) => a.position - b.position);

        // ← List can now receive real completed count
        const totalDone = listCards.reduce(
          (sum, card) => sum + card.tasks.filter((t) => t.isCompleted).length,
          0
        );

        return (
          <List
            key={list.id}
            list={list}
            cards={listCards}
            totalDone={totalDone}
            onCompleteTask={completeTask}
          />
        );
      })}
    </div>
  );
}