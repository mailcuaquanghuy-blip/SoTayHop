import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, Key, Trash2, CheckCircle2, AlertCircle, Shield, User, RefreshCw, Lock, Unlock } from 'lucide-react';
import {
  UserAccount,
  getAllAccounts,
  createSubAccount,
  toggleAccountStatus,
  resetAccountPassword,
  deleteAccount,
  DEFAULT_ADMIN_USERNAME,
} from '../services/authService';

interface AccountManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
}

export const AccountManagementModal: React.FC<AccountManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New account form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');

  // Reset password state
  const [resetTargetUser, setResetTargetUser] = useState<string | null>(null);
  const [newResetPassword, setNewResetPassword] = useState('');

  // Fetch accounts on open
  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getAllAccounts();
      setAccounts(list);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
      setShowAddForm(false);
      setResetTargetUser(null);
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Security gate: sub-accounts cannot access account management
  if (currentUser?.role !== 'admin') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="font-black text-lg text-slate-800">Không Có Quyền Truy Cập</h3>
          <p className="text-xs text-slate-500 font-bold">
            Chỉ tài khoản Quản trị viên (Admin) mới có quyền quản lý tài khoản.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 text-white rounded-xl font-bold text-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await createSubAccount(newUsername, newPassword, newDisplayName, newRole);
      setSuccess(`Đã tạo thành công tài khoản "${newUsername}".`);
      setNewUsername('');
      setNewPassword('');
      setNewDisplayName('');
      setShowAddForm(false);
      await fetchAccounts();
    } catch (err: any) {
      setError(err?.message || 'Không thể tạo tài khoản.');
    }
  };

  const handleToggleStatus = async (account: UserAccount) => {
    setError(null);
    setSuccess(null);
    try {
      await toggleAccountStatus(account.username, account.isActive);
      setSuccess(`Đã ${account.isActive ? 'khóa' : 'mở khóa'} tài khoản "${account.username}".`);
      await fetchAccounts();
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi đổi trạng thái.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser) return;
    setError(null);
    setSuccess(null);
    try {
      await resetAccountPassword(resetTargetUser, newResetPassword);
      setSuccess(`Đã đặt lại mật khẩu mới cho "${resetTargetUser}".`);
      setResetTargetUser(null);
      setNewResetPassword('');
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi đặt lại mật khẩu.');
    }
  };

  const handleDelete = async (username: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa tài khoản "${username}" không?`)) return;
    setError(null);
    setSuccess(null);
    try {
      await deleteAccount(username);
      setSuccess(`Đã xóa tài khoản "${username}".`);
      await fetchAccounts();
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi xóa tài khoản.');
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
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 leading-tight">Quản Lý Tài Khoản</h2>
              <p className="text-xs font-bold text-sky-600">Độc quyền cho Quản trị viên</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Action & Status Feedback */}
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

          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
              Danh sách tài khoản ({accounts.length})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchAccounts}
                disabled={loading}
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
                title="Làm mới"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{showAddForm ? 'Đóng form' : 'Thêm tài khoản'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Add Account Form */}
          {showAddForm && (
            <form onSubmit={handleCreateAccount} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-sky-500" />
                Tạo tài khoản mới
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Tên đăng nhập *</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="vd: huong_hr"
                    required
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Mật khẩu *</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    required
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Tên hiển thị</label>
                  <input
                    type="text"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    placeholder="vd: Hường HR"
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Vai trò</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-sky-400"
                  >
                    <option value="user">Thành viên (Kho riêng)</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-black rounded-xl shadow-xs"
                >
                  Tạo ngay
                </button>
              </div>
            </form>
          )}

          {/* Reset Password Form */}
          {resetTargetUser && (
            <form onSubmit={handleResetPassword} className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-amber-600" />
                  Đổi mật khẩu cho: <strong>{resetTargetUser}</strong>
                </h3>
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  Đóng
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={newResetPassword}
                  onChange={(e) => setNewResetPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                  required
                  className="flex-1 bg-white border border-amber-300 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl whitespace-nowrap shadow-xs"
                >
                  Lưu mật khẩu
                </button>
              </div>
            </form>
          )}

          {/* Accounts List */}
          <div className="space-y-2">
            {accounts.map((acc) => {
              const isDefaultAdmin = acc.username === DEFAULT_ADMIN_USERNAME;
              return (
                <div
                  key={acc.username}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    acc.isActive
                      ? 'bg-slate-50/80 border-slate-200/90'
                      : 'bg-slate-100 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        acc.role === 'admin'
                          ? 'bg-sky-500 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {acc.role === 'admin' ? (
                        <Shield className="w-4 h-4" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-slate-800 text-xs sm:text-sm truncate">
                          {acc.displayName || acc.username}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          (@{acc.username})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.2 rounded-md uppercase ${
                            acc.role === 'admin'
                              ? 'bg-sky-100 text-sky-700'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {acc.role === 'admin' ? 'Admin' : 'Thành viên'}
                        </span>
                        {!acc.isActive && (
                          <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.2 rounded-md">
                            Đã khóa
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Reset Password */}
                    <button
                      type="button"
                      onClick={() => setResetTargetUser(acc.username)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Đặt lại mật khẩu"
                    >
                      <Key className="w-4 h-4" />
                    </button>

                    {/* Lock / Unlock (Not for default admin) */}
                    {!isDefaultAdmin && (
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(acc)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          acc.isActive
                            ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                            : 'text-amber-600 bg-amber-50'
                        }`}
                        title={acc.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                      >
                        {acc.isActive ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>
                    )}

                    {/* Delete (Not for default admin) */}
                    {!isDefaultAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDelete(acc.username)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa tài khoản"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
