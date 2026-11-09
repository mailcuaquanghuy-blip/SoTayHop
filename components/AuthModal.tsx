import React, { useState } from 'react';
import { X, Lock, User, KeyRound, Shield, CheckCircle2, AlertCircle, LogOut, Users, Cloud } from 'lucide-react';
import { loginUser, UserAccount, logoutUser } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onLoginSuccess: (user: UserAccount) => void;
  onLogout: () => void;
  onOpenAccountManagement?: () => void;
  onOpenCloudSync?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
  onOpenAccountManagement,
  onOpenCloudSync,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await loginUser(username, password);
      onLoginSuccess(user);
      setUsername('');
      setPassword('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Đăng nhập không thành công.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-transparent" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-white rounded-3xl sm:rounded-[2.5rem] shadow-2xl p-6 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* LOGGED IN VIEW */}
        {currentUser ? (
          <div className="space-y-4 pt-2">
            <div className="text-center">
              <div className="w-16 h-16 rounded-3xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
                {currentUser.role === 'admin' ? (
                  <Shield className="w-8 h-8 text-sky-600" />
                ) : (
                  <User className="w-8 h-8 text-sky-600" />
                )}
              </div>
              <h3 className="text-xl font-black text-slate-800">
                {currentUser.displayName || currentUser.username}
              </h3>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-1 rounded-full text-xs font-black uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">
                {currentUser.role === 'admin' ? '👑 Quản Trị Viên (Admin)' : '👤 Tài Khoản Thành Viên'}
              </div>
            </div>

            <p className="text-xs text-slate-500 font-bold text-center leading-relaxed">
              Bạn đang kết nối với kho lưu trữ riêng của <strong>{currentUser.username}</strong> trên đám mây.
            </p>

            <div className="space-y-2 pt-2">
              {/* Cloud Sync Button */}
              {onOpenCloudSync && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCloudSync();
                  }}
                  className="w-full py-3.5 px-4 bg-sky-50 hover:bg-sky-100 text-sky-700 font-black text-sm rounded-2xl flex items-center justify-center gap-2 transition-colors border border-sky-200"
                >
                  <Cloud className="w-4 h-4" />
                  <span>Kho Lưu Trữ & Đồng Bộ Đám Mây</span>
                </button>
              )}

              {/* ADMIN ONLY: Account Management */}
              {currentUser.role === 'admin' && onOpenAccountManagement && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAccountManagement();
                  }}
                  className="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-md"
                >
                  <Users className="w-4 h-4" />
                  <span>Quản Lý Tài Khoản (Admin)</span>
                </button>
              )}

              {/* Logout Button */}
              <button
                type="button"
                onClick={() => {
                  logoutUser();
                  onLogout();
                  onClose();
                }}
                className="w-full py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-black text-sm rounded-2xl flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng Xuất</span>
              </button>
            </div>
          </div>
        ) : (
          /* LOGIN FORM VIEW (Admin & Admin-created accounts only) */
          <div className="space-y-4 pt-2">
            <div className="text-center">
              <div className="w-14 h-14 rounded-3xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-2.5 shadow-xs">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-800">Đăng Nhập Hệ Thống</h3>
              <p className="text-xs text-slate-400 font-bold mt-0.5">
                Chỉ dành cho tài khoản được cấp bởi Quản trị viên
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1 ml-1">
                  Tên đăng nhập
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ví dụ: admin"
                    autoCapitalize="none"
                    autoCorrect="off"
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:border-sky-400 focus:bg-white text-slate-800 text-sm font-bold rounded-2xl pl-10 pr-3 py-3 outline-none transition-all placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1 ml-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:border-sky-400 focus:bg-white text-slate-800 text-sm font-bold rounded-2xl pl-10 pr-3 py-3 outline-none transition-all placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || !username || !password}
                  className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-black text-sm rounded-2xl shadow-md shadow-sky-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>Đang kiểm tra...</span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Đăng Nhập</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="pt-1 text-center">
              <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                💡 Nếu chưa có tài khoản, dữ liệu vẫn được lưu đầy đủ trên máy này.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
