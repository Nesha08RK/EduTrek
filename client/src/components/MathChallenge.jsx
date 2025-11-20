import React, { useState, useEffect } from "react";

function generateQuestion() {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const operators = ["+", "-", "*"];
  const operator = operators[Math.floor(Math.random() * operators.length)];
  let answer;

  switch (operator) {
    case "+": answer = num1 + num2; break;
    case "-": answer = num1 - num2; break;
    case "*": answer = num1 * num2; break;
    default: answer = 0;
  }

  return { question: `${num1} ${operator} ${num2}`, answer };
}

export default function MathChallenge() {
  const [question, setQuestion] = useState(generateQuestion());
  const [userAnswer, setUserAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      setGameOver(true);
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (parseInt(userAnswer) === question.answer) {
      setScore((prev) => prev + 1);
    }
    setUserAnswer("");
    setQuestion(generateQuestion());
  };

  return (
    <div className="w-full max-w-md mx-auto text-center">
      <h2 className="text-2xl font-bold text-slate-900 mb-4">Math Challenge</h2>
      {!gameOver ? (
        <>
          <p className="text-lg mb-2 text-red-600">Time Left: ⏳ {timeLeft}s</p>
          <p className="text-xl font-semibold mb-6 text-indigo-700">{question.question}</p>

          <form onSubmit={handleSubmit} className="flex justify-center gap-2 mb-4">
           <input
  type="number"
  value={userAnswer}
  onChange={(e) => setUserAnswer(e.target.value)}
  className="border p-2 rounded w-24 text-center bg-gray-100 text-gray-900 placeholder-gray-500"
  placeholder="Answer"
  required
/>

            <button
              type="submit"
              className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600"
            >
              Submit
            </button>
          </form>

          <p className="text-lg">Score: {score}</p>
        </>
      ) : (
        <div className="mt-6">
          <p className="text-xl font-semibold text-green-700">
            🎉 Game Over! Your Score: {score}
          </p>
          <button
            onClick={() => {
              setScore(0);
              setTimeLeft(30);
              setGameOver(false);
              setQuestion(generateQuestion());
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
