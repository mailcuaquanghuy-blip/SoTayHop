import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Calculator, Crown, Users, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import { Player, RoundScores } from '../types';

interface RoundInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  onSubmit: (scores: RoundScores) => void;
  initialScores?: RoundScores | null; // For editing
  participatingPlayerIds: string[];
  onToggleParticipation: (playerId: string) => void;
}

type InputMode = 'WINNER' | 'FREE';

export const RoundInputModal: React.FC<RoundInputModalProps> = ({ 
  isOpen, 
  onClose, 
  players, 
  onSubmit, 
  initialScores,
  participatingPlayerIds,
  onToggleParticipation
}) => {
  const [mode, setMode] = useState<InputMode>('WINNER');
  
  // State for Winner Mode
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null);
  const [loserPoints, setLoserPoints] = useState<{[key: string]: string}>({}); // Stores positive numbers typed by user
  const [addAllAmount, setAddAllAmount] = useState<string>('');

  // State for Free Mode
  const [freeInputs, setFreeInputs] = useState<{[key: string]: string}>({});

  const firstInputRef = useRef<HTMLInputElement>(null);

  const PARTICIPATION_STORAGE_KEY = 'meeting-participating-players';

  useEffect(() => {
    if (isOpen) {
      if (initialScores) {
          // EDIT MODE: Default to Free Mode for simplicity when editing
          const init: {[key: string]: string} = {};
          players.forEach(p => {
              init[p.id] = String(initialScores[p.id] || 0);
          });
          setFreeInputs(init);
          setMode('FREE');
          setSelectedWinnerId(null);
          setLoserPoints({});
      } else {
          // NEW ROUND MODE
          setSelectedWinnerId(null);
          setLoserPoints({});
          const initialFree: {[key: string]: string} = {};
          players.forEach(p => initialFree[p.id] = '');
          setFreeInputs(initialFree);
          setMode('WINNER');
      }
    }
  }, [isOpen, players, initialScores]);

  // Focus effect when winner is selected in Winner Mode
  useEffect(() => {
    if (mode === 'WINNER' && selectedWinnerId) {
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
    }
  }, [selectedWinnerId, mode]);

  // --- Handlers for Winner Mode ---

  const handleLoserPointChange = (playerId: string, value: string) => {
    const valStr = String(value);
    if (parseInt(valStr, 10) < 0) return; 
    setLoserPoints(prev => ({ ...prev, [playerId]: valStr }));
  };

  const handleQuickAddWinnerMode = (playerId: string, amount: number) => {
    const currentVal = parseInt(loserPoints[playerId] || '0', 10);
    const safeVal = isNaN(currentVal) ? 0 : currentVal;
    const newVal = Math.max(0, safeVal + amount); // Ensure non-negative
    handleLoserPointChange(playerId, String(newVal));
  };

  const handleAddAll = () => {
    const amount = parseInt(addAllAmount, 10);
    if (isNaN(amount) || amount <= 0) return;
    
    const newLoserPoints = { ...loserPoints };
    participatingPlayers.forEach(p => {
      if (p.id !== selectedWinnerId) {
        const currentVal = parseInt(newLoserPoints[p.id] || '0', 10);
        const safeVal = isNaN(currentVal) ? 0 : currentVal;
        newLoserPoints[p.id] = String(safeVal + amount);
      }
    });
    setLoserPoints(newLoserPoints);
    setAddAllAmount('');
  };

  const calculateWinnerTotal = () => {
    let total = 0;
    Object.values(loserPoints).forEach(val => {
      const num = parseInt(val as string, 10);
      if (!isNaN(num)) total += num;
    });
    return total;
  };

  // --- Handlers for Free Mode ---

  const handleFreeInputChange = (playerId: string, value: string) => {
    setFreeInputs(prev => ({ ...prev, [playerId]: value }));
  };

  const calculateFreeTotal = () => {
    let total = 0;
    Object.values(freeInputs).forEach(val => {
        const num = parseInt(val as string, 10);
        if(!isNaN(num)) total += num;
    });
    return total;
  };

  const participatingPlayers = players.filter(p => participatingPlayerIds.includes(p.id));

  // --- Submit ---

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalScores: RoundScores = {};

    if (mode === 'WINNER') {
      if (!selectedWinnerId) return; 
      
      let totalPot = 0;
      players.forEach(p => {
        if (p.id === selectedWinnerId) return; 

        const loss = parseInt(loserPoints[p.id] || '0', 10);
        if (loss > 0) {
          finalScores[p.id] = -loss; 
          totalPot += loss;
        } else {
          finalScores[p.id] = 0;
        }
      });
      finalScores[selectedWinnerId] = totalPot;

    } else if (mode === 'FREE') {
      // Free Mode
      players.forEach(p => {
        const val = parseInt(freeInputs[p.id], 10);
        finalScores[p.id] = isNaN(val) ? 0 : val;
      });
    }

    onSubmit(finalScores);
    onClose();
  };

  if (!isOpen) return null;

  const currentFreeTotal = calculateFreeTotal();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header with Mode Switcher */}
        <div className="flex flex-col bg-sky-50 border-b border-slate-100">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <span className="text-3xl">📝</span>
              {initialScores ? 'Sửa Điểm Phiên' : 'Ghi Chú Điểm'}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X className="w-6 h-6 stroke-[3]" />
            </button>
          </div>
          
          <div className="flex p-3 gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setMode('WINNER')}
              className={`flex-1 min-w-[100px] py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${mode === 'WINNER' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' : 'bg-white text-slate-400 border-2 border-slate-100'}`}
            >
              <Crown className="w-5 h-5 fill-current" />
              Người Thắng
            </button>
            <button
              onClick={() => setMode('FREE')}
              className={`flex-1 min-w-[100px] py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${mode === 'FREE' ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-slate-400 border-2 border-slate-100'}`}
            >
              <ArrowRightLeft className="w-5 h-5" />
              Tự Do
            </button>
          </div>
        </div>

        {/* Scrollable Form Area */}
        <div className="overflow-y-auto p-5 space-y-6">
          <form id="round-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* --- WINNER MODE UI --- */}
            {mode === 'WINNER' && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                {/* 1. Select Winner */}
                <div>
                  <label className="block text-sm font-black text-slate-400 mb-3 uppercase tracking-wider text-center">
                    Ai là MVP phiên này?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {participatingPlayers.map(p => {
                      const isSelected = selectedWinnerId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedWinnerId(p.id)}
                          className={`p-4 rounded-3xl border-2 transition-all flex items-center justify-between ${
                            isSelected 
                              ? 'bg-sky-50 border-sky-400 text-sky-800 shadow-md transform scale-[1.02]' 
                              : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          <span className="font-bold truncate">{p.name}</span>
                          {isSelected ? <Crown className="w-6 h-6 text-sky-500 fill-current" /> : <div className="w-6 h-6 rounded-full border-2 border-slate-200"></div>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Input Losers */}
                {selectedWinnerId && (
                  <div className="animate-in slide-in-from-bottom-4 duration-300 border-t-2 border-dashed border-slate-100 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-black text-slate-400 uppercase tracking-wider">
                        Người khác trừ bao nhiêu?
                      </label>
                    </div>
                    
                    {/* Add to all input */}
                    <div className="flex items-center gap-2 mb-6 bg-slate-50 p-2 rounded-2xl border-2 border-slate-100">
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        value={addAllAmount}
                        onChange={(e) => setAddAllAmount(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddAll();
                          }
                        }}
                        placeholder="Cộng cho tất cả..."
                        className="flex-1 bg-transparent text-slate-700 text-lg font-bold px-3 py-2 outline-none placeholder-slate-300"
                      />
                      <button
                        type="button"
                        onClick={handleAddAll}
                        disabled={!addAllAmount}
                        className="bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-xl transition-colors whitespace-nowrap"
                      >
                        Cộng
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {participatingPlayers.filter(p => p.id !== selectedWinnerId).map((player, idx) => (
                        <div key={player.id} className="flex items-center gap-3">
                          <div className="w-1/3 font-bold text-slate-700 truncate text-right">
                             {player.name}
                          </div>
                          <div className="flex-1 relative">
                             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400 font-black text-lg">-</div>
                             <input
                               ref={idx === 0 ? firstInputRef : null}
                               id={`loss-${player.id}`}
                               type="number"
                               inputMode="numeric"
                               min="0"
                               value={loserPoints[player.id] || ''}
                               onChange={(e) => handleLoserPointChange(player.id, e.target.value)}
                               placeholder="0"
                               className="w-full bg-red-50 border-2 border-transparent focus:border-red-300 text-red-600 text-xl font-bold rounded-2xl pl-8 pr-4 py-3 outline-none transition-all placeholder-red-200"
                             />
                          </div>
                          {/* Quick Add Pills */}
                          <div className="flex flex-col gap-1">
                             <button type="button" onClick={() => handleQuickAddWinnerMode(player.id, 1)} className="px-2 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-200">+1</button>
                             <button type="button" onClick={() => handleQuickAddWinnerMode(player.id, 5)} className="px-2 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-200">+5</button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Summary Preview / Submit Button */}
                    <button 
                      type="submit"
                      form="round-form"
                      className="w-full mt-8 p-6 rounded-3xl bg-sky-500 hover:bg-sky-400 text-white flex flex-col items-center justify-center shadow-lg shadow-sky-500/40 transform transition-all active:scale-[0.98]"
                    >
                       <span className="text-sm font-black uppercase tracking-widest opacity-90 flex items-center gap-2">
                         <Check className="w-5 h-5 stroke-[3]" />
                         {initialScores ? 'Cập Nhật Điểm' : 'Lưu Điểm'}
                       </span>
                       <span className="text-5xl font-black mt-2">MVP +{calculateWinnerTotal()}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* --- FREE MODE UI (Legacy & Editing) --- */}
            {mode === 'FREE' && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <p className="text-sm text-slate-400 text-center font-bold bg-slate-100 py-2 rounded-xl">Nhập +/- tùy ý cho từng người</p>
                {participatingPlayers.map((player) => (
                  <div key={player.id} className="flex items-center gap-2 sm:gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="w-1/4 sm:w-1/3 font-bold text-slate-700 truncate">
                      {player.name}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const current = freeInputs[player.id] || '';
                        if (current.startsWith('-')) {
                          handleFreeInputChange(player.id, current.substring(1));
                        } else {
                          handleFreeInputChange(player.id, current === '' ? '-' : '-' + current);
                        }
                      }}
                      className={`w-10 h-10 sm:w-11 sm:h-11 shrink-0 flex items-center justify-center rounded-xl border-2 font-black text-xl transition-all ${
                        (freeInputs[player.id] || '').startsWith('-')
                          ? 'bg-red-50 border-red-400 text-red-500 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      -
                    </button>
                    <input
                      id={`score-${player.id}`}
                      type="number"
                      inputMode="decimal"
                      value={freeInputs[player.id] || ''}
                      onChange={(e) => handleFreeInputChange(player.id, e.target.value)}
                      placeholder="0"
                      className="flex-1 w-full min-w-0 bg-white border-2 border-slate-200 text-slate-800 text-xl font-bold rounded-xl px-3 py-2 sm:px-4 focus:border-sky-400 outline-none transition-all"
                    />
                  </div>
                ))}
              </div>
            )}
          </form>
        </div>

        {/* Footer Actions */}
        {(mode === 'FREE' || !selectedWinnerId) && (
          <div className="p-5 border-t border-slate-100 bg-white">
            {/* Warning for unbalanced scores in Free Mode */}
            {mode === 'FREE' && currentFreeTotal !== 0 && (
               <div className="flex items-center justify-center gap-2 mb-4 p-3 bg-orange-50 text-orange-600 rounded-2xl text-sm font-bold border border-orange-100 animate-in fade-in slide-in-from-bottom-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Tổng điểm: {currentFreeTotal > 0 ? '+' : ''}{currentFreeTotal} (Chưa bằng 0)</span>
               </div>
            )}

            <button
              type="submit"
              form="round-form"
              disabled={mode === 'WINNER' && !selectedWinnerId}
              className={`w-full flex items-center justify-center gap-2 font-black text-xl py-5 px-6 rounded-3xl transition-all active:scale-[0.98] shadow-xl ${
                (mode === 'WINNER' && !selectedWinnerId)
                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/30'
              }`}
            >
              <Check className="w-7 h-7 stroke-[4]" />
              {initialScores ? 'Cập Nhật Điểm' : 'Lưu Điểm'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};