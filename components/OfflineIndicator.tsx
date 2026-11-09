import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from './useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-lg border border-slate-700 animate-in fade-in slide-in-from-top-2">
      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      <span>Chế độ ngoại tuyến (Dữ liệu đã lưu trên máy)</span>
    </div>
  );
};
