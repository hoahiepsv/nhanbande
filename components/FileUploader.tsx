import React from 'react';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { UploadedFile } from '../types';

interface FileUploaderProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ files, onFilesChange }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files) as File[];
      const newFiles: UploadedFile[] = fileList.map((file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      }));
      onFilesChange([...files, ...newFiles]);
    }
    // Reset input value to allow selecting the same file again if needed
    e.target.value = '';
  };

  const removeFile = (id: string) => {
    onFilesChange(files.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 bg-blue-50 text-center hover:bg-blue-100 transition-colors relative">
        <input
          type="file"
          multiple
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center gap-2 text-blue-800">
          <Upload size={32} />
          <span className="font-semibold">Tải lên đề gốc (Ảnh hoặc PDF)</span>
          <span className="text-sm text-blue-600">Nhấn hoặc kéo thả file vào đây</span>
        </div>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {files.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded">
                {item.file.type.startsWith('image/') ? (
                   item.previewUrl ? <img src={item.previewUrl} alt="preview" className="w-full h-full object-cover rounded" /> : <ImageIcon size={20} className="text-gray-500" />
                ) : (
                  <FileText size={20} className="text-red-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.file.name}</p>
                <p className="text-xs text-gray-500">{(item.file.size / 1024).toFixed(0)} KB</p>
              </div>
              <button
                onClick={() => removeFile(item.id)}
                className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};