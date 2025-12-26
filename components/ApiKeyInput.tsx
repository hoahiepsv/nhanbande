
import React, { useState, useEffect } from 'react';
import { Key, Save, Edit3, CheckCircle2, Lock } from 'lucide-react';

interface ApiKeyInputProps {
  onKeyChange: (key: string) => void;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onKeyChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('GEMINI_API_KEY');
    if (savedKey) {
      setApiKey(savedKey);
      setIsSaved(true);
      onKeyChange(savedKey);
    }
  }, [onKeyChange]);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('GEMINI_API_KEY', apiKey.trim());
      setIsSaved(true);
      onKeyChange(apiKey.trim());
    }
  };

  const handleEdit = () => {
    setIsSaved(false);
  };

  return (
    <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[10px] font-black text-slate-400 flex items-center gap-2 uppercase tracking-widest">
          <Key size={14} className="text-blue-600" /> Cấu hình API Key
        </h2>
        {isSaved && (
          <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 uppercase">
            <CheckCircle2 size={10} /> Đã lưu
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Lock size={16} />
          </div>
          <input
            type={isSaved ? "password" : "text"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={isSaved}
            placeholder="Nhập Gemini API Key của bạn..."
            className={`w-full pl-11 pr-4 py-3 rounded-2xl text-sm border-2 outline-none transition-all font-mono ${
              isSaved 
                ? 'bg-slate-50 border-slate-100 text-slate-500 cursor-not-allowed' 
                : 'bg-white border-blue-50 focus:border-blue-500 text-slate-900'
            }`}
          />
        </div>

        {isSaved ? (
          <button
            onClick={handleEdit}
            className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Edit3 size={14} /> CHỈNH SỬA
          </button>
        ) : (
          <button
            onClick={handleSave}
            className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-200"
          >
            <Save size={14} /> LƯU VÀO TRÌNH DUYỆT
          </button>
        )}
      </div>
      <p className="mt-3 text-[9px] text-slate-400 leading-tight">
        * API Key được lưu an toàn tại bộ nhớ cục bộ (Local Storage) của trình duyệt này.
      </p>
    </div>
  );
};
