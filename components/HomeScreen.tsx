import React from 'react';
import { Play, Plus, History, ArrowRight, Sparkles, Key, Lock, User, Cloud, Shield } from 'lucide-react';
import { GameState } from '../types';
import { UserAccount } from '../services/authService';
import { PWAInstallPrompt } from './PWAInstallPrompt';

interface HomeScreenProps {
  activeGame: GameState | null;
  currentUser: UserAccount | null;
  onNewGame: () => void;
  onContinue: () => void;
  onViewHistory: () => void;
  onOpenAuth: () => void;
  onOpenMeetingKey: () => void;
  onOpenCloudSync: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  activeGame,
  currentUser,
  onNewGame,
  onContinue,
  onViewHistory,
  onOpenAuth,
  onOpenMeetingKey,
  onOpenCloudSync,
}) => {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-sky-50">
      {/* Decorative Blobs (Blue Theme) */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-cyan-300 rounded-full blur-3xl opacity-60 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-blue-300 rounded-full blur-3xl opacity-60 animate-pulse delay-700 pointer-events-none"></div>

      {/* Top Discreet Corner Bar: Key & Login */}
      <div className="w-full max-w-md mx-auto px-5 pt-4 flex items-center justify-between z-20">
        {/* Left: Enter Meeting Key */}
        <button
          onClick={onOpenMeetingKey}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 hover:bg-white text-slate-600 hover:text-sky-600 border border-slate-200/80 text-xs font-bold shadow-2xs backdrop-blur-md transition-all active:scale-95"
          title="Nhập Key cuộc họp từ máy khác"
        >
          <Key className="w-3.5 h-3.5 text-amber-500" />
          <span>Nhập Key</span>
        </button>

        {/* Right: Discreet Login / Account button */}
        <button
          onClick={onOpenAuth}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold shadow-2xs backdrop-blur-md transition-all active:scale-95 ${
            currentUser
              ? 'bg-sky-500 text-white border-sky-400'
              : 'bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 border-slate-200/80'
          }`}
          title={currentUser ? `Đang đăng nhập: ${currentUser.username}` : 'Đăng nhập tài khoản'}
        >
          {currentUser ? (
            <>
              {currentUser.role === 'admin' ? (
                <Shield className="w-3.5 h-3.5" />
              ) : (
                <User className="w-3.5 h-3.5" />
              )}
              <span className="truncate max-w-[85px]">@{currentUser.username}</span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 opacity-60" />
              <span className="opacity-80">Tài khoản</span>
            </>
          )}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 z-10 w-full max-w-md mx-auto">
        {/* Header/Logo Area */}
        <div className="text-center mb-8 relative">
          <div className="absolute -top-6 -right-6 animate-bounce">
            <Sparkles className="w-8 h-8 text-sky-400 fill-sky-400" />
          </div>
          <div className="inline-flex items-center justify-center w-28 h-28 rounded-[2rem] bg-gradient-to-br from-cyan-400 to-blue-600 mb-4 shadow-[0_10px_20px_rgba(14,165,233,0.3)] rotate-3 hover:rotate-6 transition-transform cursor-pointer">
            <span className="text-5xl">📅</span>
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2 leading-tight">
            Sổ Tay<br/>
            <span className="text-sky-600">Họp Hành</span>
          </h1>
          <p className="text-slate-500 font-bold text-base sm:text-lg">Ghi chú vui - Bớt căng thẳng!</p>
        </div>

        {/* Actions */}
        <div className="w-full space-y-3.5">
          {/* Active game continuation */}
          {activeGame && activeGame.isActive && (
            <button
              onClick={onContinue}
              className="group w-full bg-white border-2 border-sky-100 hover:border-sky-300 p-4 rounded-3xl flex items-center justify-between transition-all shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600">
                  <Play className="w-7 h-7 fill-current" />
                </div>
                <div className="text-left">
                  <div className="font-extrabold text-sky-500 text-xs uppercase tracking-wider bg-sky-50 px-2 py-0.5 rounded-full inline-block mb-1">Đang họp dở</div>
                  <div className="font-bold text-slate-800 text-lg truncate max-w-[180px]">{activeGame.gameName}</div>
                  <div className="text-xs text-slate-400 font-semibold">Vòng {activeGame.rounds} • {activeGame.players.length} thành viên</div>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-colors">
                 <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          )}

          {/* New Game */}
          <button
            onClick={onNewGame}
            className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white p-5 rounded-3xl flex items-center justify-center gap-3 font-black text-xl shadow-[0_8px_20px_rgba(2,132,199,0.3)] transition-all active:scale-[0.98] transform hover:-translate-y-1"
          >
            <Plus className="w-7 h-7 stroke-[3]" />
            Tạo Cuộc Họp Mới
          </button>

          {/* History */}
          <button
            onClick={onViewHistory}
            className="w-full bg-white hover:bg-slate-50 text-slate-700 p-4 rounded-3xl flex items-center justify-center gap-3 font-bold transition-all shadow-sm border border-slate-200"
          >
            <History className="w-5 h-5 text-slate-500" />
            Lịch sử biên bản trên máy
          </button>

          {/* Enter Key to continue on another device */}
          <button
            onClick={onOpenMeetingKey}
            className="w-full bg-white hover:bg-amber-50/50 text-slate-700 p-3.5 rounded-3xl flex items-center justify-center gap-2.5 font-bold transition-all shadow-sm border border-slate-200 text-sm"
          >
            <Key className="w-4 h-4 text-amber-500" />
            <span>Nhập Key cuộc họp (Tiếp tục từ máy khác)</span>
          </button>

          {/* Cloud Storage shortcut (if logged in) */}
          {currentUser && (
            <button
              onClick={onOpenCloudSync}
              className="w-full bg-sky-50 hover:bg-sky-100 text-sky-700 p-3.5 rounded-3xl flex items-center justify-center gap-2.5 font-bold transition-all border border-sky-200 text-sm"
            >
              <Cloud className="w-4 h-4 text-sky-600" />
              <span>Kho Đám Mây Của @{currentUser.username}</span>
            </button>
          )}

          {/* PWA Install Banner */}
          <div className="pt-1">
            <PWAInstallPrompt variant="banner" />
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="p-4 text-center text-xs font-bold text-slate-400 opacity-60">
        Team Building & Meeting Tool
      </div>
    </div>
  );
};