"use client";

import React from "react";
import { Calculator } from "lucide-react";

interface CalculatorPanelProps {
  mode: "am" | "fm" | "basic";
  params: any;
}

export default function CalculatorPanel({ mode, params }: CalculatorPanelProps) {
  
  const renderCalculations = () => {
    if (mode === "am") {
      const pc = (Math.pow(params.carAmp, 2) / 2); // Assuming R=1
      const modIndex = params.modIndex;
      const pt = pc * (1 + Math.pow(modIndex, 2) / 2);
      const efficiency = (Math.pow(modIndex, 2) / (2 + Math.pow(modIndex, 2))) * 100;
      const bandwidth = 2 * params.msgFreq;

      return (
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="bg-muted p-2 rounded border border-border flex flex-col">
            <span className="text-xs text-muted-foreground font-mono">Carrier Power (Pc)</span>
            <span className="font-bold text-instrument-green">{pc.toFixed(2)} W</span>
          </div>
          <div className="bg-muted p-2 rounded border border-border flex flex-col">
            <span className="text-xs text-muted-foreground font-mono">Total Power (Pt)</span>
            <span className="font-bold text-instrument-blue">{pt.toFixed(2)} W</span>
          </div>
          <div className="bg-muted p-2 rounded border border-border flex flex-col">
            <span className="text-xs text-muted-foreground font-mono">Efficiency (η)</span>
            <span className="font-bold text-foreground">{efficiency.toFixed(1)} %</span>
          </div>
          <div className="bg-muted p-2 rounded border border-border flex flex-col">
            <span className="text-xs text-muted-foreground font-mono">Bandwidth (BW)</span>
            <span className="font-bold text-foreground">{bandwidth.toFixed(1)} Hz</span>
          </div>
        </div>
      );
    } else if (mode === "fm") {
      const beta = params.freqDev / params.msgFreq;
      const bandwidth = 2 * (params.freqDev + params.msgFreq); // Carson's Rule

      return (
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="bg-muted p-2 rounded border border-border flex flex-col">
            <span className="text-xs text-muted-foreground font-mono">Modulation Index (β)</span>
            <span className="font-bold text-instrument-blue">{beta.toFixed(2)}</span>
          </div>
          <div className="bg-muted p-2 rounded border border-border flex flex-col">
            <span className="text-xs text-muted-foreground font-mono">Bandwidth (Carson's)</span>
            <span className="font-bold text-instrument-green">{bandwidth.toFixed(1)} Hz</span>
          </div>
        </div>
      );
    }
    
    return <div className="text-sm text-muted-foreground italic">No specific calculations for basic signal mode.</div>;
  };

  return (
    <div className="bg-card text-card-foreground border border-border rounded-lg shadow-sm flex flex-col">
      <div className="flex items-center gap-2 p-3 border-b border-border bg-muted/50">
        <Calculator className="w-4 h-4 text-instrument-green" />
        <span className="font-semibold text-sm uppercase tracking-wider font-mono">Calculators</span>
      </div>
      <div className="p-4 font-sans">
        {renderCalculations()}
      </div>
    </div>
  );
}
