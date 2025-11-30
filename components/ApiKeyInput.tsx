import React, { useState, useEffect } from 'react';
import { Key, Save, Edit, Eye, EyeOff } from 'lucide-react';

interface ApiKeyInputProps {
  onKeyChange: (key: string) => void;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onKeyChange }) => {
  const [key, setKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setKey(savedKey);
      setIsSaved(true);
      onKeyChange(savedKey);
    }
  }, [onKeyChange]);

  const handleSave = () => {
    if (key.trim()) {
      localStorage.setItem('gemini_api_key', key);
      setIsSaved(true);
      onKeyChange(key);
    }
  };

  const handleEdit = () => {
    setIsSaved(false);
  };

  if (isSaved) {
    return (
      <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
        <Key size={16} />
        <span className="font-semibold">API Key đã được lưu</span>
        <button
          onClick={handleEdit}
          className="ml-auto flex items-center gap-1 text-blue-600 hover:text-blue-800 underline text-xs"
        >
          <Edit size={14} /> Chỉnh sửa
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <Key size={16} className="text-primary" />
        Nhập Google Gemini API Key
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={isVisible ? "text" : "password"}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="w-full p-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="AIzaSy..."
          />
          <button
            type="button"
            onClick={() => setIsVisible(!isVisible)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={!key.trim()}
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2 transition-colors"
        >
          <Save size={16} /> Lưu
        </button>
      </div>
      <p className="text-xs text-gray-500">Key sẽ được lưu vào trình duyệt của bạn.</p>
    </div>
  );
};
