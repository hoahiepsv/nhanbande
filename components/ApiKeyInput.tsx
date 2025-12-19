
import React, { useState } from 'react';
import { Key, Save, Edit2, CheckCircle2 } from 'lucide-react';

interface ApiKeyInputProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ apiKey, onApiKeyChange }) => {
  const [isEditing, setIsEditing] = useState(!apiKey);
  const [inputValue, setInputValue] = useState(apiKey);

  const handleSave = () => {
    if (inputValue.trim()) {
      onApiKeyChange(inputValue.trim());
      setIsEditing(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-bold text-gray-700 flex items-center justify-between">
        <span className="flex items-center gap-2">
            <Key size={16} className="text-blue-600" /> API Key (Gemini)
        </span>
        {!isEditing && apiKey && (
            <span className="text-[10px] text-green-600 flex items-center gap-1 font-bold animate-pulse">
                <CheckCircle2 size={12} /> ĐÃ LƯU
            </span>
        )}
      </label>
      
      <div className="flex gap-2">
        <div className="relative flex-1">
            <input
                type="password"
                value={isEditing ? inputValue : "••••••••••••••••••••"}
                disabled={!isEditing}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Dán API Key..."
                className={`w-full p-3 pr-10 border rounded-xl outline-none text-sm font-mono transition-all ${
                    isEditing 
                    ? 'bg-white border-blue-200 focus:ring-2 focus:ring-blue-500 shadow-inner' 
                    : 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed'
                }`}
            />
        </div>

        {isEditing ? (
            <button
                onClick={handleSave}
                disabled={!inputValue.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm transition-all shadow-md active:scale-95 whitespace-nowrap"
            >
                <Save size={18} />
                Lưu
            </button>
        ) : (
            <button
                onClick={handleEdit}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm transition-all border border-gray-200 active:scale-95 whitespace-nowrap"
            >
                <Edit2 size={18} />
                Sửa
            </button>
        )}
      </div>
      
      <p className="text-[10px] text-gray-400 leading-tight">
        Lưu ý: API Key của bạn được lưu cục bộ trên trình duyệt để sử dụng cho lần sau.
      </p>
    </div>
  );
};
