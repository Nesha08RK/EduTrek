import React, { useState } from 'react';
import MemoryGame from '../components/MemoryGame';
import LogicPuzzle from '../components/LogicPuzzle';
import MathChallenge from '../components/MathChallenge';

export default function Games() {
  const [selectedGame, setSelectedGame] = useState('memory');

  const games = [
    { id: 'memory', name: 'Memory Match', description: 'Test your memory by matching pairs of cards' },
    { id: 'puzzle', name: 'Logic Puzzle', description: 'Solve brain teasers and riddles' },
    { id: 'math', name: 'Math Challenge', description: 'Quick mental math exercises' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 w-full">
      <div className="w-full px-4 py-8 bg-white shadow mb-6">
        <h1 className="text-3xl font-bold text-slate-900 text-center">Mind Trick Games</h1>
      </div>

      <div className="w-full px-4 grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-6xl mx-auto">
        {games.map(game => (
          <button
            key={game.id}
            onClick={() => setSelectedGame(game.id)}
            className={`p-6 rounded-lg border-2 transition-all w-full text-left ${
              selectedGame === game.id
                ? 'border-cyan-500 bg-cyan-50'
                : 'border-slate-200 bg-white hover:border-cyan-300'
            }`}
          >
            <h3 className="font-semibold text-lg mb-2">{game.name}</h3>
            <p className="text-slate-600 text-sm">{game.description}</p>
          </button>
        ))}
      </div>

      <div className="w-full flex-1 bg-white shadow-lg px-4 py-8">
        {selectedGame === 'memory' && <MemoryGame />}
        {selectedGame === 'puzzle' && <LogicPuzzle />}
        {selectedGame === 'math' && <MathChallenge />}
      </div>
    </div>
  );
}
