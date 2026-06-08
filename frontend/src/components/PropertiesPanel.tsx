import React from "react";

interface Properties {
  amplitude: number;
  frequency: number;
  time_period: number;
  rms: number;
  phase_shift: number;
}

interface PropertiesPanelProps {
  properties: Properties | null;
}

export default function PropertiesPanel({ properties }: PropertiesPanelProps) {
  if (!properties) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-500 font-mono text-sm border-2 border-instrument-border rounded-lg bg-instrument-panel">
        WAITING FOR SIGNAL...
      </div>
    );
  }

  const formatVal = (val: number) => {
    if (val === 0) return "0.00";
    if (Math.abs(val) < 0.01 || Math.abs(val) > 10000) {
      return val.toExponential(2);
    }
    return val.toFixed(2);
  };

  const PropertyItem = ({ label, value, unit }: { label: string; value: string; unit: string }) => (
    <div className="flex flex-col bg-instrument-screen p-3 rounded border border-instrument-border shadow-inner">
      <span className="text-xs text-slate-400 font-sans tracking-wide uppercase mb-1">{label}</span>
      <div className="flex items-baseline gap-1 font-mono text-instrument-green text-xl shadow-instrument-green drop-shadow-md">
        <span>{value}</span>
        <span className="text-xs text-slate-500">{unit}</span>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full p-4 rounded-lg border-2 border-instrument-border bg-instrument-panel grid grid-cols-2 md:grid-cols-5 gap-4">
      <PropertyItem label="Amplitude" value={formatVal(properties.amplitude)} unit="V" />
      <PropertyItem label="Vrms" value={formatVal(properties.rms)} unit="V" />
      <PropertyItem label="Frequency" value={formatVal(properties.frequency)} unit="Hz" />
      <PropertyItem label="Period" value={formatVal(properties.time_period)} unit="s" />
      <PropertyItem label="Phase" value={formatVal(properties.phase_shift)} unit="°" />
    </div>
  );
}
