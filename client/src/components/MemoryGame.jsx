import React, { useState, useEffect } from 'react';

const cards = [
  { id: 1, emoji: '🚀' },
  { id: 2, emoji: '⚡' },
  { id: 3, emoji: '🎯' },
  { id: 4, emoji: '💡' },
  { id: 5, emoji: '🌟' },
  { id: 6, emoji: '🎨' },
  { id: 7, emoji: '🔮' },
  { id: 8, emoji: '🎪' },
];

export default function MemoryGame() {
  const [gameCards, setGameCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const duplicatedCards = [...cards, ...cards]
      .map((card, index) => ({ ...card, id: index }))
      .sort(() => Math.random() - 0.5);

    setGameCards(duplicatedCards);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setGameWon(false);
  };

  const handleCardClick = (cardId) => {
    if (flipped.length === 2 || flipped.includes(cardId) || matched.includes(cardId)) return;

    const newFlipped = [...flipped, cardId];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((prev) => prev + 1);
      const [first, second] = newFlipped;
      const firstCard = gameCards.find((c) => c.id === first);
      const secondCard = gameCards.find((c) => c.id === second);

      if (firstCard.emoji === secondCard.emoji) {
        setMatched((prev) => [...prev, first, second]);
        setFlipped([]);

        if (matched.length + 2 === cards.length * 2) {
          setGameWon(true);
        }
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  const isCardFlipped = (cardId) => flipped.includes(cardId) || matched.includes(cardId);

  return (
    <div className="w-full bg-white shadow-lg py-6">
      {/* Center the game grid inside the full-width container */}
      <div className="max-w-4xl mx-auto flex flex-col items-center px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Memory Game</h2>
        <p className="text-slate-600 mb-4 text-center">
          Match the pairs to test your memory!
        </p>

        <div className="flex justify-between items-center w-full mb-4">
          <span className="text-slate-600">Moves: {moves}</span>
          <button
            onClick={initializeGame}
            className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 transition"
          >
            New Game
          </button>
        </div>

        {gameWon && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 w-full text-center">
            🎉 Congratulations! You won in {moves} moves!
          </div>
        )}

        <div className="grid grid-cols-4 gap-4">
          {gameCards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`w-20 h-20 rounded-lg border-2 transition-all duration-300 flex items-center justify-center text-2xl ${
                isCardFlipped(card.id)
                  ? 'bg-white border-cyan-500'
                  : 'bg-slate-200 border-slate-300 hover:border-cyan-400'
              }`}
            >
              {isCardFlipped(card.id) && card.emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
