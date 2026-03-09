import React, { useState } from 'react';
import { Users, Plus, Play, X, ArrowLeft, Briefcase } from 'lucide-react';

interface GameSetupProps {
  onStartGame: (playerNames: string[]) => void;
  onBack: () => void;
}

export const GameSetup: React.FC<GameSetupProps> = ({ onStartGame, onBack }) => {
  const [names, setNames] = useState<string[]>(['', '', '', '']); // Default 4 slots
  
  const handleNameChange = (index: number, value: string) => {
    const newNames = [...names];
    newNames[index] = value;
    setNames(newNames);
  };

  const addSlot = () => setNames([...names, '']);
  const removeSlot = (index: number) => {
      const newNames = names.filter((_, i) => i !== index);
      setNames(newNames);
  };

  const canStart = names.filter(n => n.trim().length > 0).length >= 2;

  const handleStart = () => {
    const validNames = names.filter(n => n.trim().length > 0);
    if (validNames.length >= 2) {
      onStartGame(validNames);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-sky-50 relative overflow-hidden">
        {/* Decor */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400"></div>

        {/* Back Button */}
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 z-20 p-3 rounded-2xl bg-white text-slate-400 hover:text-sky-500 hover:shadow-md transition-all border border-slate-100"
        >
          <ArrowLeft className="w-6 h-6 stroke-[3]" />
        </button>

        <div className="relative z-10 w-full max-w-md">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white mb-4 shadow-lg text-sky-500">
                    <Users className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-black text-slate-800 mb-2">Thành Viên Cuộc Họp</h1>
                <p className="text-slate-500 font-medium">Nhập tên các thành viên tham gia</p>
            </div>

            <div className="space-y-3 mb-8">
                {names.map((name, index) => (
                    <div key={index} className="flex gap-2 group relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-sm pointer-events-none">
                            #{index + 1}
                        </div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => handleNameChange(index, e.target.value)}
                            placeholder={`Tên thành viên...`}
                            className="flex-1 bg-white border-2 border-slate-100 text-slate-800 font-bold rounded-2xl pl-12 pr-4 py-4 focus:ring-4 focus:ring-sky-100 focus:border-sky-400 outline-none transition-all placeholder-slate-300 shadow-sm"
                            autoFocus={index === 0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const nextInput = document.querySelectorAll('input')[index + 1] as HTMLInputElement;
                                    if (nextInput) nextInput.focus();
                                    else addSlot();
                                }
                            }}
                        />
                        {names.length > 2 && (
                            <button 
                                onClick={() => removeSlot(index)}
                                tabIndex={-1}
                                className="p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                            >
                                <X className="w-5 h-5 stroke-[3]" />
                            </button>
                        )}
                    </div>
                ))}
                
                <button
                    onClick={addSlot}
                    className="w-full py-4 border-2 border-dashed border-slate-300 text-slate-400 rounded-2xl hover:border-sky-400 hover:text-sky-500 hover:bg-sky-50 transition-all flex items-center justify-center gap-2 font-bold"
                >
                    <Plus className="w-5 h-5" /> Thêm thành viên
                </button>
            </div>

            <button
                onClick={handleStart}
                disabled={!canStart}
                className={`w-full py-5 px-6 rounded-3xl flex items-center justify-center gap-3 font-black text-xl transition-all shadow-xl transform ${
                    canStart 
                    ? 'bg-sky-500 hover:bg-sky-600 text-white shadow-sky-500/30 hover:-translate-y-1' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
            >
                <Play className="w-6 h-6 fill-current" />
                Bắt Đầu
            </button>
        </div>
    </div>
  );
};