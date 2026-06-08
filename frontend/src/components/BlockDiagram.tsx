"use client";

import React, { useState } from "react";
import { Zap } from "lucide-react";

interface BlockDiagramProps {
  mode: "am" | "fm" | "basic";
}

export default function BlockDiagram({ mode }: BlockDiagramProps) {
  const [activeBlock, setActiveBlock] = useState<string | null>(null);

  if (mode === "basic") {
    return <div className="text-sm text-muted-foreground italic p-4">Block diagram not applicable for basic signal generator.</div>;
  }

  const blocks = mode === "am" ? [
    { id: "msg", label: "Message Source m(t)", info: "Generates the baseband signal (e.g. voice/data) to be transmitted." },
    { id: "osc", label: "Carrier Oscillator", info: "Produces the high frequency carrier wave c(t) = Ac cos(2πfct)." },
    { id: "mod", label: "AM Modulator", info: "Multiplies the carrier by (1 + m(t)) to produce the AM signal." },
    { id: "amp", label: "Power Amplifier", info: "Boosts the signal power for transmission over the antenna." },
    { id: "ant_tx", label: "TX Antenna", info: "Radiates the electromagnetic wave." },
    { id: "channel", label: "AWGN Channel", info: "Adds Additive White Gaussian Noise to the signal during propagation." },
    { id: "ant_rx", label: "RX Antenna", info: "Receives the attenuated and noisy electromagnetic wave." },
    { id: "env", label: "Envelope Detector", info: "Extracts the envelope of the AM signal using a diode and RC low-pass filter." },
    { id: "out", label: "Audio Output", info: "The recovered baseband signal (demodulated message)." },
  ] : [
    { id: "msg", label: "Message Source m(t)", info: "Generates the baseband signal." },
    { id: "integrator", label: "Integrator", info: "Integrates the message signal for phase accumulation." },
    { id: "vco", label: "VCO (Modulator)", info: "Voltage Controlled Oscillator changes frequency based on input voltage." },
    { id: "amp", label: "Power Amplifier", info: "Boosts the signal power." },
    { id: "ant_tx", label: "TX Antenna", info: "Radiates the FM wave." },
    { id: "channel", label: "AWGN Channel", info: "Adds noise. Note: FM is highly resilient to amplitude noise." },
    { id: "ant_rx", label: "RX Antenna", info: "Receives the FM wave." },
    { id: "limiter", label: "Amplitude Limiter", info: "Clips amplitude variations to remove AM noise." },
    { id: "disc", label: "Discriminator", info: "Converts frequency variations back into amplitude variations." },
    { id: "env", label: "Envelope Detector", info: "Extracts the original message from the discriminator output." },
  ];

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm flex flex-col mt-4">
      <div className="flex items-center gap-2 p-3 border-b border-border bg-muted/50">
        <Zap className="w-4 h-4 text-instrument-green" />
        <span className="font-semibold text-sm uppercase tracking-wider font-mono">System Architecture</span>
      </div>
      <div className="p-4 flex flex-col gap-4">
        <div className="flex flex-wrap gap-2 justify-center items-center">
          {blocks.map((b, idx) => (
            <React.Fragment key={b.id}>
              <button
                onClick={() => setActiveBlock(b.id)}
                className={`px-3 py-2 text-xs font-bold font-mono border rounded transition-colors shadow-sm ${
                  activeBlock === b.id 
                    ? "bg-instrument-green text-black border-instrument-green" 
                    : "bg-background text-foreground border-border hover:border-instrument-green hover:bg-instrument-green/10"
                }`}
              >
                {b.label}
              </button>
              {idx < blocks.length - 1 && (
                <div className="text-muted-foreground">→</div>
              )}
            </React.Fragment>
          ))}
        </div>

        {activeBlock && (
          <div className="bg-muted border border-instrument-green/50 rounded p-3 text-sm">
            <span className="font-bold text-instrument-green block mb-1">
              {blocks.find(b => b.id === activeBlock)?.label}
            </span>
            <span className="text-muted-foreground">
              {blocks.find(b => b.id === activeBlock)?.info}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
