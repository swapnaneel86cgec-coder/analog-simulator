import { useState, useRef, useEffect } from 'react';

export function useSignalAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const conditionAudioSignal = (rawData: number[]) => {
    if (!rawData || rawData.length === 0) return new Float32Array(0);
    
    // Remove DC offset (subtract mean)
    const mean = rawData.reduce((acc, val) => acc + val, 0) / rawData.length;
    const zeroCentered = rawData.map(val => val - mean);
    
    // Find max absolute value to normalize amplitude
    let maxAbs = 0;
    for (let i = 0; i < zeroCentered.length; i++) {
      if (Math.abs(zeroCentered[i]) > maxAbs) {
        maxAbs = Math.abs(zeroCentered[i]);
      }
    }
    
    // Normalize to [-0.9, 0.9] to prevent clipping
    const scale = maxAbs > 0 ? 0.9 / maxAbs : 0;
    const normalized = new Float32Array(zeroCentered.length);
    for (let i = 0; i < zeroCentered.length; i++) {
      normalized[i] = zeroCentered[i] * scale;
    }
    
    return normalized;
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (e) {
        // Ignore if already stopped
      }
      sourceNodeRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsPlaying(false);
  };

  const playAudio = async (amplitudeArray: number[], sampleRate: number = 44100) => {
    stopAudio(); // Stop any currently playing audio to prevent overlapping
    
    if (!amplitudeArray || amplitudeArray.length === 0) return;

    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext({ sampleRate: sampleRate });
      audioContextRef.current = ctx;

      const conditionedData = conditionAudioSignal(amplitudeArray);
      
      const buffer = ctx.createBuffer(1, conditionedData.length, sampleRate);
      buffer.copyToChannel(conditionedData, 0);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      
      source.onended = () => {
        setIsPlaying(false);
      };

      sourceNodeRef.current = source;
      source.start();
      setIsPlaying(true);
    } catch (err) {
      console.error("Audio playback failed:", err);
      setIsPlaying(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAudio();
  }, []);

  return { playAudio, stopAudio, isPlaying };
}
