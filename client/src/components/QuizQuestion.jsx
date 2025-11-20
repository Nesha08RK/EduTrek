import React from 'react';

export default function QuizQuestion({ index, total, question, selectedIndex, onSelect, onNext, onPrev, submitting }) {
  return (
    <div className="w-full">
      {/* Progress */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-slate-700 font-medium">Question {index + 1} of {total}</div>
        <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600 uppercase">{question.difficulty}</span>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">{question.prompt}</h2>
        <div className="space-y-3">
          {question.options.map((opt, i) => (
            <button
              key={i}
              className={`w-full text-left border rounded p-3 transition text-slate-900 ${
                selectedIndex === i
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-slate-200 hover:bg-cyan-50 hover:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100'
              }`}
              onClick={() => onSelect(i)}
            >
              <span className="font-semibold mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button onClick={onPrev} disabled={index === 0} className="px-4 py-2 rounded bg-slate-100 text-slate-700 disabled:opacity-50">Back</button>
          <button onClick={onNext} disabled={submitting} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">{index === total - 1 ? 'Submit' : 'Next'}</button>
        </div>
      </div>
    </div>
  );
}
