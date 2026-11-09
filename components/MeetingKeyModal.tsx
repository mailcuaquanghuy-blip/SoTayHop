import React, { useState, useEffect } from 'react';
import { X, Key, Share2, Copy, Check, ArrowRight, Play, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import { GameState } from '../types';
import { publishMeetingKey, loadMeetingByKey, generateMeetingKey, cleanKey } from '../services/cloudSyncService';
import { UserAccount } from '../services/authService';

interface MeetingKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeGame: GameState | null;
  currentUser: UserAccount | null;
  onLoadGame: (game: GameState) => void;
  onUpdateActiveGameKey: (key: string) => void;
  defaultMode?: 'ENTER' | 'SHARE';
}

export const MeetingKeyModal: React.FC<MeetingKeyModalProps> = ({
  isOpen,
  onClose,
  activeGame,
  currentUser,
  onLoadGame,
  onUpdateActiveGameKey,
  defaultMode = 'ENTER',
}) => {
  const [mode, setMode] = useState<'ENTER' | 'SHARE'>(defaultMode);
  
  // Enter key state
  const [inputKey, setInputKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedGame, setLoadedGame] = useState<GameState | null>(null);

  // Share key state
  const [currentKey, setCurrentKey] = useState<string>('');
  const [shareLoading, setShareLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setError(null);
      setLoadedGame(null);
      setCopied(false);
      setShareSuccess(false);

      if (activeGame) {
        setCurrentKey(activeGame.meetingKey || generateMeetingKey());
      }
    }
  }, [isOpen, defaultMode, activeGame]);

  if (!isOpen) return null;

  // Handle Find Game by Key
  const handleFindGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoadedGame(null);
    setLoading(true);

    try {
      const game = await loadMeetingByKey(inputKey);
      setLoadedGame(game);
    } catch (err: any) {
      setError(err?.message || 'Không tìm thấy cuộc họp với mã này.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Load Game into local state
  const handleConfirmLoad = () => {
    if (loadedGame) {
      onLoadGame(loadedGame);
      onClose();
    }
  };

  // Handle Publish / Share Key to Cloud
  const handlePublishKey = async () => {
    if (!activeGame) return;
    setShareLoading(true);
    setError(null);

    try {
      const savedKey = await publishMeetingKey(currentKey, activeGame, currentUser?.username);
      onUpdateActiveGameKey(savedKey);
      setShareSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Không thể lưu key lên đám mây.');
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopyKey = () => {
    const keyToCopy = currentKey;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(keyToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-transparent" onClick={onClose} />

      <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-3xl sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden">
        {/* Header with Switcher */}
        <div className="px-5 py-3.5 bg-sky-50 border-b border-sky-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-800 leading-tight">Key Cuộc Họp</h2>
              <p className="text-[11px] font-bold text-sky-600">Chuyển và tiếp tục phiên trên máy khác</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab Switcher if active game exists */}
        {activeGame && (
          <div className="flex p-2 bg-slate-50 border-b border-slate-100 gap-1.5 shrink-0">
            <button
              onClick={() => {
                setMode('ENTER');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === 'ENTER'
                  ? 'bg-white text-slate-800 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Nhập Key để nhận
            </button>
            <button
              onClick={() => {
                setMode('SHARE');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === 'SHARE'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Chia sẻ Key phiên này
            </button>
          </div>
        )}

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* MODE: ENTER KEY */}
          {mode === 'ENTER' && (
            <div className="space-y-4">
              <form onSubmit={handleFindGame} className="space-y-3">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">
                    Nhập mã Key cuộc họp
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputKey}
                      onChange={(e) => setInputKey(cleanKey(e.target.value))}
                      placeholder="vd: HOP-8921"
                      required
                      className="flex-1 bg-slate-50 border border-slate-200 focus:border-sky-400 focus:bg-white text-slate-800 text-base font-mono font-black tracking-wider uppercase rounded-2xl px-4 py-3 outline-none transition-all placeholder-slate-400 text-center"
                    />
                    <button
                      type="submit"
                      disabled={loading || !inputKey.trim()}
                      className="px-4 py-3 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-xs rounded-2xl shadow-xs transition-transform active:scale-95 whitespace-nowrap"
                    >
                      {loading ? 'Đang tìm...' : 'Tìm phiên'}
                    </button>
                  </div>
                </div>
              </form>

              {/* Found Game Preview */}
              {loadedGame && (
                <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-sky-600 bg-white px-2 py-0.5 rounded-full border border-sky-200">
                        Tìm thấy cuộc họp
                      </span>
                      <h4 className="text-base font-black text-slate-800 mt-1">
                        {loadedGame.gameName}
                      </h4>
                      <p className="text-xs text-slate-500 font-bold">
                        Đã qua {loadedGame.rounds} phiên • {loadedGame.players.length} người tham gia
                      </p>
                    </div>
                  </div>

                  {/* Top players */}
                  <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                    {loadedGame.players.map((p) => (
                      <div
                        key={p.id}
                        className="p-2 bg-white rounded-xl border border-sky-100 flex items-center justify-between text-xs"
                      >
                        <span className="font-bold text-slate-700 truncate">{p.name}</span>
                        <span
                          className={`font-black ${
                            p.totalScore >= 0 ? 'text-sky-600' : 'text-red-500'
                          }`}
                        >
                          {p.totalScore > 0 ? `+${p.totalScore}` : p.totalScore}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleConfirmLoad}
                    className="w-full py-3 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-black text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition-transform"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Nạp Vào Máy & Tiếp Tục Cuộc Họp</span>
                  </button>
                </div>
              )}

              <p className="text-xs text-slate-400 font-bold leading-relaxed text-center">
                💡 Người chủ trì phiên họp có thể bấm <strong>"Chia sẻ Key"</strong> để lấy mã và gửi cho bạn.
              </p>
            </div>
          )}

          {/* MODE: SHARE KEY */}
          {mode === 'SHARE' && activeGame && (
            <div className="space-y-4">
              <div className="text-center">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Mã Key cho phiên này:
                </span>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className="px-5 py-3 bg-slate-900 text-sky-400 font-mono font-black text-2xl tracking-widest rounded-2xl shadow-inner border border-slate-700">
                    {currentKey}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-colors"
                    title="Sao chép Key"
                  >
                    {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                {copied && (
                  <p className="text-xs font-bold text-emerald-600 mt-1">Đã sao chép vào bộ nhớ tạm!</p>
                )}
              </div>

              {shareSuccess ? (
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl text-xs font-bold border border-emerald-100 text-center">
                  ✅ Cuộc họp đã được lưu lên đám mây với mã Key này! Bạn có thể nhập mã này trên bất kỳ máy nào để tiếp tục.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handlePublishKey}
                  disabled={shareLoading}
                  className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-black text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{shareLoading ? 'Đang lưu lên đám mây...' : 'Lưu & Kích Hoạt Key Này'}</span>
                </button>
              )}

              <div className="p-3 bg-slate-50 rounded-2xl text-xs text-slate-600 font-bold space-y-1">
                <p>📌 <strong>Cách tiếp tục trên máy khác:</strong></p>
                <p>1. Mở app Sổ Tay Họp trên điện thoại hoặc laptop khác.</p>
                <p>2. Bấm nút <strong>"Nhập Key"</strong> trên màn hình chính.</p>
                <p>3. Điền mã <strong>{currentKey}</strong> và bấm tiếp tục!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
