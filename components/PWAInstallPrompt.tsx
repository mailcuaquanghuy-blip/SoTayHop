import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, X, CheckCircle2, WifiOff, Sparkles } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

export const PWAInstallPrompt: React.FC<{ variant?: 'banner' | 'button' | 'badge' }> = ({ variant = 'banner' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already running in standalone mode (already installed as an app), do not show install prompt
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      {variant === 'banner' && (
        <div className="w-full bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 text-white rounded-3xl p-4 shadow-lg shadow-sky-500/20 flex items-center justify-between gap-3 border border-sky-400/30">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0 text-left">
              <div className="flex items-center gap-1.5 font-black text-sm">
                <span>Cài Đặt Về Điện Thoại</span>
                <span className="text-[10px] bg-white/25 px-1.5 py-0.5 rounded-full font-bold">App</span>
              </div>
              <p className="text-xs text-sky-100 font-semibold truncate">
                Dùng như app xịn, mở toàn màn hình & chạy offline
              </p>
            </div>
          </div>

          <button
            onClick={handleInstallClick}
            disabled={isInstalling}
            className="px-3.5 py-2.5 rounded-2xl bg-white text-sky-600 hover:bg-sky-50 active:scale-95 transition-all font-black text-xs sm:text-sm whitespace-nowrap shadow-md flex items-center gap-1.5 shrink-0"
          >
            <Download className="w-4 h-4 stroke-[3]" />
            <span>Cài đặt ngay</span>
          </button>
        </div>
      )}

      {variant === 'button' && (
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-600 border border-sky-200 text-xs font-black transition-colors"
          title="Cài đặt app về điện thoại"
        >
          <Smartphone className="w-4 h-4" />
          <span>Cài App</span>
        </button>
      )}

      {/* Installation Guide Modal (for iOS or browsers without native prompt) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-transparent" 
            onClick={() => setShowModal(false)}
          />
          
          <div className="relative w-full max-w-sm bg-white rounded-3xl sm:rounded-[2.5rem] shadow-2xl p-5 sm:p-6 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-black">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-base">Cài Vào Màn Hình Chính</h3>
                  <p className="text-[11px] font-bold text-sky-600">Sổ Tay Họp Vui Vẻ</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Content for iOS */}
            {isIOS ? (
              <div className="py-4 space-y-3.5">
                <p className="text-xs text-slate-600 font-bold leading-relaxed">
                  Để dùng ứng dụng toàn màn hình không có thanh địa chỉ trên iPhone/iPad:
                </p>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs font-black text-xs">
                      1
                    </div>
                    <div className="text-xs font-bold text-slate-700">
                      Bấm vào biểu tượng <strong className="text-sky-600 inline-flex items-center gap-1 mx-1"><Share className="w-3.5 h-3.5 inline" /> Chia sẻ</strong> ở thanh dưới trình duyệt Safari.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs font-black text-xs">
                      2
                    </div>
                    <div className="text-xs font-bold text-slate-700">
                      Cuộn xuống và chọn <strong className="text-sky-600 inline-flex items-center gap-1 mx-1"><PlusSquare className="w-3.5 h-3.5 inline" /> Thêm vào MH chính</strong> (Add to Home Screen).
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs font-black text-xs">
                      3
                    </div>
                    <div className="text-xs font-bold text-slate-700">
                      Bấm nút <strong className="text-sky-600">Thêm (Add)</strong> ở góc trên bên phải để hoàn tất.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-800 rounded-2xl text-[11px] font-bold border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Icon app sẽ xuất hiện ngay trên màn hình chính như app tải từ App Store!</span>
                </div>
              </div>
            ) : (
              /* Content for Android / Chrome / Other */
              <div className="py-4 space-y-3.5">
                <p className="text-xs text-slate-600 font-bold leading-relaxed">
                  Cài đặt để mở ứng dụng toàn màn hình, sử dụng offline và truy cập nhanh từ màn hình chính:
                </p>

                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-2xl text-xs font-bold text-slate-700">
                    <span className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0 text-[10px]">1</span>
                    <span>Mở menu trình duyệt (biểu tượng 3 chấm <strong>⋮</strong> góc trên).</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-2xl text-xs font-bold text-slate-700">
                    <span className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0 text-[10px]">2</span>
                    <span>Chọn <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Thêm vào Màn hình chính"</strong>.</span>
                  </div>
                </div>

                {isInstallable && (
                  <button
                    onClick={async () => {
                      setShowModal(false);
                      await install();
                    }}
                    className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-black text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4 stroke-[3]" />
                    <span>Cài Đặt Ngay</span>
                  </button>
                )}
              </div>
            )}

            <button
              onClick={() => setShowModal(false)}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs sm:text-sm rounded-2xl transition-colors"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
};
