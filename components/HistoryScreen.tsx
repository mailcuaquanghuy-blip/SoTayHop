import React, { useState } from 'react';
import { ArrowLeft, Calendar, Trophy, Trash2, ChevronRight, Clock, Eye, PlayCircle } from 'lucide-react';
import { GameState, RoundScores } from '../types';
import { HistoryDrawer } from './HistoryDrawer';

interface HistoryScreenProps {
  history: GameState[];
  onBack: () => void;
  onClearHistory: () => void;
  onRestore: (game: GameState) => void;
  onEditRound: (gameId: string, roundIndex: number, scores: RoundScores) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ history, onBack, onClearHistory, onRestore, onEditRound }) => {
  const [viewingGame, setViewingGame] = useState<GameState | null>(null);

  // Sort history by date descending
  const sortedHistory = [...history].sort((a, b) => {
    return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
  });

  const handleEditRoundInternal = (roundIndex: number, scores: RoundScores) => {
    if (viewingGame && viewingGame.id) {
        onEditRound(viewingGame.id, roundIndex, scores);
        // We need to close the drawer or trigger a refresh, 
        // but since state lifts up to App, App will update 'history' prop
        // and we might need to update 'viewingGame' based on the new history.
        // For now, let's close the drawer to keep it simple or rely on App to update the viewingGame if it was passed as prop.
        // Better UX: Keep drawer open, but we need the updated game data.
        // Since we don't have the updated game immediately here without fetching from new props,
        // we will implement a finding logic in the render or useEffect.
    }
  };

  // derived state for viewing game based on history prop to ensure instant updates
  const activeViewingGame = viewingGame ? history.find(h => h.id === viewingGame.id) || viewingGame : null;

  return (
    <div className="min-h-screen bg-sky-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 p-4 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="p-3 rounded-2xl bg-white border border-slate-100 hover:bg-sky-50 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-black text-slate-800">Biên Bản Các Cuộc Họp</h1>
        <button 
          onClick={() => {
            if(window.confirm('Xoá hết là mất hết kỷ niệm đó nha?')) {
              onClearHistory();
            }
          }}
          className="p-3 rounded-2xl bg-red-50 text-red-400 hover:bg-red-100 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-20">
        {sortedHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                 <Clock className="w-10 h-10 opacity-30" />
            </div>
            <p className="font-bold">Chưa có biên bản nào.</p>
            <p className="text-sm">Triển ngay một cuộc họp đi!</p>
          </div>
        ) : (
          sortedHistory.map((game, index) => {
            // Find winner
            const sortedPlayers = [...game.players].sort((a, b) => b.totalScore - a.totalScore);
            const date = game.date ? new Date(game.date).toLocaleDateString('vi-VN', {
               day: '2-digit', month: '2-digit', year: 'numeric'
            }) : '';
            const time = game.date ? new Date(game.date).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : '';

            return (
              <div key={game.id || index} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-slate-800 font-black text-lg">{game.gameName}</h3>
                    <div className="flex items-center text-xs font-bold text-slate-400 mt-1 gap-2">
                      <Calendar className="w-3 h-3" /> {date} • {time}
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-sky-50 text-sky-500 rounded-full text-xs font-extrabold">
                    {game.rounds} Phiên
                  </div>
                </div>

                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl mb-4">
                   {sortedPlayers.map((p, i) => (
                     <div key={p.id} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-3">
                           <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-yellow-400 text-yellow-900' : 'bg-slate-200 text-slate-500'}`}>
                             {i + 1}
                           </div>
                           <span className={`font-bold ${i === 0 ? 'text-slate-800' : 'text-slate-500'}`}>
                             {p.name}
                           </span>
                        </div>
                        <span className={`font-black text-base ${p.totalScore > 0 ? 'text-green-500' : p.totalScore < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                          {p.totalScore > 0 ? '+' : ''}{p.totalScore}
                        </span>
                     </div>
                   ))}
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setViewingGame(game)}
                    className="flex-1 py-3 rounded-2xl bg-slate-50 text-slate-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors border border-slate-100"
                  >
                    <Eye className="w-4 h-4" /> Xem chi tiết
                  </button>
                  <button 
                    onClick={() => onRestore(game)}
                    className="flex-1 py-3 rounded-2xl bg-sky-50 text-sky-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-sky-100 transition-colors border border-sky-100"
                  >
                    <PlayCircle className="w-4 h-4" /> Tiếp tục
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Details Drawer */}
      {activeViewingGame && (
        <HistoryDrawer
          isOpen={!!activeViewingGame}
          onClose={() => setViewingGame(null)}
          players={activeViewingGame.players}
          rounds={activeViewingGame.rounds}
          readonly={false} // Allow editing in history view as well
          onEditRound={(roundIndex, scores) => handleEditRoundInternal(roundIndex, scores)}
        />
      )}
    </div>
  );
};