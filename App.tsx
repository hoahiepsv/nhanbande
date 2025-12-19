
import React, { useState, useEffect } from 'react';
import { ModelType, UploadedFile, GeneratedExam } from './types';
import { FileUploader } from './components/FileUploader';
import { ExamPreview } from './components/ExamPreview';
import { ApiKeyInput } from './components/ApiKeyInput';
import { generateExamCopy } from './services/geminiService';
import { Zap, BrainCircuit, Copy, Loader2, Copyright, CheckCircle2, Settings } from 'lucide-react';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('GEMINI_API_KEY') || '');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [model, setModel] = useState<ModelType>(ModelType.FLASH);
  const [numCopies, setNumCopies] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedExams, setGeneratedExams] = useState<GeneratedExam[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('GEMINI_API_KEY', apiKey);
    }
  }, [apiKey]);

  const handleGenerate = async () => {
    if (files.length === 0) {
      setError("Vui lòng tải lên ít nhất một file đề gốc.");
      return;
    }
    
    const finalKey = apiKey.trim() || (process.env.API_KEY || "").trim();
    if (!finalKey) {
      setError("Vui lòng nhập và nhấn 'Lưu' API Key trước khi thực hiện.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedExams([]);

    try {
      const newExams: GeneratedExam[] = [];
      const rawFiles = files.map(f => f.file);

      for (let i = 1; i <= numCopies; i++) {
        const content = await generateExamCopy(apiKey, model, rawFiles, i);
        newExams.push({
          id: Date.now().toString() + i,
          copyNumber: i,
          content: content,
          timestamp: Date.now()
        });
      }
      setGeneratedExams(newExams);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi không xác định. Vui lòng thử lại.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 font-sans text-gray-800 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-blue-200 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-800 text-white p-2.5 rounded-lg shadow-lg">
                <Copy size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-blue-900 tracking-tight uppercase">TẠO BẢN SAO ĐỀ</h1>
              <p className="text-xs text-blue-600 font-semibold tracking-wide">CÔNG CỤ HỖ TRỢ GIÁO VIÊN TOÁN</p>
            </div>
          </div>
          <div className="text-right hidden sm:block bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
            <p className="text-sm font-bold text-blue-900">Lê Hoà Hiệp</p>
            <p className="text-xs text-blue-600 font-mono">0983.676.470</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar: Controls */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Settings Section */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
            <h2 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                <Settings size={20} className="text-blue-600" /> Cấu hình API
            </h2>
            <ApiKeyInput apiKey={apiKey} onApiKeyChange={setApiKey} />
          </section>

          {/* 1. Model Selection */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
            <h2 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                Chọn Chế độ Xử lý
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setModel(ModelType.FLASH)}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                  model === ModelType.FLASH
                    ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-md'
                    : 'border-gray-100 hover:bg-gray-50 text-gray-500'
                }`}
              >
                <Zap size={24} className={model === ModelType.FLASH ? "fill-current" : ""} />
                <span className="font-bold text-sm">Flash (Nhanh)</span>
              </button>
              <button
                onClick={() => setModel(ModelType.PRO)}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                  model === ModelType.PRO
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-md'
                    : 'border-gray-100 hover:bg-gray-50 text-gray-500'
                }`}
              >
                <BrainCircuit size={24} className={model === ModelType.PRO ? "fill-current" : ""} />
                <span className="font-bold text-sm">Pro (Thông minh)</span>
              </button>
            </div>
          </section>

          {/* 2. Upload & Settings */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
            <h2 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                Dữ liệu & Cấu hình
            </h2>
            
            <FileUploader files={files} onFilesChange={setFiles} />

            <div className="mt-6 pt-4 border-t border-gray-100">
               <label className="text-sm font-bold text-gray-700 mb-2 block">Số lượng bản sao cần tạo:</label>
               <input
                type="number"
                min="1"
                max="10"
                value={numCopies}
                onChange={(e) => setNumCopies(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full p-2 border border-blue-200 rounded-lg text-center font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none"
               />
            </div>
          </section>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || files.length === 0}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-lg text-white shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-3 ${
              isGenerating || files.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 hover:shadow-2xl ring-4 ring-blue-50'
            }`}
          >
            {isGenerating ? (
                <>
                    <Loader2 className="animate-spin" /> ĐANG XỬ LÝ...
                </>
            ) : (
                <>
                    <Zap className="fill-white" /> TẠO ĐỀ NGAY
                </>
            )}
          </button>
           {error && (
            <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200 flex items-start gap-2">
                <div className="mt-0.5">⚠️</div>
                <div>{error}</div>
            </div>
          )}
        </div>

        {/* Right Content: Preview */}
        <div className="lg:col-span-8 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
                    <CheckCircle2 className="text-green-500" /> Kết quả Preview
                </h2>
                <span className="text-sm text-gray-500 italic">Hỗ trợ LaTeX & Vẽ hình tự động</span>
            </div>

            {generatedExams.length === 0 ? (
                <div className="flex-1 min-h-[500px] bg-white border-2 border-dashed border-blue-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                    <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                        <Copy size={48} className="text-blue-200"/>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">Chưa có nội dung</h3>
                    <p className="text-sm max-w-md mx-auto">Tải file và nhấn "Tạo đề ngay" để xem bản xem trước.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {generatedExams.map((exam) => (
                        <ExamPreview
                            key={exam.id}
                            exam={exam}
                            apiKey={apiKey}
                            originalFileName={files[0]?.file.name || 'Tai_lieu_goc'}
                        />
                    ))}
                </div>
            )}
        </div>
      </main>
      
      <footer className="mt-12 text-center text-blue-900/60 text-sm pb-8 border-t border-blue-100 pt-8">
        <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-2 font-semibold">
                <Copyright size={16}/>
                <span>Thiết kế bởi Hoà Hiệp AI</span>
            </div>
            <span className="font-mono bg-blue-100 px-2 py-0.5 rounded text-blue-800 text-xs">0983.676.470</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
