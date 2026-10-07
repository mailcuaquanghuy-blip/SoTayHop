import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Crown, ArrowRightLeft, AlertTriangle, RotateCcw } from 'lucide-react';
import { Player, RoundScores } from '../types';

interface RoundInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  onSubmit: (scores: RoundScores) => void;
  initialScores?: RoundScores | null; // For editing
  participatingPlayerIds: string[];
  onToggleParticipation?: (playerId: string) => void;
}

type InputMode = 'WINNER' | 'FREE';

export const RoundInputModal: React.FC<RoundInputModalProps> = ({ 
  isOpen, 
  onClose, 
  players, 
  onSubmit, 
  initialScores,
  participatingPlayerIds,
}) => {
  const [mode, setMode] = useState<InputMode>('WINNER');
  
  // State for Winner Mode
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null);
  const [loserPoints, setLoserPoints] = useState<{[key: string]: string}>({}); // Stores positive numbers typed by user
  const [addAllAmount, setAddAllAmount] = useState<string>('');

  // State for Free Mode
  const [freeInputs, setFreeInputs] = useState<{[key: string]: string}>({});

  const firstInputRef = useRef<HTMLInputElement>(null);

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

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Focus effect when winner is selected in Winner Mode
  useEffect(() => {
    if (mode === 'WINNER' && selectedWinnerId) {
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 200);
    }
  }, [selectedWinnerId, mode]);

  // Smooth scroll input into view on mobile focus
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const el = e.target;
    setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
  };

  // --- Handlers for Winner Mode ---

  const handleLoserPointChange = (playerId: string, value: string) => {
    const valStr = String(value);
    if (parseInt(valStr, 10) < 0) return; 
    setLoserPoints(prev => ({ ...prev, [playerId]: valStr }));
  };

  const handleQuickAddWinnerMode = (playerId: string, amount: number) => {
    const currentVal = parseInt(loserPoints[playerId] || '0', 10);
    const safeVal = isNaN(currentVal) ? 0 : currentVal;
    const newVal = Math.max(0, safeVal + amount);
    handleLoserPointChange(playerId, String(newVal));
  };

  const handleAddAllAmount = (amount: number) => {
    if (amount <= 0) return;
    const newLoserPoints = { ...loserPoints };
    participatingPlayers.forEach(p => {
      if (p.id !== selectedWinnerId) {
        const currentVal = parseInt(newLoserPoints[p.id] || '0', 10);
        const safeVal = isNaN(currentVal) ? 0 : currentVal;
        newLoserPoints[p.id] = String(safeVal + amount);
      }
    });
    setLoserPoints(newLoserPoints);
  };

  const handleAddAll = () => {
    const amount = parseInt(addAllAmount, 10);
    if (isNaN(amount) || amount <= 0) return;
    handleAddAllAmount(amount);
    setAddAllAmount('');
  };

  const handleResetAll = () => {
    const newLoserPoints = { ...loserPoints };
    participatingPlayers.forEach(p => {
      if (p.id !== selectedWinnerId) {
        newLoserPoints[p.id] = '0';
      }
    });
    setLoserPoints(newLoserPoints);
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

  const handleQuickAddFree = (playerId: string, amount: number) => {
    const current = parseInt(freeInputs[playerId] || '0', 10);
    const safe = isNaN(current) ? 0 : current;
    setFreeInputs(prev => ({ ...prev, [playerId]: String(safe + amount) }));
  };

  const calculateFreeTotal = () => {
    let total = 0;
    Object.values(freeInputs).forEach(val => {
      const num = parseInt(val as string, 10);
      if (!isNaN(num)) total += num;
    });
    return total;
  };

  const participatingPlayers = players.filter(p => participatingPlayerIds.includes(p.id));
  const currentWinner = participatingPlayers.find(p => p.id === selectedWinnerId);

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
  const winnerTotal = calculateWinnerTotal();

  return (
    <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center bg-slate-900/60 backdrop-blur-md overflow-hidden">
      {/* Backdrop for desktop */}
      <div 
        className="hidden sm:block absolute inset-0 bg-transparent" 
        onClick={onClose}
      />
      
      {/* Main Container: Full screen on mobile, styled dialog on desktop */}
      <div className="relative w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-lg bg-white sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden">
        
        {/* ================= HEADER BAR (ALWAYS PINNED AT TOP) ================= */}
        <div className="bg-sky-50 border-b border-sky-100 shrink-0 z-10 shadow-xs">
          
          {/* Header State 1: Picking MVP (Winner Mode without selected winner) */}
          {mode === 'WINNER' && !selectedWinnerId && (
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📝</span>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-800 leading-tight">
                    {initialScores ? 'Sửa Điểm Phiên' : 'Ghi Chú Điểm'}
                  </h2>
                  <p className="text-[11px] font-bold text-sky-600">Chọn người thắng phiên này</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMode('FREE')}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-600 border border-slate-200 shadow-xs hover:bg-slate-50"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 inline mr-1" />
                  Tự Do
                </button>
                <button 
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5 stroke-[3]" />
                </button>
              </div>
            </div>
          )}

          {/* Header State 2: Winner is selected (Winner Mode) */}
          {mode === 'WINNER' && selectedWinnerId && (
            <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <button 
                  type="button"
                  onClick={() => setSelectedWinnerId(null)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-sky-200 rounded-xl text-xs font-bold text-sky-700 shadow-xs active:bg-sky-50 shrink-0"
                  title="Bấm để chọn người khác"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                  <span className="truncate max-w-[85px] sm:max-w-[120px]">{currentWinner?.name}</span>
                  <span className="text-slate-400 font-semibold text-[10px]">Đổi</span>
                </button>
                
                <span className="text-sm font-black text-sky-600 bg-sky-100/70 px-2 py-0.5 rounded-lg shrink-0">
                  +{winnerTotal}
                </span>
              </div>

              {/* SAVE BUTTON RIGHT IN TOP BAR - NEVER HIDDEN BY KEYBOARD! */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="submit"
                  form="round-form"
                  className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-sky-500/25 flex items-center gap-1.5 transition-transform active:scale-95"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Lưu (+{winnerTotal})</span>
                </button>

                <button 
                  onClick={onClose}
                  className="p-1 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          )}

          {/* Header State 3: FREE Mode */}
          {mode === 'FREE' && (
            <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => setMode('WINNER')}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white text-sky-700 border border-sky-200 shadow-xs shrink-0"
                >
                  <Crown className="w-3.5 h-3.5 inline mr-1 text-sky-500 fill-current" />
                  Người Thắng
                </button>

                <span className={`text-xs font-black px-2 py-0.5 rounded-lg shrink-0 ${
                  currentFreeTotal === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {currentFreeTotal > 0 ? `+${currentFreeTotal}` : currentFreeTotal}
                </span>
              </div>

              {/* SAVE BUTTON FOR FREE MODE */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="submit"
                  form="round-form"
                  className="px-3.5 py-1.5 bg-slate-900 active:bg-slate-800 text-white font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{initialScores ? 'Cập Nhật' : 'Lưu Điểm'}</span>
                </button>

                <button 
                  onClick={onClose}
                  className="p-1 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ================= SCROLLABLE FORM BODY ================= */}
        {/* pb-80 provides huge scroll buffer so any input can be scrolled above the mobile keyboard */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-5 space-y-3.5 pb-72 sm:pb-6">
          <form id="round-form" onSubmit={handleSubmit} className="space-y-3.5">
            
            {/* --- STEP 1: SELECT WINNER --- */}
            {mode === 'WINNER' && !selectedWinnerId && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <div className="text-center py-2">
                  <div className="w-12 h-12 bg-sky-100 text-sky-500 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-xs">
                    <Crown className="w-6 h-6 fill-current" />
                  </div>
                  <h3 className="font-black text-slate-800 text-base">Ai là MVP phiên này?</h3>
                  <p className="text-xs text-slate-400 font-bold mt-0.5">Chạm vào tên người thắng để bắt đầu ghi điểm</p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {participatingPlayers.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedWinnerId(p.id)}
                      className="p-4 rounded-2xl border-2 transition-all flex items-center justify-between bg-white border-slate-200 hover:border-sky-400 hover:bg-sky-50 active:scale-95 shadow-xs"
                    >
                      <span className="font-bold text-slate-800 truncate text-sm sm:text-base">{p.name}</span>
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* --- STEP 2: INPUT LOSER SCORES --- */}
            {mode === 'WINNER' && selectedWinnerId && (
              <div className="space-y-3 animate-in fade-in duration-150">
                
                {/* Cộng cho tất cả (One-tap quick add buttons) */}
                <div className="bg-slate-100/90 p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider">
                      Cộng cho tất cả người thua
                    </span>
                    <button
                      type="button"
                      onClick={handleResetAll}
                      className="text-[10px] font-bold text-slate-500 hover:text-red-500 transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Xóa hết
                    </button>
                  </div>

                  {/* Preset quick buttons - NO KEYBOARD NEEDED! */}
                  <div className="grid grid-cols-4 gap-1.5 mb-2">
                    {[1, 5, 10, 20].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleAddAllAmount(amt)}
                        className="py-1.5 bg-white hover:bg-slate-50 active:bg-sky-50 active:border-sky-300 text-slate-800 font-black text-xs rounded-xl border border-slate-200 shadow-2xs transition-all active:scale-95"
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>

                  {/* Custom amount input */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min="0"
                      value={addAllAmount}
                      onChange={(e) => setAddAllAmount(e.target.value)}
                      onFocus={handleInputFocus}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAll();
                        }
                      }}
                      placeholder="Số khác..."
                      className="flex-1 min-w-0 bg-white text-slate-800 text-sm font-bold px-3 py-1.5 rounded-xl border border-slate-200 outline-none focus:border-sky-400 placeholder-slate-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddAll}
                      disabled={!addAllAmount}
                      className="bg-slate-800 disabled:bg-slate-300 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap shadow-xs"
                    >
                      Cộng
                    </button>
                  </div>
                </div>

                {/* List of Losers */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    Điểm từng người bị trừ:
                  </div>

                  {participatingPlayers.filter(p => p.id !== selectedWinnerId).map((player, idx) => (
                    <div 
                      key={player.id} 
                      className="flex items-center gap-2 bg-slate-50/90 p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs"
                    >
                      {/* Player Name */}
                      <div className="w-20 sm:w-24 font-bold text-slate-800 truncate text-xs sm:text-sm shrink-0">
                        {player.name}
                      </div>

                      {/* Score Input with minus sign */}
                      <div className="flex-1 relative min-w-0">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-red-500 font-black text-sm">-</span>
                        <input
                          ref={idx === 0 ? firstInputRef : null}
                          id={`loss-${player.id}`}
                          type="number"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          min="0"
                          value={loserPoints[player.id] || ''}
                          onChange={(e) => handleLoserPointChange(player.id, e.target.value)}
                          onFocus={handleInputFocus}
                          placeholder="0"
                          className="w-full bg-white border border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 text-red-600 text-base font-black rounded-xl pl-6 pr-2 py-1.5 outline-none transition-all placeholder-red-200"
                        />
                      </div>

                      {/* Quick Stepper Buttons (+1, +5, +10) */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          type="button" 
                          onClick={() => handleQuickAddWinnerMode(player.id, 1)} 
                          className="px-2 py-1.5 bg-white active:bg-slate-100 text-slate-700 rounded-xl text-xs font-black border border-slate-200 shadow-2xs active:scale-95"
                        >
                          +1
                        </button>
                        <button 
                          type="button" 
                          onClick={() => handleQuickAddWinnerMode(player.id, 5)} 
                          className="px-2 py-1.5 bg-white active:bg-slate-100 text-slate-700 rounded-xl text-xs font-black border border-slate-200 shadow-2xs active:scale-95"
                        >
                          +5
                        </button>
                        <button 
                          type="button" 
                          onClick={() => handleQuickAddWinnerMode(player.id, 10)} 
                          className="px-2 py-1.5 bg-white active:bg-slate-100 text-slate-700 rounded-xl text-xs font-black border border-slate-200 shadow-2xs active:scale-95"
                        >
                          +10
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Big Bottom Save Button for desktop or when keyboard is closed */}
                <button
                  type="submit"
                  form="round-form"
                  className="w-full py-4 rounded-2xl bg-sky-500 hover:bg-sky-400 active:scale-[0.98] text-white font-black text-base sm:text-lg shadow-lg shadow-sky-500/30 flex items-center justify-between px-5 transition-all mt-4"
                >
                  <span className="flex items-center gap-2">
                    <Check className="w-5 h-5 stroke-[3]" />
                    {initialScores ? 'Cập Nhật Điểm' : 'Lưu Điểm'}
                  </span>
                  <span className="bg-white/20 px-3 py-1 rounded-xl text-lg font-black">
                    MVP +{winnerTotal}
                  </span>
                </button>
              </div>
            )}

            {/* --- FREE MODE UI (Legacy & Editing) --- */}
            {mode === 'FREE' && (
              <div className="space-y-3 animate-in fade-in duration-150">
                {currentFreeTotal !== 0 && (
                  <div className="flex items-center justify-center gap-1.5 p-2 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold border border-amber-200">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Tổng: {currentFreeTotal > 0 ? `+${currentFreeTotal}` : currentFreeTotal} (Chưa bằng 0)</span>
                  </div>
                )}

                <div className="space-y-2">
                  {participatingPlayers.map((player) => (
                    <div 
                      key={player.id} 
                      className="flex items-center gap-2 bg-slate-50/90 p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs"
                    >
                      <label className="w-20 sm:w-24 font-bold text-slate-800 truncate text-xs sm:text-sm shrink-0">
                        {player.name}
                      </label>

                      {/* +/- toggle */}
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
                        className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-xl border-2 font-black text-base transition-all ${
                          (freeInputs[player.id] || '').startsWith('-')
                            ? 'bg-red-50 border-red-400 text-red-500'
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}
                      >
                        -
                      </button>

                      {/* Score input */}
                      <input
                        id={`score-${player.id}`}
                        type="number"
                        inputMode="numeric"
                        value={freeInputs[player.id] || ''}
                        onChange={(e) => handleFreeInputChange(player.id, e.target.value)}
                        onFocus={handleInputFocus}
                        placeholder="0"
                        className="flex-1 min-w-0 bg-white border border-slate-200 text-slate-800 text-base font-bold rounded-xl px-2.5 py-1.5 focus:border-sky-400 outline-none transition-all"
                      />

                      {/* Quick add */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          type="button" 
                          onClick={() => handleQuickAddFree(player.id, 5)} 
                          className="px-2 py-1.5 bg-white text-slate-700 rounded-xl text-xs font-black border border-slate-200 shadow-2xs active:scale-95"
                        >
                          +5
                        </button>
                        <button 
                          type="button" 
                          onClick={() => handleQuickAddFree(player.id, -5)} 
                          className="px-2 py-1.5 bg-white text-slate-700 rounded-xl text-xs font-black border border-slate-200 shadow-2xs active:scale-95"
                        >
                          -5
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Big Bottom Save Button */}
                <button
                  type="submit"
                  form="round-form"
                  className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-black text-base sm:text-lg shadow-lg flex items-center justify-center gap-2 px-5 transition-all mt-4"
                >
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>{initialScores ? 'Cập Nhật Điểm' : 'Lưu Điểm'}</span>
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
