import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  X, 
  Radio, 
  Trash2, 
  Activity, 
  Zap, 
  Volume2,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { midiService } from '../services/midiService';
import { MidiBinding } from '../types';

interface MidiModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterDimmer: number;
  setMasterDimmer: (val: number) => void;
  masterBlackout: boolean;
  setMasterBlackout: (val: boolean) => void;
  onTriggerScene: (index: number) => void;
}

export const MidiModal: React.FC<MidiModalProps> = ({
  isOpen,
  onClose,
  masterDimmer,
  setMasterDimmer,
  masterBlackout,
  setMasterBlackout,
  onTriggerScene,
}) => {
  const [devices, setDevices] = useState<string[]>([]);
  const [bindings, setBindings] = useState<MidiBinding[]>([]);
  const [lastMessage, setLastMessage] = useState<{
    channel: number;
    type: string;
    controller: number;
    value: number;
  } | null>(null);

  // Virtual controller faders
  const [faders, setFaders] = useState<number[]>([127, 100, 80, 110, 64, 90, 127, 50]);

  useEffect(() => {
    if (!isOpen) return;

    midiService.initMidi().then(() => {
      setDevices(midiService.getDeviceNames());
    });
    setBindings(midiService.bindings);

    const unsubscribe = midiService.subscribe((data) => {
      setLastMessage({
        channel: data.channel,
        type: data.type.toUpperCase(),
        controller: data.controller,
        value: data.value,
      });

      // Handle default virtual / physical mappings
      if (data.type === 'cc' && data.controller === 1) {
        setMasterDimmer(data.normalized);
      } else if (data.type === 'note') {
        if (data.controller === 36) {
          setMasterBlackout(!masterBlackout);
        } else if (data.controller >= 37 && data.controller <= 42) {
          onTriggerScene(data.controller - 37);
        }
      }
    });

    return () => unsubscribe();
  }, [isOpen, masterBlackout, setMasterDimmer, setMasterBlackout, onTriggerScene]);

  if (!isOpen) return null;

  const handleVirtualFaderChange = (index: number, val: number) => {
    const updated = [...faders];
    updated[index] = val;
    setFaders(updated);
    midiService.triggerVirtualMidi('cc', index + 1, val);
  };

  const handleVirtualPadClick = (note: number) => {
    midiService.triggerVirtualMidi('note', note, 127);
  };

  const handleDeleteBinding = (id: string) => {
    midiService.bindings = midiService.bindings.filter(b => b.id !== id);
    setBindings([...midiService.bindings]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md select-none p-4 animate-in fade-in">
      <div className="bg-studio-900 border border-studio-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-studio-750 flex items-center justify-between bg-studio-850">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-cyan/20 border border-accent-cyan/40 flex items-center justify-center">
              <Sliders className="w-4 h-4 text-accent-cyan" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <span>Hardware MIDI & Virtual Macro Console</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                  Web MIDI API
                </span>
              </h2>
              <p className="text-[11px] text-studio-400">Map physical DJ/VJ controllers, knobs, faders & pads</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-studio-750 text-studio-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-xs">
          {/* Hardware Connection Status */}
          <div className="p-3.5 bg-studio-850 rounded-xl border border-studio-750 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Radio className={`w-5 h-5 ${devices.length > 0 ? 'text-emerald-400 animate-pulse' : 'text-studio-500'}`} />
              <div>
                <div className="font-semibold text-slate-200">
                  {devices.length > 0 ? `${devices.length} MIDI Controller(s) Connected` : 'No Physical MIDI Device Detected'}
                </div>
                <div className="text-[11px] text-studio-400">
                  {devices.length > 0 ? devices.join(', ') : 'Plug in any USB MIDI keyboard or DJ controller, or use the virtual console below'}
                </div>
              </div>
            </div>

            {lastMessage && (
              <div className="bg-studio-950 px-3 py-1.5 rounded-lg border border-studio-700 font-mono text-[11px] text-accent-cyan">
                CH{lastMessage.channel} • {lastMessage.type} #{lastMessage.controller}: {lastMessage.value}
              </div>
            )}
          </div>

          {/* Virtual On-Screen Hardware Console */}
          <div className="p-4 bg-studio-950 rounded-xl border border-studio-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-slate-300 tracking-wider flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-accent-cyan" />
                <span>Virtual Hardware Emulation Console</span>
              </span>
              <span className="text-[10px] text-studio-400">Test live without physical MIDI hardware</span>
            </div>

            {/* 8 Virtual Faders */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-semibold text-studio-400">8-CHANNEL CONTINUOUS FADERS (CC 1 - CC 8)</div>
              <div className="grid grid-cols-8 gap-2 bg-studio-900 p-3 rounded-lg border border-studio-800">
                {faders.map((val, idx) => (
                  <div key={idx} className="flex flex-col items-center space-y-2">
                    <span className="font-mono text-[10px] text-accent-cyan">{Math.round((val / 127) * 100)}%</span>
                    <input
                      type="range"
                      min="0"
                      max="127"
                      value={val}
                      onChange={(e) => handleVirtualFaderChange(idx, parseInt(e.target.value))}
                      className="w-full accent-accent-cyan cursor-pointer h-20 -rotate-90 origin-center my-6"
                    />
                    <span className="font-mono text-[9px] text-studio-400">
                      {idx === 0 ? 'DIMMER' : `CH ${idx + 1}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 8 Drum Velocity Trigger Pads */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-semibold text-studio-400">PERFORMANCE TRIGGER PADS (NOTE 36 - NOTE 43)</div>
              <div className="grid grid-cols-8 gap-2">
                {[
                  { note: 36, label: 'BLACKOUT', color: 'bg-rose-500/20 text-rose-400 border-rose-500/40' },
                  { note: 37, label: 'CUE 1', color: 'bg-accent-cyan/20 text-accent-cyan border-accent-cyan/40' },
                  { note: 38, label: 'CUE 2', color: 'bg-accent-neon/20 text-accent-neon border-accent-neon/40' },
                  { note: 39, label: 'CUE 3', color: 'bg-accent-purple/20 text-accent-purple border-accent-purple/40' },
                  { note: 40, label: 'STROBE', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
                  { note: 41, label: 'FX PULSE', color: 'bg-sky-500/20 text-sky-400 border-sky-500/40' },
                  { note: 42, label: 'SOLO 1', color: 'bg-pink-500/20 text-pink-400 border-pink-500/40' },
                  { note: 43, label: 'SOLO 2', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
                ].map((pad) => (
                  <button
                    key={pad.note}
                    onClick={() => handleVirtualPadClick(pad.note)}
                    className={`h-14 rounded-lg border font-mono text-[10px] font-bold flex flex-col items-center justify-center p-1 transition-all active:scale-95 hover:brightness-125 ${pad.color}`}
                  >
                    <span>{pad.label}</span>
                    <span className="text-[8px] opacity-60">#{pad.note}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active MIDI Mappings Table */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase font-bold text-studio-400 tracking-wider">
              Assigned Control Mappings
            </div>

            <div className="border border-studio-750 rounded-lg overflow-hidden bg-studio-850">
              <div className="grid grid-cols-4 p-2 bg-studio-800 text-[10px] font-semibold text-studio-400 border-b border-studio-750">
                <span>INPUT</span>
                <span>TYPE</span>
                <span>ACTION TARGET</span>
                <span className="text-right">MANAGE</span>
              </div>
              <div className="divide-y divide-studio-800">
                <div className="grid grid-cols-4 p-2 text-slate-200 items-center">
                  <span className="font-mono text-accent-cyan">CC #1</span>
                  <span>Slider / Knob</span>
                  <span>Master Projector Dimmer</span>
                  <span className="text-right text-studio-500">Default</span>
                </div>
                <div className="grid grid-cols-4 p-2 text-slate-200 items-center">
                  <span className="font-mono text-rose-400">Note #36</span>
                  <span>Pad / Key</span>
                  <span>Master Blackout Toggle</span>
                  <span className="text-right text-studio-500">Default</span>
                </div>
                <div className="grid grid-cols-4 p-2 text-slate-200 items-center">
                  <span className="font-mono text-accent-cyan">Note #37 - #42</span>
                  <span>Pads</span>
                  <span>Instant Cue / Scene Triggers</span>
                  <span className="text-right text-studio-500">Default</span>
                </div>
                {bindings.map((b) => (
                  <div key={b.id} className="grid grid-cols-4 p-2 text-slate-200 items-center">
                    <span className="font-mono text-accent-neon">{b.type.toUpperCase()} #{b.controller}</span>
                    <span>Channel {b.channel}</span>
                    <span>{b.label}</span>
                    <div className="text-right">
                      <button
                        onClick={() => handleDeleteBinding(b.id)}
                        className="p-1 hover:text-rose-400 text-studio-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

