"use client";

import dynamic from "next/dynamic";
import React, { useMemo } from "react";
import { Activity } from "lucide-react";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface SpectrumAnalyzerProps {
  freq: number[];
  mag: number[];
}

export default function SpectrumAnalyzer({ freq, mag }: SpectrumAnalyzerProps) {
  
  const { carrierFreq, bandwidth } = useMemo(() => {
    if (!freq || !mag || freq.length === 0) return { carrierFreq: 0, bandwidth: 0 };
    
    let peakIdx = 0;
    let maxMag = 0;
    for (let i = 1; i < mag.length; i++) { // Skip DC component (0 Hz)
      if (mag[i] > maxMag) {
        maxMag = mag[i];
        peakIdx = i;
      }
    }
    
    const threshold = maxMag * 0.05; // 5% threshold for Bandwidth
    let minIdx = peakIdx;
    let maxIdx = peakIdx;
    
    for (let i = 1; i < mag.length; i++) {
      if (mag[i] > threshold) {
        if (i < minIdx) minIdx = i;
        if (i > maxIdx) maxIdx = i;
      }
    }

    return {
      carrierFreq: freq[peakIdx],
      bandwidth: freq[maxIdx] - freq[minIdx]
    };
  }, [freq, mag]);

  return (
    <div className="w-full h-full relative rounded-lg overflow-hidden border-2 border-instrument-border bg-instrument-screen shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]">
      <div className="absolute top-2 left-2 z-10 text-instrument-blue text-xs font-mono font-bold tracking-widest uppercase flex items-center gap-2">
        <Activity className="w-4 h-4" />
        FFT SPECTRUM
      </div>

      {carrierFreq > 0 && (
        <div className="absolute top-2 right-2 z-10 flex flex-col items-end text-xs font-mono bg-instrument-dark/80 p-2 rounded border border-instrument-border">
          <div className="text-slate-300">Carrier: <span className="text-instrument-blue font-bold">{carrierFreq.toFixed(1)} Hz</span></div>
          <div className="text-slate-300">Bandwidth: <span className="text-instrument-green font-bold">{bandwidth.toFixed(1)} Hz</span></div>
        </div>
      )}

      <div className="w-full h-full">
        <Plot
          data={[
            {
              x: freq,
              y: mag,
              type: "bar",
              marker: { color: "#3B82F6" }, // neon blue
            },
          ]}
          layout={{
            autosize: true,
            margin: { l: 40, r: 20, t: 40, b: 40 },
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            xaxis: {
              color: "#475569", // slate-600
              gridcolor: "rgba(59, 130, 246, 0.1)",
              zerolinecolor: "rgba(59, 130, 246, 0.3)",
              title: { text: "Frequency (Hz)", font: { color: "#94A3B8", size: 10 } },
              tickfont: { color: "#64748B", size: 10 },
              type: "linear",
              showspikes: true,
              spikemode: "across",
              spikesnap: "cursor",
              showline: true,
              showgrid: true,
              spikedash: "dash",
              spikecolor: "rgba(59, 130, 246, 0.7)",
              spikethickness: 1,
            },
            yaxis: {
              color: "#475569",
              gridcolor: "rgba(59, 130, 246, 0.1)",
              zerolinecolor: "rgba(59, 130, 246, 0.3)",
              title: { text: "Magnitude", font: { color: "#94A3B8", size: 10 } },
              tickfont: { color: "#64748B", size: 10 },
              showspikes: true,
              spikemode: "across",
              spikesnap: "cursor",
              showline: true,
              showgrid: true,
              spikedash: "dash",
              spikecolor: "rgba(59, 130, 246, 0.7)",
              spikethickness: 1,
            },
            hovermode: "x unified",
            showlegend: false,
            font: { family: "monospace" },
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
}
