import { useState } from "react";
import { mockCards } from "../data/mockData";
import type { Card } from "../types/board.types";


export default function useBoardState() {
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

  return({cards, completeTask})
}
