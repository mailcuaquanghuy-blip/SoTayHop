import React, { useMemo } from 'react';
import { Trophy, TrendingDown, TrendingUp, Minus, Crown, Briefcase, Coffee, Lightbulb, Mic, Glasses, Laptop, BrainCircuit, UserCheck, UserMinus } from 'lucide-react';
import { Player } from '../types';

interface PlayerCardProps {
  player: Player;
  rank: number;
  isWinner: boolean;
  isLoser: boolean;
  isParticipating: boolean;
  onToggleParticipation: () => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, rank, isWinner, isLoser, isParticipating, onToggleParticipation }) => {
  const lastScore = player.history.length > 0 ? player.history[player.history.length - 1] : 0;
  
  // Deterministic funny icon based on player ID
  const FunnyIcon = useMemo(() => {
    const icons = [Briefcase, Coffee, Lightbulb, Mic, Glasses, Laptop, BrainCircuit];
    const index = player.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % icons.length;
    return icons[index];
  }, [player.id]);

  // Base styles
  let cardStyles = isParticipating ? "bg-white border-2 border-slate-100 shadow-sm" : "bg-slate-50 border-2 border-slate-100 opacity-60 grayscale-[0.5]";
  let nameColor = isParticipating ? "text-slate-700" : "text-slate-400";
  let scoreColor = isParticipating ? "text-slate-800" : "text-slate-400";
  let rankBadge = <span className="text-slate-400 font-extrabold text-sm">#{rank}</span>;
  let statusIcon = null;

  // MVP / Winner styling (Blue/Sky theme dominant)
  if (isWinner && isParticipating) {
    cardStyles = "bg-sky-50 border-2 border-sky-400 shadow-[0_8px_20px_rgba(56,189,248,0.3)] transform scale-[1.02] z-10";
    nameColor = "text-sky-800";
    scoreColor = "text-sky-700";
    rankBadge = (
      <div className="bg-sky-500 text-white px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
        <Crown className="w-3 h-3 fill-current" />
        <span className="text-[10px] font-black uppercase">MVP</span>
      </div>
    );
    statusIcon = (
      <div className="absolute -top-4 -right-2">
        <div className="bg-yellow-400 text-yellow-900 text-xs font-black px-2 py-1 rounded-full shadow-md animate-bounce border border-yellow-200">
           Sếp Sòng 👑
        </div>
      </div>
    );
  } 
  // Loser styling
  else if (isLoser && isParticipating) {
    cardStyles = "bg-slate-50 border-2 border-slate-200 opacity-90";
    nameColor = "text-slate-500";
    scoreColor = "text-slate-500";
    statusIcon = <div className="absolute -top-3 -right-2 text-xl rotate-12">🐢</div>;
  }
  // Rank 2 & 3
  else if (rank === 2 && isParticipating) {
    rankBadge = <span className="text-slate-500 font-extrabold bg-slate-200 px-2 py-0.5 rounded-lg text-xs">Á QUÂN</span>;
  } else if (rank === 3 && isParticipating) {
    rankBadge = <span className="text-orange-700 font-extrabold bg-orange-100 px-2 py-0.5 rounded-lg text-xs">TOP 3</span>;
  }

  return (
    <div className={`relative flex flex-col p-4 rounded-3xl transition-all duration-300 ${cardStyles}`}>
      {statusIcon}
      
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 overflow-hidden">
            <div className={`p-1.5 rounded-full ${isWinner && isParticipating ? 'bg-sky-200 text-sky-700' : 'bg-slate-100 text-slate-400'}`}>
                <FunnyIcon className="w-4 h-4" />
            </div>
            <h3 className={`text-base font-bold truncate ${nameColor}`}>{player.name}</h3>
        </div>
        <div>{rankBadge}</div>
      </div>
      
      <div className="mt-auto pl-1 flex justify-between items-end">
        <div>
          <div className={`text-4xl font-black tracking-tight leading-none ${scoreColor}`}>
            {player.totalScore}
          </div>
          
          {/* Last round indicator */}
          <div className="flex items-center gap-1.5 mt-2 text-xs font-bold bg-white/60 w-fit px-2 py-1 rounded-full border border-black/5 backdrop-blur-sm">
            {lastScore > 0 ? (
               <>
                 <TrendingUp className="w-3 h-3 text-green-500" />
                 <span className="text-green-600">+{lastScore}</span>
               </>
            ) : lastScore < 0 ? (
               <>
                 <TrendingDown className="w-3 h-3 text-red-400" />
                 <span className="text-red-400">{lastScore}</span>
               </>
            ) : (
               <>
                 <Minus className="w-3 h-3 text-slate-300" />
                 <span className="text-slate-400">-</span>
               </>
            )}
          </div>
        </div>

        {/* Participation Toggle Switch */}
        <div className="flex flex-col items-center gap-1.5">
          <span className={`text-[9px] font-black uppercase tracking-widest ${isParticipating ? 'text-sky-500' : 'text-slate-400'}`}>
            {isParticipating ? 'Đang họp' : 'Đang nghỉ'}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleParticipation();
            }}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
              isParticipating ? 'bg-sky-500' : 'bg-slate-300'
            }`}
            title={isParticipating ? "Đang chơi" : "Đang nghỉ"}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                isParticipating ? 'translate-x-[18px]' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};