import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Calculator, Crown, Users, ArrowRightLeft, AlertTriangle, Sparkles, Mic } from 'lucide-react';
import { Player, RoundScores } from '../types';
import { parseScoresFromText } from '../services/geminiService';

interface RoundInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  onSubmit: (scores: RoundScores) => void;
  initialScores?: RoundScores | null; // For editing
  participatingPlayerIds: string[];
  onToggleParticipation: (playerId: string) => void;
}

type InputMode = 'WINNER' | 'FREE' | 'AI';

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

  // State for Free Mode
  const [freeInputs, setFreeInputs] = useState<{[key: string]: string}>({});

  // State for AI Mode
  const [aiInputText, setAiInputText] = useState('');
  const [isParsingAI, setIsParsingAI] = useState(false);
  const [aiParsedScores, setAiParsedScores] = useState<RoundScores | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const firstInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize SpeechRecognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'vi-VN';
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setAiInputText(prev => prev ? prev + ' ' + transcript : transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setAiError(null);
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error("Error starting recognition", e);
        setIsListening(false);
      }
    }
  };

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
          setAiInputText('');
          setAiParsedScores(null);
          setAiError(null);
      } else {
          // NEW ROUND MODE
          setSelectedWinnerId(null);
          setLoserPoints({});
          const initialFree: {[key: string]: string} = {};
          players.forEach(p => initialFree[p.id] = '');
          setFreeInputs(initialFree);
          setMode('WINNER');
          setAiInputText('');
          setAiParsedScores(null);
          setAiError(null);
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

  // --- Handlers for AI Mode ---
  const handleParseAI = async () => {
    if (!aiInputText.trim()) return;
    setIsParsingAI(true);
    setAiError(null);
    setAiParsedScores(null);
    
    const parsed = await parseScoresFromText(aiInputText, players);
    setIsParsingAI(false);
    
    if (parsed && Object.keys(parsed).length > 0) {
      setAiParsedScores(parsed);
    } else {
      setAiError("Không thể phân tích điểm. Vui lòng thử lại với câu rõ ràng hơn.");
    }
  };

  const calculateAITotal = () => {
    if (!aiParsedScores) return 0;
    return Object.values(aiParsedScores).reduce((sum, score) => sum + score, 0);
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
    } else if (mode === 'AI') {
      if (!aiParsedScores) return;
      // Merge parsed scores with 0 for others
      players.forEach(p => {
        finalScores[p.id] = aiParsedScores[p.id] || 0;
      });
    }

    onSubmit(finalScores);
    onClose();
  };

  if (!isOpen) return null;

  const currentFreeTotal = calculateFreeTotal();
  const currentAITotal = calculateAITotal();

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
            <button
              onClick={() => setMode('AI')}
              className={`flex-1 min-w-[100px] py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${mode === 'AI' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30' : 'bg-white text-slate-400 border-2 border-slate-100'}`}
            >
              <Sparkles className="w-5 h-5" />
              AI
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

                    {/* Summary Preview */}
                    <div className="mt-8 p-6 rounded-3xl bg-sky-400 text-white flex flex-col items-center justify-center shadow-lg shadow-sky-400/30 transform rotate-1">
                       <span className="text-xs font-black uppercase tracking-widest opacity-80">MVP Nhận Được</span>
                       <span className="text-5xl font-black mt-1">+{calculateWinnerTotal()}</span>
                    </div>
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

            {/* --- AI MODE UI --- */}
            {mode === 'AI' && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <p className="text-sm text-slate-400 text-center font-bold bg-purple-50 py-2 rounded-xl text-purple-600">
                  Nhập hoặc đọc điểm, AI sẽ tự tính toán!
                </p>
                <div className="relative">
                  <textarea
                    value={aiInputText}
                    onChange={(e) => setAiInputText(e.target.value)}
                    placeholder="VD: Huy nhất, Nam 1 Khánh 1..."
                    className="w-full h-32 bg-white border-2 border-purple-100 text-slate-800 text-lg rounded-2xl p-4 focus:border-purple-400 outline-none transition-all resize-none"
                  />
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    {recognitionRef.current && (
                      <button
                        type="button"
                        onClick={toggleListening}
                        className={`p-2 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center ${
                          isListening ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : 'bg-white border-2 border-purple-100 text-purple-500 hover:bg-purple-50'
                        }`}
                        title={isListening ? "Đang nghe..." : "Nhập bằng giọng nói"}
                      >
                        <Mic className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleParseAI}
                      disabled={isParsingAI || !aiInputText.trim()}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {isParsingAI ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      Phân Tích
                    </button>
                  </div>
                </div>

                {aiError && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">
                    {aiError}
                  </div>
                )}

                {aiParsedScores && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-3">Kết quả phân tích:</h3>
                    <div className="space-y-2">
                      {participatingPlayers.map(p => {
                        const score = aiParsedScores[p.id] || 0;
                        if (score === 0) return null;
                        return (
                          <div key={p.id} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm">
                            <span className="font-bold text-slate-700">{p.name}</span>
                            <span className={`font-black text-lg ${score > 0 ? 'text-sky-500' : 'text-red-500'}`}>
                              {score > 0 ? '+' : ''}{score}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-100 bg-white">
          {/* Warning for unbalanced scores in Free Mode */}
          {mode === 'FREE' && currentFreeTotal !== 0 && (
             <div className="flex items-center justify-center gap-2 mb-4 p-3 bg-orange-50 text-orange-600 rounded-2xl text-sm font-bold border border-orange-100 animate-in fade-in slide-in-from-bottom-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Tổng điểm: {currentFreeTotal > 0 ? '+' : ''}{currentFreeTotal} (Chưa bằng 0)</span>
             </div>
          )}
          {/* Warning for unbalanced scores in AI Mode */}
          {mode === 'AI' && aiParsedScores && currentAITotal !== 0 && (
             <div className="flex items-center justify-center gap-2 mb-4 p-3 bg-orange-50 text-orange-600 rounded-2xl text-sm font-bold border border-orange-100 animate-in fade-in slide-in-from-bottom-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Tổng điểm: {currentAITotal > 0 ? '+' : ''}{currentAITotal} (Chưa bằng 0)</span>
             </div>
          )}

          <button
            type="submit"
            form="round-form"
            disabled={(mode === 'WINNER' && !selectedWinnerId) || (mode === 'AI' && !aiParsedScores)}
            className={`w-full flex items-center justify-center gap-2 font-black text-xl py-5 px-6 rounded-3xl transition-all active:scale-[0.98] shadow-xl ${
              ((mode === 'WINNER' && !selectedWinnerId) || (mode === 'AI' && !aiParsedScores))
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/30'
            }`}
          >
            <Check className="w-7 h-7 stroke-[4]" />
            {mode === 'AI' && aiParsedScores ? 'Áp Dụng Điểm' : (initialScores ? 'Cập Nhật Điểm' : 'Lưu Điểm')}
          </button>
        </div>
      </div>
    </div>
  );
};