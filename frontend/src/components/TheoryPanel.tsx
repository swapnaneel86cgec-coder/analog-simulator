"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css"; // Required for math rendering
import { BookOpen } from "lucide-react";

interface TheoryPanelProps {
  content: string;
}

export default function TheoryPanel({ content }: TheoryPanelProps) {
  return (
    <div className="bg-card text-card-foreground border border-border rounded-lg shadow-sm flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 p-3 border-b border-border bg-muted/50">
        <BookOpen className="w-4 h-4 text-instrument-blue" />
        <span className="font-semibold text-sm uppercase tracking-wider font-mono">Educational Theory</span>
      </div>
      <div className="p-4 overflow-y-auto prose dark:prose-invert max-w-none text-sm font-sans flex-1">
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
