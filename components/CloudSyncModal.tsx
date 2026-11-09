import React, { useState, useEffect } from 'react';
import { X, Cloud, UploadCloud, DownloadCloud, Trash2, CheckCircle2, AlertCircle, RefreshCw, FolderLock, Play } from 'lucide-react';
import { GameState } from '../types';
import { UserAccount } from '../services/authService';
import {
  syncMultipleSessionsToCloud,
  getUserCloudSessions,
  deleteUserCloudSession,
  syncSessionToCloud,
} from '../services/cloudSyncService';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  localHistory: GameState[];
  activeGame: GameState | null;
  onRestoreToLocal: (game: GameState) => void;
  onOpenAuth: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  localHistory,
  activeGame,
  onRestoreToLocal,
  onOpenAuth,
}) => {
  const [cloudSessions, setCloudSessions] = useState<GameState[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchCloudSessions = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      const list = await getUserCloudSessions(currentUser.username);
      setCloudSessions(list);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải kho đám mây.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentUser) {
      fetchCloudSessions();
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // If user is not logged in, prompt login
  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="absolute inset-0 bg-transparent" onClick={onClose} />
        <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-3xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto shadow-xs">
            <Cloud className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800">Kho Lưu Trữ Đám Mây</h3>
            <p className="text-xs text-slate-500 font-bold mt-1">
              Vui lòng đăng nhập bằng tài khoản để mở kho lưu trữ riêng của bạn trên đám mây.
            </p>
          </div>
          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-black text-sm rounded-2xl shadow-md transition-all active:scale-95"
            >
              Đăng Nhập Ngay
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl"
            >
              Để sau
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle uploading all local games to user's private cloud
  const handleUploadAllLocal = async () => {
    setSyncing(true);
    setError(null);
    setSuccess(null);

    const allLocal: GameState[] = [];
    if (activeGame) allLocal.push(activeGame);
    localHistory.forEach(h => allLocal.push(h));

    if (allLocal.length === 0) {
      setError('Hiện tại trên máy chưa có phiên họp nào để tải lên.');
      setSyncing(false);
      return;
    }

    try {
      const count = await syncMultipleSessionsToCloud(currentUser.username, allLocal);
      setSuccess(`Đã sao lưu ${count} phiên lên kho đám mây riêng của ${currentUser.username}!`);
      await fetchCloudSessions();
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi sao lưu dữ liệu.');
    } finally {
      setSyncing(false);
    }
  };

  // Handle delete from cloud
  const handleDeleteCloud = async (sessionId: string, gameName: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa phiên "${gameName}" khỏi kho đám mây không?`)) return;
    setError(null);
    setSuccess(null);
    try {
      await deleteUserCloudSession(currentUser.username, sessionId);
      setSuccess(`Đã xóa "${gameName}" khỏi kho đám mây.`);
      await fetchCloudSessions();
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi xóa phiên.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-transparent" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-3xl sm:rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-sky-50 border-b border-sky-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-800 leading-tight">
                Kho Đám Mây: @{currentUser.username}
              </h2>
              <p className="text-xs font-bold text-sky-600">Lưu trữ và đồng bộ hóa độc lập</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Feedback Alerts */}
        <div className="px-5 pt-3 pb-1 shrink-0 space-y-2">
          {error && (
            <div className="p-2.5 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl text-xs font-bold border border-emerald-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* Sync Trigger Card */}
          <div className="p-3.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-2xl flex items-center justify-between gap-3 shadow-sm">
            <div>
              <h4 className="font-black text-xs sm:text-sm">Đồng Bộ Phiên Từ Máy Lên Mây</h4>
              <p className="text-[11px] text-sky-100 font-semibold">
                Hiện có {localHistory.length + (activeGame ? 1 : 0)} phiên trên máy này
              </p>
            </div>
            <button
              onClick={handleUploadAllLocal}
              disabled={syncing}
              className="px-3.5 py-2 bg-white text-sky-600 hover:bg-sky-50 active:scale-95 rounded-xl font-black text-xs whitespace-nowrap shadow-xs flex items-center gap-1.5 transition-transform"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{syncing ? 'Đang tải...' : 'Lưu Lên Mây'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
              Các phiên trong kho riêng ({cloudSessions.length})
            </span>
            <button
              onClick={fetchCloudSessions}
              disabled={loading}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              title="Làm mới"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Cloud Sessions List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2.5">
          {cloudSessions.length === 0 ? (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <FolderLock className="w-10 h-10 mx-auto opacity-40" />
              <p className="text-xs font-bold">Kho đám mây của bạn chưa có phiên nào.</p>
              <p className="text-[11px]">Bấm nút "Lưu Lên Mây" ở trên để đưa các phiên từ máy vào kho.</p>
            </div>
          ) : (
            cloudSessions.map((session) => (
              <div
                key={session.id || session.gameName}
                className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-800 text-xs sm:text-sm truncate">
                      {session.gameName}
                    </span>
                    {session.meetingKey && (
                      <span className="text-[10px] bg-sky-100 text-sky-700 font-mono font-bold px-1.5 py-0.2 rounded-md">
                        {session.meetingKey}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 font-semibold mt-0.5">
                    {session.rounds} phiên • {session.players?.length || 0} người • {session.date?.split('T')[0] || 'Vừa xong'}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Restore / Load button */}
                  <button
                    onClick={() => {
                      onRestoreToLocal(session);
                      onClose();
                    }}
                    className="p-2 bg-white hover:bg-sky-50 text-sky-600 border border-sky-200 rounded-xl transition-colors shadow-2xs"
                    title="Nạp vào máy này để tiếp tục"
                  >
                    <DownloadCloud className="w-4 h-4" />
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={() => session.id && handleDeleteCloud(session.id, session.gameName)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Xóa khỏi kho mây"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
