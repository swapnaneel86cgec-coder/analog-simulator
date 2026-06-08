"use client";

import React, { useState } from "react";
import { HelpCircle, CheckCircle, XCircle } from "lucide-react";

interface Question {
  question: string;
  options: string[];
  answer: number;
}

interface QuizPanelProps {
  questions: Question[];
}

export default function QuizPanel({ questions }: QuizPanelProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const handleSelect = (idx: number) => {
    if (showResult) return;
    setSelected(idx);
  };

  const checkAnswer = () => {
    if (selected === null) return;
    if (selected === questions[currentQ].answer) {
      setScore(score + 1);
    }
    setShowResult(true);
  };

  const nextQuestion = () => {
    setShowResult(false);
    setSelected(null);
    setCurrentQ((prev) => prev + 1);
  };

  const reset = () => {
    setCurrentQ(0);
    setSelected(null);
    setShowResult(false);
    setScore(0);
  };

  if (!questions || questions.length === 0) {
    return null;
  }

  return (
    <div className="bg-card text-card-foreground border border-border rounded-lg shadow-sm flex flex-col">
      <div className="flex items-center gap-2 p-3 border-b border-border bg-muted/50">
        <HelpCircle className="w-4 h-4 text-instrument-red" />
        <span className="font-semibold text-sm uppercase tracking-wider font-mono">Knowledge Check</span>
      </div>
      
      <div className="p-4 font-sans text-sm">
        {currentQ < questions.length ? (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center text-xs text-muted-foreground font-mono">
              <span>Question {currentQ + 1} of {questions.length}</span>
              <span>Score: {score}</span>
            </div>
            
            <p className="font-medium">{questions[currentQ].question}</p>
            
            <div className="flex flex-col gap-2">
              {questions[currentQ].options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className={`text-left p-2 rounded border transition-colors ${
                    selected === idx 
                      ? 'border-instrument-blue bg-instrument-blue/10' 
                      : 'border-border hover:bg-muted'
                  } ${
                    showResult && idx === questions[currentQ].answer
                      ? 'border-instrument-green bg-instrument-green/20'
                      : showResult && selected === idx && idx !== questions[currentQ].answer
                      ? 'border-red-500 bg-red-500/20'
                      : ''
                  }`}
                  disabled={showResult}
                >
                  <div className="flex items-center justify-between">
                    <span>{opt}</span>
                    {showResult && idx === questions[currentQ].answer && <CheckCircle className="w-4 h-4 text-instrument-green" />}
                    {showResult && selected === idx && idx !== questions[currentQ].answer && <XCircle className="w-4 h-4 text-red-500" />}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-2 flex justify-end">
              {!showResult ? (
                <button 
                  onClick={checkAnswer} 
                  disabled={selected === null}
                  className="bg-instrument-blue hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-1.5 rounded text-xs font-bold"
                >
                  CHECK
                </button>
              ) : (
                <button 
                  onClick={nextQuestion} 
                  className="bg-instrument-green hover:bg-green-500 text-black px-4 py-1.5 rounded text-xs font-bold"
                >
                  NEXT
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="text-4xl font-bold text-instrument-blue">
              {Math.round((score / questions.length) * 100)}%
            </div>
            <p>You scored {score} out of {questions.length}!</p>
            <button 
              onClick={reset} 
              className="mt-2 bg-muted hover:bg-muted/80 px-4 py-2 rounded text-xs font-bold"
            >
              RETRY QUIZ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
