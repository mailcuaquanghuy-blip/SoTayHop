import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string) => void;
}

export const AddPlayerModal: React.FC<AddPlayerModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim());
      setName('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-6 transform transition-all animate-in fade-in zoom-in-95">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5 stroke-[3]" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-sky-50 text-sky-500 rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-sm border border-sky-100">
             <UserPlus className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-800">Thêm Thành Viên</h2>
          <p className="text-sm text-slate-500 font-bold mt-1">Vào sau chấp nhận 0 điểm nhé!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tên thành viên mới..."
            className="w-full bg-slate-50 border-2 border-slate-100 text-slate-800 text-lg font-bold rounded-2xl px-4 py-4 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 outline-none transition-all placeholder-slate-400 text-center"
          />
          
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-black text-lg py-4 rounded-2xl shadow-lg shadow-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            Thêm Ngay
          </button>
        </form>
      </div>
    </div>
  );
};