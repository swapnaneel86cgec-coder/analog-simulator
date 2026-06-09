"use client";

import dynamic from "next/dynamic";
import React, { useState, useEffect, useMemo } from "react";
import { Pause, Play } from "lucide-react";

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface Trace {
  name: string;
  y: number[];
  style: string;
  color: string;
}

interface OscilloscopeProps {
  time: number[];
  amplitude?: number[];
  traces?: Trace[];
  simulationSpeed?: number;
}

export default function Oscilloscope({ time, amplitude, traces, simulationSpeed = 0.5 }: OscilloscopeProps) {
  const [offset, setOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  const duration = time && time.length > 1 ? time[time.length - 1] + (time[1] - time[0]) : 0.1;

  // Animation loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    const speed = duration * simulationSpeed; // simulationSpeed screens per second

    const render = (now: number) => {
      const dt = (now - lastTime) / 1000;
      
      // Cap at ~30 FPS to prevent Plotly from choking
      if (dt > 1 / 30) {
        if (isAnimating && time && time.length > 0) {
          setOffset((prev) => (prev + dt * speed) % duration);
        }
        lastTime = now;
      }
      
      if (isAnimating) {
        animationFrameId = requestAnimationFrame(render);
      }
    };
    
    if (isAnimating) {
      animationFrameId = requestAnimationFrame(render);
    }
    
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [time, isAnimating, duration, simulationSpeed]);

  // Reset offset when new signal comes in
  useEffect(() => {
    setOffset(0);
  }, [time]);

  const plotData = useMemo(() => {
    if (!time || time.length === 0) return [];
    
    // Create 3 copies of time to ensure smooth scrolling
    const extTime = [
      ...time,
      ...time.map(t => t + duration),
      ...time.map(t => t + 2 * duration)
    ];

    return traces
      ? traces.map((trace) => ({
          x: extTime,
          y: [...trace.y, ...trace.y, ...trace.y],
          name: trace.name,
          type: "scatter" as const,
          mode: "lines" as const,
          line: {
            color: trace.color,
            width: 2,
            dash: (trace.style === "dash" ? "dash" : "solid") as any,
          },
        }))
      : [
          {
            x: extTime,
            y: amplitude ? [...amplitude, ...amplitude, ...amplitude] : [],
            type: "scatter" as const,
            mode: "lines" as const,
            line: { color: "#22C55E", width: 2 },
          },
        ];
  }, [time, amplitude, traces, duration]);

  return (
    <div className="w-full h-full relative rounded-lg overflow-hidden border-2 border-instrument-border scope-grid shadow-[inset_0_0_20px_rgba(34,197,94,0.1)]">
      <div className="absolute top-2 left-2 z-10 text-instrument-green text-xs font-mono font-bold tracking-widest uppercase">
        TIME DOMAIN
      </div>
      
      <button 
        onClick={() => setIsAnimating(!isAnimating)}
        className="absolute top-2 right-2 z-10 bg-instrument-dark/80 hover:bg-instrument-border border border-instrument-green/30 text-instrument-green p-1.5 rounded transition-colors"
        title={isAnimating ? "Pause Simulation" : "Play Simulation"}
      >
        {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>

      <div className="w-full h-full">
        <Plot
          data={plotData}
          layout={{
            autosize: true,
            margin: { l: 40, r: 20, t: 30, b: 40 },
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            xaxis: {
              range: [offset, offset + duration],
              color: "#475569",
              gridcolor: "rgba(34, 197, 94, 0.2)",
              zerolinecolor: "rgba(34, 197, 94, 0.5)",
              title: { text: "Time (s)", font: { color: "#94A3B8", size: 10 } },
              tickfont: { color: "#64748B", size: 10 },
              showspikes: true,
              spikemode: "across",
              spikesnap: "cursor",
              showline: true,
              showgrid: true,
              spikedash: "dash",
              spikecolor: "rgba(34, 197, 94, 0.7)",
              spikethickness: 1,
            },
            yaxis: {
              color: "#475569",
              gridcolor: "rgba(34, 197, 94, 0.2)",
              zerolinecolor: "rgba(34, 197, 94, 0.5)",
              title: { text: "Amplitude", font: { color: "#94A3B8", size: 10 } },
              tickfont: { color: "#64748B", size: 10 },
              showspikes: true,
              spikemode: "across",
              spikesnap: "cursor",
              showline: true,
              showgrid: true,
              spikedash: "dash",
              spikecolor: "rgba(34, 197, 94, 0.7)",
              spikethickness: 1,
            },
            hovermode: "x unified",
            showlegend: true,
            legend: { x: 1, y: 1, font: { color: "#94A3B8" } },
            font: { family: "monospace" },
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
}
