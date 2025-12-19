
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Loader2, AlertCircle, Sparkles, RefreshCw, Clock } from 'lucide-react';

interface AiGeneratedImageProps {
  prompt: string;
  onImageGenerated?: (base64: string) => void;
}

export const AiGeneratedImage: React.FC<AiGeneratedImageProps> = ({ prompt, onImageGenerated }) => {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; isQuota: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const requestCount = useRef(0);

  const generateImage = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const enhancedPrompt = prompt.toLowerCase().includes('white background') 
        ? prompt 
        : `${prompt}, professional 3D mathematical diagram, black lines, white background, educational illustration, high contrast, clear geometric depth, soft shading`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ parts: [{ text: enhancedPrompt }] }],
        config: {
          imageConfig: { aspectRatio: "1:1" }
        }
      });

      let foundImage = false;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const b64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            setImgUrl(b64);
            if (onImageGenerated) onImageGenerated(b64);
            foundImage = true;
            break;
          }
        }
      }

      if (!foundImage) {
        throw new Error("AI không trả về dữ liệu hình ảnh.");
      }
    } catch (err: any) {
      console.error("AI Image Generation Error:", err);
      const isQuota = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED');
      
      setError({
        message: isQuota 
          ? "Bạn đã hết lượt dùng thử miễn phí trong phút này. Vui lòng đợi khoảng 30-60 giây rồi nhấn 'Thử lại'."
          : "Lỗi tạo hình ảnh: " + (err.message || "Không xác định"),
        isQuota
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (requestCount.current === 0 && prompt) {
      generateImage();
      requestCount.current++;
    }
  }, [prompt]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-indigo-50 rounded-2xl border border-dashed border-indigo-300 w-full max-w-[400px] mx-auto transition-all animate-in fade-in zoom-in duration-300">
        <div className="relative">
          <Sparkles className="animate-pulse text-indigo-600 mb-2" size={32} />
          <Loader2 className="absolute -top-1 -right-1 animate-spin text-indigo-400" size={16} />
        </div>
        <p className="text-[11px] text-indigo-600 font-black uppercase tracking-widest mt-2">AI đang vẽ hình trực quan...</p>
        <p className="text-[9px] text-indigo-400 mt-1 italic">Vui lòng đợi trong giây lát</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-5 rounded-2xl text-xs border w-full max-w-[400px] mx-auto shadow-sm transition-all ${error.isQuota ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
        <div className="flex items-start gap-3">
          {error.isQuota ? <Clock className="shrink-0 mt-0.5" size={18} /> : <AlertCircle className="shrink-0 mt-0.5" size={18} />}
          <div className="flex-1">
            <p className="font-bold mb-1 uppercase tracking-tight">{error.isQuota ? "Giới hạn lượt dùng" : "Cảnh báo lỗi"}</p>
            <p className="leading-relaxed opacity-90">{error.message}</p>
            <button 
              onClick={generateImage} 
              className={`mt-3 px-4 py-2 rounded-xl font-black flex items-center gap-2 transition-all active:scale-95 ${error.isQuota ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-red-600 text-white hover:bg-red-700'}`}
            >
              <RefreshCw size={14} /> THỬ LẠI NGAY
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="text-[10px] text-indigo-600 font-black mb-3 uppercase flex items-center gap-1.5 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 shadow-sm">
        <Sparkles size={12} className="fill-indigo-500" /> Hình minh họa trực quan
      </div>
      <div className="relative group">
        {imgUrl && (
          <img 
            src={imgUrl} 
            alt="AI Generated Illustration" 
            className="max-w-full w-[400px] h-auto rounded-[2rem] shadow-2xl border-4 border-white ring-1 ring-indigo-100 transition-transform group-hover:scale-[1.02] duration-300" 
          />
        )}
        <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
        <button
          onClick={generateImage}
          className="absolute bottom-4 right-4 bg-white/95 hover:bg-white p-3 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all text-indigo-600 border border-indigo-50 transform hover:scale-110 active:rotate-180"
          title="Yêu cầu AI vẽ lại"
        >
          <RefreshCw size={22} />
        </button>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span className="text-[9px] text-gray-400 font-bold tracking-widest uppercase">AI Illustration System</span>
      </div>
    </div>
  );
};
