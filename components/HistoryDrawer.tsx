import React from 'react';
import { X, Trash2, Pencil } from 'lucide-react';
import { Player, RoundScores } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  rounds: number;
  onDeleteLastRound?: () => void;
  onEditRound?: (roundIndex: number, currentScores: RoundScores) => void;
  readonly?: boolean;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({ 
  isOpen, 
  onClose, 
  players, 
  rounds, 
  onDeleteLastRound,
  onEditRound,
  readonly = false 
}) => {
  const historyRows = [];
  for (let r = 0; r < rounds; r++) {
    const rowData: { [key: string]: number } = {};
    players.forEach(p => {
      rowData[p.id] = p.history[r] || 0;
    });
    historyRows.push(rowData);
  }

  // Show latest round at the top
  const reversedRows = [...historyRows].map((data, idx) => ({ roundIndex: idx + 1, data, originalIndex: idx })).reverse();

  return (
    <>
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      <div className={`fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
            <h2 className="text-xl font-black text-slate-800">
              Chi Tiết Từng Phiên
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-800">
              <X className="w-6 h-6 stroke-[3]" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-0 relative">
             {rounds === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 font-bold">
                    <p>Chưa có dữ liệu ghi nhận.</p>
                </div>
             ) : (
                <div className="min-w-full inline-block align-middle">
                     <table className="min-w-full divide-y divide-slate-100 border-collapse">
                        <thead className="bg-white sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-wider bg-white sticky left-0 z-20 border-r border-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                    Phiên
                                </th>
                                {players.map(p => (
                                    <th key={p.id} scope="col" className="px-4 py-3 text-right text-xs font-black text-slate-400 uppercase tracking-wider whitespace-nowrap min-w-[80px]">
                                        {p.name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {reversedRows.map((row) => (
                                <tr key={row.roundIndex} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-slate-400 bg-white sticky left-0 z-10 border-r border-slate-50">
                                        <div className="flex items-center gap-2">
                                            #{row.roundIndex}
                                            {onEditRound && (
                                                <button 
                                                    onClick={() => onEditRound(row.originalIndex, row.data)}
                                                    className="p-1 rounded-full text-slate-300 hover:text-sky-500 hover:bg-sky-50 transition-colors"
                                                    title="Sửa điểm phiên này"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    {players.map(p => {
                                        const score = row.data[p.id];
                                        return (
                                            <td key={p.id} className={`px-4 py-4 whitespace-nowrap text-sm text-right font-bold ${score > 0 ? 'text-green-500' : score < 0 ? 'text-red-500' : 'text-slate-300'}`}>
                                                {score > 0 ? '+' : ''}{score}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                     </table>
                </div>
             )}
          </div>

          {!readonly && rounds > 0 && onDeleteLastRound && (
              <div className="p-4 border-t border-slate-100 bg-white">
                  <button 
                    onClick={() => {
                        if(window.confirm("Xoá phiên vừa rồi? Không hoàn tác được đâu nha!")) {
                            onDeleteLastRound();
                        }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors font-bold"
                  >
                      <Trash2 className="w-5 h-5" />
                      Xoá phiên gần nhất
                  </button>
              </div>
          )}
        </div>
      </div>
    </>
  );
};