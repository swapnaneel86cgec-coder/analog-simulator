"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Play, Square } from "lucide-react";

interface AudioControllerProps {
  label: string;
  signal: number[] | undefined;
  duration: number; // to calculate effective sample rate
  isOvermodulated?: boolean;
}

export default function AudioController({ label, signal, duration, isOvermodulated }: AudioControllerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [muted, setMuted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  useEffect(() => {
    // Initialize AudioContext on first user interaction or mount if allowed
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      gainNodeRef.current = audioCtxRef.current.createGain();
      gainNodeRef.current.connect(audioCtxRef.current.destination);
    }
  }, []);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = muted ? 0 : volume;
    }
  }, [volume, muted]);

  const stopAudio = () => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    setIsPlaying(false);
  };

  const playAudio = () => {
    if (!audioCtxRef.current || !signal || signal.length === 0 || !gainNodeRef.current) return;
    
    stopAudio(); // Stop existing

    // Calculate effective sample rate based on subsampled array length
    const effectiveSampleRate = signal.length / duration;
    
    // Web Audio API requires sample rate between 3000 and 384000
    const clampedSampleRate = Math.max(3000, Math.min(384000, effectiveSampleRate));
    
    const buffer = audioCtxRef.current.createBuffer(1, signal.length, clampedSampleRate);
    const channelData = buffer.getChannelData(0);

    // Normalize signal to -1 to 1 to avoid harsh clipping/popping unless intended
    let maxAbs = 0;
    for (let i = 0; i < signal.length; i++) {
      if (Math.abs(signal[i]) > maxAbs) maxAbs = Math.abs(signal[i]);
    }
    
    for (let i = 0; i < signal.length; i++) {
      channelData[i] = maxAbs > 0 ? signal[i] / maxAbs : 0;
    }

    const source = audioCtxRef.current.createBufferSource();
    source.buffer = buffer;
    source.loop = true; // Loop the short buffer for continuous tone
    source.connect(gainNodeRef.current);
    source.start();
    
    sourceRef.current = source;
    setIsPlaying(true);
  };

  // Stop audio if unmounted
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  // Update audio dynamically if signal changes while playing
  useEffect(() => {
    if (isPlaying) {
      playAudio();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signal, duration]);

  return (
    <div className="flex flex-col gap-2 p-3 bg-card border border-border rounded-lg">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold font-mono text-foreground flex items-center gap-2">
          {label}
          {isOvermodulated && (
            <span className="text-[10px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest">Distorted</span>
          )}
        </span>
        <div className="flex gap-1">
          <button 
            onClick={isPlaying ? stopAudio : playAudio}
            className={`p-1.5 rounded-md transition-colors ${isPlaying ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-instrument-green/20 text-instrument-green hover:bg-instrument-green/30'}`}
            title={isPlaying ? "Stop Audio" : "Play Audio"}
          >
            {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button onClick={() => setMuted(!muted)} className="text-muted-foreground hover:text-foreground">
          {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          value={muted ? 0 : volume}
          onChange={(e) => {
            setVolume(parseFloat(e.target.value));
            setMuted(false);
          }}
          className="flex-1 accent-instrument-blue h-1 cursor-pointer"
        />
      </div>
    </div>
  );
}
