import React, { useState, useEffect, useRef } from 'react';
import { Plus, RotateCcw, History, Sparkles, LogOut, UserPlus, Briefcase, Volume2, VolumeX, MessageSquare, MessageSquareOff } from 'lucide-react';
import { Player, GameState, RoundScores } from './types';
import { GameSetup } from './components/GameSetup';
import { PlayerCard } from './components/PlayerCard';
import { RoundInputModal } from './components/RoundInputModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { HomeScreen } from './components/HomeScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { AddPlayerModal } from './components/AddPlayerModal';
import { getGameCommentary, getRoundCommentary, generateSpeech } from './services/geminiService';

// Helper to generate unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

const STORAGE_KEY = 'meeting-score-app-v2';
const HISTORY_KEY = 'meeting-history-v2';
const SETTINGS_KEY = 'meeting-ai-settings';
const PARTICIPATION_KEY = 'meeting-participating-players';

type ViewState = 'HOME' | 'SETUP' | 'GAME' | 'HISTORY_VIEW';

// State for editing a round
interface EditingRoundState {
    gameId: string;
    roundIndex: number;
    initialScores: RoundScores;
}

interface AISettings {
  commentaryEnabled: boolean;
  voiceEnabled: boolean;
}

const App: React.FC = () => {
  // --- State ---
  const [view, setView] = useState<ViewState>('HOME');

  const [activeGame, setActiveGame] = useState<GameState | null>(() => {
    // Load active game from local storage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved game", e);
      }
    }
    return null;
  });

  const [history, setHistory] = useState<GameState[]>(() => {
    // Load history
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
    return [];
  });

  const [aiSettings, setAiSettings] = useState<AISettings>(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    return { commentaryEnabled: true, voiceEnabled: false };
  });

  const [participatingPlayerIds, setParticipatingPlayerIds] = useState<string[]>(() => {
    const saved = localStorage.getItem(PARTICIPATION_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse participation", e);
      }
    }
    return [];
  });

  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false); // In-game history drawer
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);
  const [aiCommentary, setAiCommentary] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Editing state
  const [editingRound, setEditingRound] = useState<EditingRoundState | null>(null);

  // --- Effects ---
  useEffect(() => {
    if (activeGame) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activeGame));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [activeGame]);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(aiSettings));
  }, [aiSettings]);

  useEffect(() => {
    if (participatingPlayerIds.length > 0) {
      localStorage.setItem(PARTICIPATION_KEY, JSON.stringify(participatingPlayerIds));
    }
  }, [participatingPlayerIds]);

  // Ensure participating IDs are valid when activeGame changes
  useEffect(() => {
    if (activeGame && participatingPlayerIds.length === 0) {
      setParticipatingPlayerIds(activeGame.players.map(p => p.id));
    } else if (activeGame) {
      // Filter out IDs that no longer exist in the active game
      const validIds = participatingPlayerIds.filter(id => activeGame.players.some(p => p.id === id));
      if (validIds.length !== participatingPlayerIds.length) {
        setParticipatingPlayerIds(validIds.length > 0 ? validIds : activeGame.players.map(p => p.id));
      }
    }
  }, [activeGame]);

  // --- Actions ---

  const handleStartGame = (names: string[]) => {
    const newPlayers: Player[] = names.map(name => ({
      id: generateId(),
      name: name,
      totalScore: 0,
      history: []
    }));
    
    // Random meeting names
    const funNames = ["Họp Giao Ban", "Daily Standup", "Chém Gió Hội", "Brainstorm Căng Não", "Tổng Kết Tuần", "Họp Chiến Lược", "Trà Chiều & Deadline"];
    const randomName = funNames[Math.floor(Math.random() * funNames.length)];

    const newGame: GameState = {
      id: generateId(),
      players: newPlayers,
      rounds: 0,
      gameName: randomName,
      isActive: true,
      date: new Date().toISOString()
    };
    
    setActiveGame(newGame);
    setAiCommentary(null);
    setView('GAME');
  };

  const handleFinishGame = () => {
    if (window.confirm('Tan họp rồi hả? Lưu biên bản nhé?')) {
      if (activeGame) {
        const finishedGame = { ...activeGame, isActive: false, date: new Date().toISOString() };
        setHistory(prev => [finishedGame, ...prev]);
        setActiveGame(null);
        setAiCommentary(null);
        setView('HOME');
      }
    }
  };

  const handleRestoreGame = (game: GameState) => {
    if (activeGame) {
      if (!window.confirm("Đang có cuộc họp dở dang. Bạn có muốn lưu lại và chuyển sang cuộc họp cũ không?")) {
        return;
      }
      const savedCurrent = { ...activeGame, isActive: false, date: new Date().toISOString() };
      setHistory(prev => [savedCurrent, ...prev.filter(g => g.id !== game.id)]);
    } else {
      setHistory(prev => prev.filter(g => g.id !== game.id));
    }

    setActiveGame({
      ...game,
      isActive: true,
      date: new Date().toISOString()
    });
    setAiCommentary(null);
    setView('GAME');
  };

  const handleAddPlayer = (name: string) => {
    if (!activeGame) return;
    
    setActiveGame(prev => {
        if (!prev) return null;
        
        const newPlayer: Player = {
            id: generateId(),
            name: name,
            totalScore: 0,
            history: new Array(prev.rounds).fill(0) // Fill past rounds with 0
        };

        return {
            ...prev,
            players: [...prev.players, newPlayer]
        };
    });
  };

  const playAudio = async (base64Audio: string) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn("Web Audio API not supported");
        return;
      }
      const audioContext = new AudioContextClass();
      
      // Decode base64 to binary string
      const binaryString = window.atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Convert 16-bit PCM to Float32
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      // Create AudioBuffer (1 channel, 24000Hz)
      const audioBuffer = audioContext.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      // Play the buffer
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
    } catch (e) {
      console.error("Error playing audio:", e);
    }
  };

  // Generic helper to update a specific game's rounds
  const updateGameRound = (game: GameState, roundIndex: number, newScores: RoundScores): GameState => {
      const updatedPlayers = game.players.map(player => {
          const newHistory = [...player.history];
          // Update the specific round
          newHistory[roundIndex] = newScores[player.id] || 0;
          // Recalculate total score
          const newTotal = newHistory.reduce((sum, score) => sum + score, 0);
          
          return {
              ...player,
              history: newHistory,
              totalScore: newTotal
          };
      });
      return { ...game, players: updatedPlayers };
  };

  const handleSaveRound = async (scores: RoundScores) => {
      // Scenario 1: Editing an existing round
      if (editingRound) {
          const { gameId, roundIndex } = editingRound;
          
          if (activeGame && activeGame.id === gameId) {
              // Update Active Game
              setActiveGame(prev => prev ? updateGameRound(prev, roundIndex, scores) : null);
          } else {
              // Update History
              setHistory(prev => prev.map(g => {
                  if (g.id === gameId) {
                      return updateGameRound(g, roundIndex, scores);
                  }
                  return g;
              }));
          }
          setEditingRound(null);
          setIsInputModalOpen(false);
          return;
      }

      // Scenario 2: Adding a new round to active game
      if (!activeGame) return;

      setActiveGame(prev => {
        if (!prev) return null;
        const updatedPlayers = prev.players.map(player => {
          const score = scores[player.id] || 0;
          return {
            ...player,
            history: [...player.history, score],
            totalScore: player.totalScore + score
          };
        });

        return {
          ...prev,
          players: updatedPlayers,
          rounds: prev.rounds + 1
        };
      });
      setIsInputModalOpen(false);

      // Generate AI Commentary for the round
      if (aiSettings.commentaryEnabled) {
        setIsLoadingAI(true);
        const commentary = await getRoundCommentary(activeGame.players, scores);
        setAiCommentary(commentary);
        setIsLoadingAI(false);

        if (aiSettings.voiceEnabled && commentary) {
          const audioData = await generateSpeech(commentary);
          if (audioData) {
            playAudio(audioData);
          }
        }
      }
  };

  const initiateEditRound = (gameId: string, roundIndex: number, currentScores: RoundScores) => {
      setEditingRound({
          gameId,
          roundIndex,
          initialScores: currentScores
      });
      setIsInputModalOpen(true);
      // We don't necessarily close history drawer, so users can see the update instantly behind modal if visible
  };

  const deleteLastRound = () => {
      if (!activeGame || activeGame.rounds === 0) return;
      
      setActiveGame(prev => {
          if (!prev) return null;
          const updatedPlayers = prev.players.map(player => {
              const newHistory = [...player.history];
              const removedScore = newHistory.pop() || 0;
              return {
                  ...player,
                  history: newHistory,
                  totalScore: player.totalScore - removedScore
              };
          });
          return {
              ...prev,
              players: updatedPlayers,
              rounds: prev.rounds - 1
          };
      });
      setIsHistoryDrawerOpen(false);
  };

  const handleAIAnalysis = async () => {
    if (!activeGame) return;
    setIsLoadingAI(true);
    const commentary = await getGameCommentary(activeGame.players);
    setAiCommentary(commentary);
    setIsLoadingAI(false);

    if (aiSettings.voiceEnabled && commentary) {
      const audioData = await generateSpeech(commentary);
      if (audioData) {
        playAudio(audioData);
      }
    }
  };

  const clearAllHistory = () => {
    setHistory([]);
    setView('HOME');
  };

  const toggleCommentary = () => {
    setAiSettings(prev => ({ ...prev, commentaryEnabled: !prev.commentaryEnabled }));
  };

  const toggleVoice = () => {
    setAiSettings(prev => ({ ...prev, voiceEnabled: !prev.voiceEnabled }));
  };

  const toggleParticipation = (playerId: string) => {
    setParticipatingPlayerIds(prev => {
      if (prev.includes(playerId)) {
        if (prev.length <= 1) return prev; // Keep at least one player
        return prev.filter(id => id !== playerId);
      }
      return [...prev, playerId];
    });
  };

  // Determine players to pass to modal (active game or from history if editing)
  let playersForModal: Player[] = [];
  if (editingRound) {
      if (activeGame && activeGame.id === editingRound.gameId) {
          playersForModal = activeGame.players;
      } else {
          const histGame = history.find(g => g.id === editingRound.gameId);
          if (histGame) playersForModal = histGame.players;
      }
  } else if (activeGame) {
      playersForModal = activeGame.players;
  }

  // --- Render Logic ---

  if (view === 'HOME') {
    return (
      <HomeScreen 
        activeGame={activeGame}
        onNewGame={() => setView('SETUP')}
        onContinue={() => setView('GAME')}
        onViewHistory={() => setView('HISTORY_VIEW')}
      />
    );
  }

  if (view === 'HISTORY_VIEW') {
    return (
      <>
        <HistoryScreen 
            history={history}
            onBack={() => setView('HOME')}
            onClearHistory={clearAllHistory}
            onRestore={handleRestoreGame}
            onEditRound={initiateEditRound}
        />
        {/* Modal for editing history rounds */}
        <RoundInputModal 
            isOpen={isInputModalOpen} 
            onClose={() => {
                setIsInputModalOpen(false);
                setEditingRound(null);
            }} 
            players={playersForModal}
            onSubmit={handleSaveRound}
            initialScores={editingRound?.initialScores}
            participatingPlayerIds={participatingPlayerIds}
            onToggleParticipation={toggleParticipation}
        />
      </>
    );
  }

  if (view === 'SETUP') {
    return (
      <GameSetup 
        onStartGame={handleStartGame} 
        onBack={() => setView('HOME')}
      />
    );
  }

  // GAME VIEW
  if (!activeGame) {
      setView('HOME');
      return null;
  }

  // Sort players for display
  const sortedByScore = [...activeGame.players].sort((a, b) => b.totalScore - a.totalScore);
  const maxScore = sortedByScore[0]?.totalScore;
  const minScore = sortedByScore[sortedByScore.length - 1]?.totalScore;

  return (
    <div className="min-h-screen bg-sky-50 text-slate-800 pb-32">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex flex-col">
            <h1 className="font-black text-lg text-slate-800 leading-tight flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-sky-500" />
                {activeGame.gameName}
            </h1>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-7">Phiên {activeGame.rounds}</span>
        </div>
        
        <div className="flex gap-2">
           {/* AI Settings Toggles */}
           <div className="flex bg-slate-100 rounded-2xl p-1 mr-1">
             <button
               onClick={toggleCommentary}
               className={`p-1.5 rounded-xl transition-colors ${aiSettings.commentaryEnabled ? 'bg-white text-sky-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               title={aiSettings.commentaryEnabled ? "Tắt bình luận AI" : "Bật bình luận AI"}
             >
               {aiSettings.commentaryEnabled ? <MessageSquare className="w-4 h-4" /> : <MessageSquareOff className="w-4 h-4" />}
             </button>
             <button
               onClick={toggleVoice}
               disabled={!aiSettings.commentaryEnabled}
               className={`p-1.5 rounded-xl transition-colors ${!aiSettings.commentaryEnabled ? 'opacity-50 cursor-not-allowed' : aiSettings.voiceEnabled ? 'bg-white text-sky-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               title={aiSettings.voiceEnabled ? "Tắt giọng nói AI" : "Bật giọng nói AI"}
             >
               {aiSettings.voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
             </button>
           </div>

           <button 
             onClick={handleAIAnalysis}
             disabled={isLoadingAI}
             className="p-2.5 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 transition-all active:scale-95"
             title="AI Tóm Tắt"
           >
              {isLoadingAI ? (
                  <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              ) : (
                  <Sparkles className="w-5 h-5 fill-current" />
              )}
           </button>
           
           <button 
             onClick={() => setIsAddPlayerModalOpen(true)}
             className="p-2.5 rounded-2xl bg-white text-slate-500 border border-slate-200 hover:bg-sky-50 hover:text-sky-600 transition-colors"
             title="Thêm thành viên"
           >
             <UserPlus className="w-5 h-5" />
           </button>

           <button 
             onClick={() => setIsHistoryDrawerOpen(true)}
             className="p-2.5 rounded-2xl bg-white text-slate-500 border border-slate-200 hover:bg-sky-50 hover:text-sky-600 transition-colors"
             title="Lịch sử phiên"
           >
             <History className="w-5 h-5" />
           </button>
           
           <div className="w-px h-8 bg-slate-200 mx-1"></div>

           <button 
             onClick={handleFinishGame}
             className="p-2.5 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
             title="Tan họp"
           >
             <LogOut className="w-5 h-5" />
           </button>
        </div>
      </header>

      {/* AI Commentary Section */}
      {aiCommentary && (
        <div className="mx-4 mt-4 p-4 rounded-3xl bg-sky-600 text-white shadow-xl shadow-sky-500/20 relative animate-in fade-in slide-in-from-top-4 duration-500">
           <div className="absolute -top-3 left-4 bg-white text-sky-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm border border-sky-100">
             <Sparkles className="w-3 h-3" /> AI Thư Ký
           </div>
           <button onClick={() => setAiCommentary(null)} className="absolute top-3 right-3 text-sky-200 hover:text-white bg-sky-700/50 rounded-full p-1">
             <span className="sr-only">Đóng</span>
             <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
           </button>
           <p className="text-sm font-medium leading-relaxed pt-2">"{aiCommentary}"</p>
        </div>
      )}

      {/* Main Grid */}
      <main className="p-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {activeGame.players.map((player) => {
          // Calculate rank
          const rank = sortedByScore.findIndex(p => p.id === player.id) + 1;
          const isWinner = player.totalScore === maxScore && activeGame.rounds > 0;
          const isLoser = player.totalScore === minScore && activeGame.rounds > 0 && activeGame.players.length > 1;

          return (
            <PlayerCard 
              key={player.id} 
              player={player} 
              rank={rank} 
              isWinner={isWinner} 
              isLoser={isLoser}
              isParticipating={participatingPlayerIds.includes(player.id)}
              onToggleParticipation={() => toggleParticipation(player.id)}
            />
          );
        })}
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 w-full max-w-xs px-4 pointer-events-none">
        <button
          onClick={() => {
              setEditingRound(null);
              setIsInputModalOpen(true);
          }}
          className="pointer-events-auto w-full bg-slate-800 text-white shadow-xl shadow-slate-800/30 rounded-[2rem] py-4 flex items-center justify-center gap-3 transition-all transform active:scale-95 font-black text-lg hover:-translate-y-1"
        >
          <div className="bg-white/20 p-1 rounded-full">
             <Plus className="w-5 h-5 stroke-[4]" />
          </div>
          Ghi Điểm
        </button>
      </div>

      {/* Modals */}
      <RoundInputModal 
        isOpen={isInputModalOpen} 
        onClose={() => {
            setIsInputModalOpen(false);
            setEditingRound(null);
        }}
        players={playersForModal}
        onSubmit={handleSaveRound}
        initialScores={editingRound?.initialScores}
        participatingPlayerIds={participatingPlayerIds}
        onToggleParticipation={toggleParticipation}
      />

      <HistoryDrawer 
        isOpen={isHistoryDrawerOpen} 
        onClose={() => setIsHistoryDrawerOpen(false)}
        players={activeGame.players}
        rounds={activeGame.rounds}
        onDeleteLastRound={deleteLastRound}
        onEditRound={(roundIndex, scores) => activeGame.id && initiateEditRound(activeGame.id, roundIndex, scores)}
      />

      <AddPlayerModal 
          isOpen={isAddPlayerModalOpen}
          onClose={() => setIsAddPlayerModalOpen(false)}
          onAdd={handleAddPlayer}
      />
    </div>
  );
};

export default App;