"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Oscilloscope from "@/components/Oscilloscope";
import PropertiesPanel from "@/components/PropertiesPanel";
import SpectrumAnalyzer from "@/components/SpectrumAnalyzer";
import { Activity, Zap, Play, Settings2, AlertTriangle, RefreshCw, Radio, Headphones, BookOpen, HelpCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import AudioController from "@/components/AudioController";
import TheoryPanel from "@/components/TheoryPanel";
import CalculatorPanel from "@/components/CalculatorPanel";
import QuizPanel from "@/components/QuizPanel";
import BlockDiagram from "@/components/BlockDiagram";
import { useSignalAudio } from "@/hooks/useSignalAudio";

export default function Home() {
  const [mode, setMode] = useState<"basic" | "am" | "fm">("basic");
  
  const [duration, setDuration] = useState("0.1");
  const [sampleRate, setSampleRate] = useState("10000");
  
  const [expression, setExpression] = useState("5*sin(2*pi*100*t)");
  
  const [msgAmp, setMsgAmp] = useState("1.0");
  const [msgFreq, setMsgFreq] = useState("10.0");
  const [carAmp, setCarAmp] = useState("1.0");
  const [carFreq, setCarFreq] = useState("100.0");
  const [snr, setSnr] = useState(""); 
  
  const [amType, setAmType] = useState("dsb-fc");
  const [modIndex, setModIndex] = useState("1.0");
  const [rcConst, setRcConst] = useState("0.001");
  const [waveform, setWaveform] = useState("sine");
  
  const [freqDev, setFreqDev] = useState("50.0");
  const [simulationSpeed, setSimulationSpeed] = useState("0.5");

  const [eduTab, setEduTab] = useState<"theory" | "calc" | "quiz">("theory");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signalData, setSignalData] = useState<any>(null);

  const { playAudio, stopAudio, isPlaying } = useSignalAudio();

  const handleSimulate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let endpoint = "https://analog-simulator-api.onrender.com/api/simulate";
      let payload: any = {
        duration: parseFloat(duration),
        sample_rate: parseFloat(sampleRate),
      };

      if (mode === "basic") {
        payload.expression = expression;
      } else if (mode === "am") {
        endpoint = "https://analog-simulator-api.onrender.com/api/am";
        payload = {
          ...payload,
          waveform: waveform,
          message_amp: parseFloat(msgAmp),
          message_freq: parseFloat(msgFreq),
          carrier_amp: parseFloat(carAmp),
          carrier_freq: parseFloat(carFreq),
          modulation_index: parseFloat(modIndex),
          am_type: amType,
          snr: snr ? parseFloat(snr) : null,
          rc_constant: parseFloat(rcConst),
        };
      } else if (mode === "fm") {
        endpoint = "https://analog-simulator-api.onrender.com/api/fm";
        payload = {
          ...payload,
          waveform: waveform,
          message_amp: parseFloat(msgAmp),
          message_freq: parseFloat(msgFreq),
          carrier_amp: parseFloat(carAmp),
          carrier_freq: parseFloat(carFreq),
          freq_deviation: parseFloat(freqDev),
          snr: snr ? parseFloat(snr) : null,
        };
      }

      const response = await axios.post(endpoint, payload);

      if (response.data.error) {
        setError(response.data.error);
      } else {
        setSignalData(response.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to simulation server.");
    } finally {
      setLoading(false);
    }
  }, [mode, expression, duration, sampleRate, msgAmp, msgFreq, carAmp, carFreq, snr, modIndex, rcConst, freqDev, waveform, amType]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSimulate();
    }, 500);
    return () => clearTimeout(timer);
  }, [handleSimulate]);

  const handleReset = () => {
    setExpression("5*sin(2*pi*100*t)");
    setMsgAmp("1.0");
    setMsgFreq("10.0");
    setCarAmp("1.0");
    setCarFreq("100.0");
    setAmType("dsb-fc");
    setModIndex("1.0");
    setRcConst("0.001");
    setFreqDev("50.0");
    setWaveform("sine");
    setSimulationSpeed("0.5");
    setSnr("");
    setSignalData(null);
    setError(null);
  };

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden transition-colors duration-200">
      
      {/* Top Navigation */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-instrument-border/50 bg-card">
        <div className="flex items-center gap-3">
          <Radio className="text-instrument-green w-7 h-7" />
          <div>
            <h1 className="text-xl font-bold tracking-widest uppercase font-mono">Analog Comm Lab</h1>
            <p className="text-muted-foreground text-xs font-mono">Virtual Engineering Environment v2.0</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar (Controls) */}
        <aside className="w-80 border-r border-instrument-border/50 bg-card/50 overflow-y-auto flex flex-col">
          {/* Mode Tabs */}
          <div className="flex flex-col border-b border-instrument-border/50 p-2 gap-1 bg-card">
            {["basic", "am", "fm"].map((t) => (
              <button
                key={t}
                onClick={() => setMode(t as any)}
                className={`px-4 py-2 font-mono uppercase tracking-wider text-sm text-left rounded transition-colors ${
                  mode === t 
                    ? "bg-instrument-green/10 text-instrument-green font-bold border-l-2 border-instrument-green" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground border-l-2 border-transparent"
                }`}
              >
                {t === "basic" ? "Basic Signal" : `${t.toUpperCase()} Modulation`}
              </button>
            ))}
          </div>

          <div className="p-4 flex flex-col gap-5 flex-1">
            <div className="flex items-center gap-2 text-foreground font-semibold uppercase text-sm tracking-wider">
              <Settings2 className="w-4 h-4 text-instrument-blue" />
              <span>Signal Parameters</span>
            </div>
            
            <div className="flex flex-col gap-4">
              {mode === "basic" && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-mono">Preset</label>
                    <select 
                      className="bg-background border border-input rounded p-2 text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-instrument-green"
                      onChange={(e) => {
                        if (e.target.value === "sine") setExpression("5*sin(2*pi*100*t)");
                        if (e.target.value === "square") setExpression("5*sign(sin(2*pi*100*t))");
                        if (e.target.value === "triangle") setExpression("5*asin(sin(2*pi*100*t))*2/pi");
                      }}
                      defaultValue="sine"
                    >
                      <option value="sine">Sine</option>
                      <option value="square">Square</option>
                      <option value="triangle">Triangle</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-mono">Signal x(t) =</label>
                    <input
                      type="text"
                      value={expression}
                      onChange={(e) => setExpression(e.target.value)}
                      className="bg-background border border-input rounded p-2 text-instrument-green font-mono text-sm focus:outline-none focus:ring-1 focus:ring-instrument-green"
                    />
                  </div>
                </>
              )}

              {(mode === "am" || mode === "fm") && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted-foreground font-mono">Msg Amp</label>
                      <input type="number" step="0.1" value={msgAmp} onChange={e => setMsgAmp(e.target.value)} className="bg-background border border-input rounded p-1.5 text-foreground font-mono text-sm focus:outline-none focus:ring-1 focus:ring-instrument-blue" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted-foreground font-mono">Msg Freq (Hz)</label>
                      <input type="number" step="1" value={msgFreq} onChange={e => setMsgFreq(e.target.value)} className="bg-background border border-input rounded p-1.5 text-foreground font-mono text-sm focus:outline-none focus:ring-1 focus:ring-instrument-blue" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted-foreground font-mono">Carrier Amp</label>
                      <input type="number" step="0.1" value={carAmp} onChange={e => setCarAmp(e.target.value)} className="bg-background border border-input rounded p-1.5 text-foreground font-mono text-sm focus:outline-none focus:ring-1 focus:ring-instrument-blue" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted-foreground font-mono">Carrier Freq</label>
                      <input type="number" step="1" value={carFreq} onChange={e => setCarFreq(e.target.value)} className="bg-background border border-input rounded p-1.5 text-foreground font-mono text-sm focus:outline-none focus:ring-1 focus:ring-instrument-blue" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground font-mono">Msg Waveform</label>
                    <select value={waveform} onChange={e => setWaveform(e.target.value)} className="bg-background border border-input rounded p-1.5 text-foreground font-mono text-sm focus:outline-none focus:ring-1 focus:ring-instrument-blue">
                      <option value="sine">Sine</option>
                      <option value="square">Square</option>
                      <option value="triangle">Triangle</option>
                    </select>
                  </div>

                  {mode === "am" && (
                    <>
                      <div className="flex flex-col gap-2 pt-2 border-t border-instrument-border/30">
                        <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                          Modulation Type <HelpCircle className="w-3 h-3 text-muted-foreground" />
                        </label>
                        <div className="flex flex-col gap-2 mb-2">
                          {[
                            { value: "dsb-fc", label: "DSB-FC (Full Carrier)" },
                            { value: "dsb-sc", label: "DSB-SC (Suppressed Carrier)" },
                            { value: "ssb-sc", label: "SSB-SC (Single Sideband)" },
                            { value: "vsb", label: "VSB (Vestigial Sideband)" }
                          ].map(opt => (
                            <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
                              <input 
                                type="radio" 
                                name="amType" 
                                value={opt.value} 
                                checked={amType === opt.value} 
                                onChange={() => setAmType(opt.value)}
                                className="accent-instrument-green"
                              />
                              {opt.label}
                            </label>
                          ))}
                        </div>
                      </div>

                      {amType === "dsb-fc" && (
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-muted-foreground font-mono flex justify-between">
                            <span>Mod Index (μ)</span>
                            {parseFloat(modIndex) > 1 && <span className="text-red-500 font-bold">Overmod!</span>}
                          </label>
                          <input type="number" step="0.1" value={modIndex} onChange={e => setModIndex(e.target.value)} className="bg-background border border-input rounded p-1.5 text-instrument-blue font-mono text-sm focus:outline-none focus:ring-1 focus:ring-instrument-blue" />
                        </div>
                      )}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground font-mono">Env. Det. RC</label>
                        <input type="number" step="0.001" value={rcConst} onChange={e => setRcConst(e.target.value)} className="bg-background border border-input rounded p-1.5 text-foreground font-mono text-sm focus:outline-none focus:ring-1 focus:ring-instrument-blue" />
                      </div>
                    </>
                  )}

                  {mode === "fm" && (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted-foreground font-mono">Freq Deviation (Δf)</label>
                      <input type="number" step="1" value={freqDev} onChange={e => setFreqDev(e.target.value)} className="bg-background border border-input rounded p-1.5 text-instrument-blue font-mono text-sm focus:outline-none focus:ring-1 focus:ring-instrument-blue" />
                    </div>
                  )}

                  <div className="flex flex-col gap-1 pt-2 border-t border-instrument-border/30">
                    <label className="text-xs text-muted-foreground font-mono">AWGN Channel (SNR dB)</label>
                    <input type="number" placeholder="No Noise (Clear Channel)" value={snr} onChange={e => setSnr(e.target.value)} className="bg-background border border-input rounded p-1.5 text-foreground font-mono text-sm focus:outline-none focus:ring-1 focus:ring-red-400" />
                  </div>
                </>
              )}
            </div>

            <div className="mt-auto pt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-mono flex justify-between">
                  <span>Sim Speed</span>
                  <span>{simulationSpeed}x</span>
                </label>
                <input 
                  type="range" 
                  min="0" max="2" step="0.1" 
                  value={simulationSpeed} 
                  onChange={e => setSimulationSpeed(e.target.value)} 
                  className="w-full accent-instrument-green cursor-pointer" 
                />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleReset} className="w-10 h-10 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded flex items-center justify-center transition-colors">
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button onClick={handleSimulate} disabled={loading} className="flex-1 h-10 bg-instrument-green hover:bg-green-500 text-black font-bold rounded flex items-center justify-center gap-2 transition-colors">
                  <Play className="w-4 h-4 fill-current" />
                  {loading ? "SIMULATING..." : "UPDATE"}
                </button>
              </div>
              
              {/* Audio Controls */}
              {(mode === "am" || mode === "fm") && (
                <div className="flex flex-col gap-2 mt-2">
                  <button 
                    onClick={() => playAudio(signalData?.audio_message || [], parseFloat(sampleRate))} 
                    disabled={!signalData?.audio_message || isPlaying}
                    className="w-full h-8 bg-instrument-blue/10 hover:bg-instrument-blue/20 border border-instrument-blue/30 text-instrument-blue rounded text-xs font-mono transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPlaying ? "Playing..." : "▶ Orig Message"}
                  </button>
                  <button 
                    onClick={() => playAudio(signalData?.audio_demodulated || [], parseFloat(sampleRate))} 
                    disabled={!signalData?.audio_demodulated || isPlaying}
                    className="w-full h-8 bg-instrument-blue/10 hover:bg-instrument-blue/20 border border-instrument-blue/30 text-instrument-blue rounded text-xs font-mono transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPlaying ? "Playing..." : "▶ Demodulated"}
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded flex items-start gap-3 text-red-500 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="font-mono">{error}</div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Stage (Visualizations) */}
        <main className="flex-1 flex flex-col bg-background overflow-hidden">
          <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
            {signalData?.overmodulated && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded font-mono text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <strong>WARNING:</strong> Overmodulation Detected ($\mu > 1.0$). Distortion will occur in envelope detection.
              </div>
            )}
            
            {/* Audio Controls */}
            {signalData?.traces && (
              <div className="grid grid-cols-2 gap-4 shrink-0">
                <AudioController 
                  label="Original Message Audio" 
                  signal={signalData.traces.find((t: any) => t.name === "Original Message")?.y} 
                  duration={parseFloat(duration)} 
                />
                <AudioController 
                  label="Demodulated Audio" 
                  signal={signalData.traces.find((t: any) => t.name.includes("Demodulated"))?.y} 
                  duration={parseFloat(duration)} 
                  isOvermodulated={signalData.overmodulated}
                />
              </div>
            )}
            
            <BlockDiagram mode={mode} />
            
            <section className="bg-card border border-border rounded-lg shadow-sm h-[400px] shrink-0 overflow-hidden">
              <Oscilloscope 
                time={signalData?.time || []} 
                amplitude={signalData?.amplitude}
                traces={signalData?.traces}
                simulationSpeed={parseFloat(simulationSpeed)}
              />
            </section>

            {signalData?.fft_freq && signalData?.fft_mag && (
                <section className="bg-card border border-border rounded-lg shadow-sm h-[300px] shrink-0 overflow-hidden">
                <SpectrumAnalyzer
                    freq={signalData.fft_freq}
                    mag={signalData.fft_mag}
                />
                </section>
            )}
          </div>
        </main>

        {/* Right Sidebar (Educational Content) */}
        <aside className="w-80 border-l border-instrument-border/50 bg-card/30 overflow-y-auto flex flex-col hidden xl:flex">
          <div className="flex border-b border-instrument-border/50 p-2 gap-1 bg-card">
            {["theory", "calc", "quiz"].map((t) => (
              <button
                key={t}
                onClick={() => setEduTab(t as any)}
                className={`flex-1 py-1.5 font-mono uppercase tracking-wider text-[10px] rounded transition-colors ${
                  eduTab === t 
                    ? "bg-instrument-blue/20 text-instrument-blue font-bold border-b-2 border-instrument-blue" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground border-b-2 border-transparent"
                }`}
              >
                {t === "calc" ? "Calculators" : t}
              </button>
            ))}
          </div>
          
          <div className="p-4 flex-1 flex flex-col gap-4">
            {eduTab === "theory" && (
              <TheoryPanel 
                content={
                  mode === "am" 
                    ? `## Amplitude Modulation (AM)\n\nAmplitude modulation is a technique used in electronic communication, most commonly for transmitting messages with a radio wave. \n\n### Equation\n$s(t) = [A_c + m(t)] \\cos(2\\pi f_c t)$\n\nWhere:\n- $A_c$ is the carrier amplitude.\n- $m(t)$ is the message signal.\n- $f_c$ is the carrier frequency.\n\n### Modulation Index\n$\\mu = \\frac{A_m}{A_c}$\n\nIf $\\mu > 1$, overmodulation occurs, causing distortion.`
                    : mode === "fm"
                    ? `## Frequency Modulation (FM)\n\nFrequency modulation conveys information over a carrier wave by varying its instantaneous frequency. \n\n### Equation\n$s(t) = A_c \\cos\\left(2\\pi f_c t + 2\\pi k_f \\int_0^t m(\\tau) d\\tau\\right)$\n\n### Carson's Rule\n$BW \\approx 2(\\Delta f + f_m)$`
                    : `## Basic Signal\n\nA continuous-time signal $x(t)$ can be described mathematically. \n\nUse the panel to generate standard Sine, Square, or Triangle waves, or input a custom mathematical expression.`
                } 
              />
            )}
            
            {eduTab === "calc" && (
              <CalculatorPanel 
                mode={mode} 
                params={{
                  carAmp: parseFloat(carAmp),
                  msgFreq: parseFloat(msgFreq),
                  modIndex: parseFloat(modIndex),
                  freqDev: parseFloat(freqDev)
                }} 
              />
            )}
            
            {eduTab === "quiz" && (
              <QuizPanel 
                questions={
                  mode === "am" ? [
                    { question: "What causes overmodulation in AM?", options: ["High carrier frequency", "μ > 1", "Low message amplitude"], answer: 1 },
                    { question: "What is the bandwidth of a DSB-FC AM signal?", options: ["fm", "2 * fm", "fc + fm"], answer: 1 }
                  ] : mode === "fm" ? [
                    { question: "Which modulation technique is more immune to noise?", options: ["AM", "FM", "Both are equal"], answer: 1 },
                    { question: "What rule is used to estimate FM Bandwidth?", options: ["Carson's Rule", "Nyquist Rate", "Shannon Limit"], answer: 0 }
                  ] : [
                    { question: "What is the frequency of a signal with period T=0.1s?", options: ["1 Hz", "10 Hz", "100 Hz"], answer: 1 }
                  ]
                } 
              />
            )}
          </div>
        </aside>

      </div>
    </div>
  );
}
