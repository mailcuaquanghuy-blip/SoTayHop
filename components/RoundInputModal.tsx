import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Crown, ArrowRightLeft, AlertTriangle } from 'lucide-react';
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
}) => {
  const [mode, setMode] = useState<InputMode>('WINNER');
  
  // State for Winner Mode
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null);
  const [loserPoints, setLoserPoints] = useState<{[key: string]: string}>({}); // Stores positive numbers typed by user
  const [addAllAmount, setAddAllAmount] = useState<string>('');

  // State for Free Mode
  const [freeInputs, setFreeInputs] = useState<{[key: string]: string}>({});

  // Mobile virtual keyboard viewport tracking
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [viewportTop, setViewportTop] = useState<number>(0);

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

  // Viewport tracking for mobile virtual keyboards (iOS Safari, Android Chrome)
  useEffect(() => {
    if (!isOpen) return;

    const handleViewportChange = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
        setViewportTop(window.visualViewport.offsetTop);
      } else {
        setViewportHeight(window.innerHeight);
        setViewportTop(0);
      }
    };

    handleViewportChange();
    window.visualViewport?.addEventListener('resize', handleViewportChange);
    window.visualViewport?.addEventListener('scroll', handleViewportChange);

    // Prevent body bounce scrolling on mobile while modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
      window.visualViewport?.removeEventListener('scroll', handleViewportChange);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Focus effect when winner is selected in Winner Mode
  useEffect(() => {
    if (mode === 'WINNER' && selectedWinnerId) {
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 150);
    }
  }, [selectedWinnerId, mode]);

  // Auto-scroll input into visible view when mobile keyboard appears
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const el = e.target;
    setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 250);
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
  const winnerTotal = calculateWinnerTotal();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-md"
      style={
        viewportHeight
          ? {
              height: `${viewportHeight}px`,
              top: `${viewportTop}px`,
              bottom: 'auto',
            }
          : undefined
      }
    >
      <div 
        className="absolute inset-0 bg-transparent" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg bg-white rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col h-full sm:h-auto max-h-full sm:max-h-[90vh] overflow-hidden">
        
        {/* Header with Mode Switcher */}
        <div className="flex flex-col bg-sky-50 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-3.5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
              <span className="text-2xl sm:text-3xl">📝</span>
              {initialScores ? 'Sửa Điểm Phiên' : 'Ghi Chú Điểm'}
            </h2>
            <button 
              onClick={onClose}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
            </button>
          </div>
          
          <div className="flex px-3 pb-2.5 sm:px-4 sm:pb-3 gap-2">
            <button
              onClick={() => setMode('WINNER')}
              className={`flex-1 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                mode === 'WINNER' 
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30' 
                  : 'bg-white text-slate-500 border border-slate-200'
              }`}
            >
              <Crown className="w-4 h-4 fill-current" />
              Người Thắng
            </button>
            <button
              onClick={() => setMode('FREE')}
              className={`flex-1 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                mode === 'FREE' 
                  ? 'bg-slate-800 text-white shadow-md' 
                  : 'bg-white text-slate-500 border border-slate-200'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              Tự Do
            </button>
          </div>
        </div>

        {/* Scrollable Form Area */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4">
          <form id="round-form" onSubmit={handleSubmit} className="space-y-4">
            
            {/* --- WINNER MODE UI --- */}
            {mode === 'WINNER' && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                {/* 1. Winner Selection: full grid if not chosen, compact banner if chosen */}
                {!selectedWinnerId ? (
                  <div>
                    <label className="block text-xs sm:text-sm font-black text-slate-400 mb-2.5 uppercase tracking-wider text-center">
                      Ai là MVP phiên này?
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {participatingPlayers.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedWinnerId(p.id)}
                          className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl border-2 transition-all flex items-center justify-between bg-white border-slate-100 text-slate-700 hover:border-sky-300 hover:bg-sky-50 active:scale-95 shadow-sm"
                        >
                          <span className="font-bold truncate text-sm sm:text-base">{p.name}</span>
                          <div className="w-5 h-5 rounded-full border-2 border-slate-200 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Compact MVP Bar to save vertical space on phone screens */
                  <div className="flex items-center justify-between p-2.5 sm:p-3 bg-sky-50 border border-sky-200 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-sm shrink-0">
                        <Crown className="w-5 h-5 fill-current" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] sm:text-xs font-bold text-sky-600 uppercase tracking-wider">MVP Phiên Này</div>
                        <div className="font-black text-slate-800 text-sm sm:text-base truncate">
                          {currentWinner?.name || 'Người Thắng'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedWinnerId(null)}
                      className="text-xs font-bold text-sky-600 hover:text-sky-800 bg-white px-3 py-1.5 rounded-xl border border-sky-200 shadow-sm transition-colors shrink-0"
                    >
                      Đổi MVP
                    </button>
                  </div>
                )}

                {/* 2. Input Losers */}
                {selectedWinnerId && (
                  <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-wider">
                        Người khác trừ bao nhiêu?
                      </label>
                    </div>
                    
                    {/* Add to all input */}
                    <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 sm:p-2 rounded-2xl border border-slate-200">
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
                        placeholder="Cộng cho tất cả..."
                        className="flex-1 min-w-0 bg-white text-slate-800 text-sm sm:text-base font-bold px-3 py-2 rounded-xl outline-none border border-slate-200 focus:border-sky-400 placeholder-slate-400"
                      />
                      <button
                        type="button"
                        onClick={handleAddAll}
                        disabled={!addAllAmount}
                        className="bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-2 px-3.5 sm:px-4 rounded-xl transition-colors whitespace-nowrap text-xs sm:text-sm shadow-sm"
                      >
                        Cộng
                      </button>
                    </div>
                    
                    {/* List of losers */}
                    <div className="space-y-2.5 pb-2">
                      {participatingPlayers.filter(p => p.id !== selectedWinnerId).map((player, idx) => (
                        <div key={player.id} className="flex items-center gap-2 sm:gap-3 bg-slate-50/80 p-2 sm:p-2.5 rounded-2xl border border-slate-100">
                          <div className="w-24 sm:w-28 font-bold text-slate-700 truncate text-left text-sm sm:text-base shrink-0">
                             {player.name}
                          </div>
                          <div className="flex-1 relative min-w-0">
                             <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-red-500 font-black text-base">-</div>
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
                               className="w-full bg-white border border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 text-red-600 text-base sm:text-lg font-black rounded-xl pl-6 pr-2 py-1.5 sm:py-2 outline-none transition-all placeholder-red-200"
                             />
                          </div>
                          {/* Quick Add Pills */}
                          <div className="flex items-center gap-1 shrink-0">
                             <button 
                               type="button" 
                               onClick={() => handleQuickAddWinnerMode(player.id, 1)} 
                               className="px-2 sm:px-2.5 py-1.5 sm:py-2 bg-white active:bg-slate-100 text-slate-600 rounded-xl text-xs font-black border border-slate-200 shadow-xs"
                             >
                               +1
                             </button>
                             <button 
                               type="button" 
                               onClick={() => handleQuickAddWinnerMode(player.id, 5)} 
                               className="px-2 sm:px-2.5 py-1.5 sm:py-2 bg-white active:bg-slate-100 text-slate-600 rounded-xl text-xs font-black border border-slate-200 shadow-xs"
                             >
                               +5
                             </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --- FREE MODE UI (Legacy & Editing) --- */}
            {mode === 'FREE' && (
              <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                <p className="text-xs text-slate-400 text-center font-bold bg-slate-100 py-1.5 rounded-xl">
                  Nhập +/- tùy ý cho từng người
                </p>
                <div className="space-y-2.5 pb-2">
                  {participatingPlayers.map((player) => (
                    <div key={player.id} className="flex items-center gap-2 bg-slate-50 p-2 sm:p-2.5 rounded-2xl border border-slate-100">
                      <label className="w-24 sm:w-28 font-bold text-slate-700 truncate text-sm sm:text-base shrink-0">
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
                        className={`w-9 h-9 sm:w-10 sm:h-10 shrink-0 flex items-center justify-center rounded-xl border-2 font-black text-lg transition-all ${
                          (freeInputs[player.id] || '').startsWith('-')
                            ? 'bg-red-50 border-red-400 text-red-500 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        -
                      </button>
                      <input
                        id={`score-${player.id}`}
                        type="number"
                        inputMode="numeric"
                        value={freeInputs[player.id] || ''}
                        onChange={(e) => handleFreeInputChange(player.id, e.target.value)}
                        onFocus={handleInputFocus}
                        placeholder="0"
                        className="flex-1 min-w-0 bg-white border border-slate-200 text-slate-800 text-base sm:text-lg font-bold rounded-xl px-3 py-1.5 sm:py-2 focus:border-sky-400 outline-none transition-all"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Docked Footer Actions - Always visible above mobile keyboard */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-white/95 backdrop-blur-sm shrink-0">
          {mode === 'WINNER' ? (
            selectedWinnerId ? (
              <button 
                type="submit"
                form="round-form"
                className="w-full py-3.5 sm:py-4 px-5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-between shadow-lg shadow-sky-500/30 transform transition-all active:scale-[0.98]"
              >
                <span className="text-sm sm:text-base font-black uppercase tracking-wider flex items-center gap-2">
                  <Check className="w-5 h-5 stroke-[3]" />
                  {initialScores ? 'Cập Nhật Điểm' : 'Lưu Điểm'}
                </span>
                <span className="text-base sm:text-xl font-black bg-white/20 px-3 py-1 rounded-xl">
                  MVP +{winnerTotal}
                </span>
              </button>
            ) : (
              <div className="text-center py-2 text-xs sm:text-sm font-bold text-slate-400">
                👆 Hãy chọn người thắng phiên này ở trên
              </div>
            )
          ) : (
            <div className="space-y-2">
              {currentFreeTotal !== 0 && (
                <div className="flex items-center justify-center gap-1.5 p-2 bg-orange-50 text-orange-600 rounded-xl text-xs font-bold border border-orange-100 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Tổng điểm: {currentFreeTotal > 0 ? '+' : ''}{currentFreeTotal} (Chưa bằng 0)</span>
                </div>
              )}
              <button
                type="submit"
                form="round-form"
                className="w-full flex items-center justify-center gap-2 font-black text-sm sm:text-base py-3 sm:py-3.5 px-6 rounded-2xl transition-all active:scale-[0.98] shadow-md bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20"
              >
                <Check className="w-5 h-5 stroke-[3]" />
                {initialScores ? 'Cập Nhật Điểm' : 'Lưu Điểm'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
