
import React, { useState, useCallback } from 'react';
import { ModelType, UploadedFile, GeneratedExam } from './types';
import { FileUploader } from './components/FileUploader';
import { ExamPreview } from './components/ExamPreview';
import { ApiKeyInput } from './components/ApiKeyInput';
import { generateExamCopy } from './services/geminiService';
import { Zap, BrainCircuit, Copy, Loader2, Copyright, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [model, setModel] = useState<ModelType>(ModelType.FLASH);
  const [numCopies, setNumCopies] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedExams, setGeneratedExams] = useState<GeneratedExam[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [customApiKey, setCustomApiKey] = useState<string>('');

  const handleKeyChange = useCallback((key: string) => {
    setCustomApiKey(key);
  }, []);

  const handleGenerate = async () => {
    if (files.length === 0) {
      setError("Vui lòng tải lên ít nhất một file đề gốc để bắt đầu.");
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setGeneratedExams([]);

    try {
      const newExams: GeneratedExam[] = [];
      const rawFiles = files.map(f => f.file);

      for (let i = 1; i <= numCopies; i++) {
        const content = await generateExamCopy(model, rawFiles, i, customApiKey);
        newExams.push({
          id: Date.now().toString() + i,
          copyNumber: i,
          content: content,
          timestamp: Date.now()
        });
      }
      setGeneratedExams(newExams);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi không xác định. Vui lòng kiểm tra lại tệp tin.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-16">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-blue-700 text-white p-3.5 rounded-[1.25rem] shadow-lg relative transform -rotate-3">
                <Copy size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">TẠO BẢN SAO ĐỀ</h1>
              <p className="text-[10px] text-blue-600 font-bold tracking-[0.25em] flex items-center gap-1 mt-1.5 uppercase">
                Giải pháp AI Toán học chuyên nghiệp
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-700 tracking-tight">
                   Create by Hoà Hiệp AI – 0983.676.470
                </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-8">
          {/* Quản lý API Key */}
          <ApiKeyInput onKeyChange={handleKeyChange} />

          <section className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-200">
            <h2 className="text-sm font-black text-slate-400 mb-5 flex items-center gap-2 uppercase tracking-widest">
                <ShieldCheck size={18} className="text-blue-600" /> Trạng thái hệ thống
            </h2>
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
               <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
               <div>
                  <p className="text-xs font-black text-emerald-800 uppercase">AI Đã Sẵn Sàng</p>
                  <p className="text-[10px] text-emerald-600 font-medium">
                    {customApiKey ? "Sử dụng API Key cá nhân" : "Sử dụng API Key hệ thống"}
                  </p>
               </div>
            </div>
          </section>

          <section className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-200">
            <h2 className="text-sm font-black text-slate-400 mb-5 flex items-center gap-2 uppercase tracking-widest">
                <span className="bg-slate-900 text-white w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black">1</span>
                Chế độ xử lý
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setModel(ModelType.FLASH)}
                className={`p-5 rounded-3xl border-2 flex flex-col items-center gap-2 transition-all group ${
                  model === ModelType.FLASH
                    ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xl ring-4 ring-blue-50'
                    : 'border-slate-100 hover:bg-slate-50 text-slate-400 hover:border-slate-200'
                }`}
              >
                <Zap size={24} className={model === ModelType.FLASH ? "fill-current text-blue-600" : "group-hover:text-slate-600 transition-colors"} />
                <span className="font-black text-[10px] uppercase tracking-tighter">Gemini Flash</span>
              </button>
              <button
                onClick={() => setModel(ModelType.PRO)}
                className={`p-5 rounded-3xl border-2 flex flex-col items-center gap-2 transition-all group ${
                  model === ModelType.PRO
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-xl ring-4 ring-indigo-50'
                    : 'border-slate-100 hover:bg-slate-50 text-slate-400 hover:border-slate-200'
                }`}
              >
                <BrainCircuit size={24} className={model === ModelType.PRO ? "fill-current text-indigo-600" : "group-hover:text-slate-600 transition-colors"} />
                <span className="font-black text-[10px] uppercase tracking-tighter">Gemini Pro</span>
              </button>
            </div>
          </section>

          <section className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-200">
            <h2 className="text-sm font-black text-slate-400 mb-5 flex items-center gap-2 uppercase tracking-widest">
                <span className="bg-slate-900 text-white w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black">2</span>
                Tải đề gốc
            </h2>
            <FileUploader files={files} onFilesChange={setFiles} />
            <div className="mt-8 pt-6 border-t border-slate-100">
               <label className="text-[10px] font-black text-slate-500 mb-3 block uppercase tracking-[0.2em]">Số lượng bản sao cần tạo:</label>
               <div className="flex items-center gap-4">
                 <input
                  type="number"
                  min="1"
                  max="10"
                  value={numCopies}
                  onChange={(e) => setNumCopies(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full p-4 border-2 border-slate-100 rounded-2xl text-center font-black text-slate-900 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-2xl shadow-inner bg-slate-50"
                 />
               </div>
            </div>
          </section>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || files.length === 0}
            className={`w-full py-6 px-8 rounded-[2rem] font-black text-lg text-white shadow-2xl transition-all transform active:scale-95 flex items-center justify-center gap-4 ${
              isGenerating || files.length === 0
                ? 'bg-slate-300 cursor-not-allowed opacity-60'
                : 'bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 hover:shadow-blue-300 ring-8 ring-blue-50'
            }`}
          >
            {isGenerating ? (
                <>
                    <Loader2 className="animate-spin" /> ĐANG XỬ LÝ...
                </>
            ) : (
                <>
                    <Zap className="fill-white" size={24} /> BẮT ĐẦU TẠO ĐỀ
                </>
            )}
          </button>
           {error && (
            <div className="p-5 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-100 flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={18} className="shrink-0" />
                <div className="leading-relaxed font-medium">{error}</div>
            </div>
          )}
        </div>

        <div className="lg:col-span-8 flex flex-col">
            <div className="flex items-center justify-between mb-8 px-4">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 tracking-tighter">
                    <CheckCircle2 className="text-blue-600" size={32} /> KẾT QUẢ BIÊN SOẠN
                </h2>
                <div className="bg-white border border-slate-200 px-4 py-2 rounded-full flex items-center gap-2 shadow-sm">
                   <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                   <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Dữ liệu bảo mật</span>
                </div>
            </div>

            {generatedExams.length === 0 ? (
                <div className="flex-1 min-h-[600px] bg-white border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-slate-300 p-16 text-center shadow-inner group">
                    <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-slate-100 group-hover:scale-110 transition-transform duration-500">
                        <Copy size={56} className="text-slate-200"/>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tighter uppercase">Hệ thống đang chờ</h3>
                    <p className="text-sm max-w-sm mx-auto text-slate-400 leading-relaxed font-medium">Tải lên tệp tin và cài đặt số lượng bản sao để AI bắt đầu biên soạn nội dung mới.</p>
                </div>
            ) : (
                <div className="space-y-16">
                    {generatedExams.map((exam) => (
                        <ExamPreview
                            key={exam.id}
                            exam={exam}
                            originalFileName={files[0]?.file.name || 'De_thi_goc'}
                            model={model}
                            apiKey={customApiKey}
                        />
                    ))}
                </div>
            )}
        </div>
      </main>
      
      <footer className="mt-24 text-center pb-16 border-t border-slate-200 pt-12">
        <div className="flex flex-col items-center justify-center gap-6">
            <div className="flex items-center gap-3 font-black uppercase tracking-[0.2em] text-slate-400 text-[10px]">
                <Copyright size={14} className="text-slate-300"/>
                <span>Create by Hoà Hiệp AI – 0983.676.470</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <span className="font-mono bg-blue-600 px-5 py-2 rounded-2xl text-white font-black text-[10px] tracking-tighter shadow-lg shadow-blue-200">POWERED BY GEMINI 2.5</span>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
