import React, { useState } from "react";

const puzzles = [
  {
    question: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
    options: ["Shadow", "Echo", "Cloud", "Fire"],
    answer: "Echo",
  },
  {
    question: "What has to be broken before you can use it?",
    options: ["Glass", "Egg", "Lock", "Seal"],
    answer: "Egg",
  },
  {
    question: "I’m tall when I’m young, and short when I’m old. What am I?",
    options: ["Candle", "Tree", "Human", "Building"],
    answer: "Candle",
  },
];

export default function LogicPuzzle() {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const handleAnswer = (option) => {
    setSelected(option);
    if (option === puzzles[current].answer) {
      setScore((prev) => prev + 1);
    }
    setTimeout(() => {
      if (current + 1 < puzzles.length) {
        setCurrent((prev) => prev + 1);
        setSelected(null);
      } else {
        setFinished(true);
      }
    }, 1000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto text-center">
      <h2 className="text-2xl font-bold text-slate-900 mb-4">Logic Puzzle</h2>
      {!finished ? (
        <>
          <p className="text-lg text-slate-700 mb-6">{puzzles[current].question}</p>
          <div className="grid grid-cols-2 gap-4">
            {puzzles[current].options.map((option) => (
              <button
                key={option}
                onClick={() => handleAnswer(option)}
                disabled={selected !== null}
                className={`p-3 rounded-lg border transition-all font-medium ${
                  selected === option
                    ? option === puzzles[current].answer
                      ? "bg-green-200 border-green-500 text-green-900"
                      : "bg-red-200 border-red-500 text-red-900"
                    : "bg-slate-100 text-slate-900 hover:border-cyan-400 hover:bg-slate-200"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-6">
          <p className="text-xl font-semibold text-green-700">
            🎉 You scored {score} / {puzzles.length}
          </p>
          <button
            onClick={() => {
              setCurrent(0);
              setSelected(null);
              setScore(0);
              setFinished(false);
            }}
            className="mt-4 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
