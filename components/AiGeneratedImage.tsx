
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Loader2, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';

interface AiGeneratedImageProps {
  prompt: string;
  apiKey?: string;
  onImageGenerated?: (base64: string) => void;
}

export const AiGeneratedImage: React.FC<AiGeneratedImageProps> = ({ prompt, apiKey, onImageGenerated }) => {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const requestCount = useRef(0);

  const generateImage = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const finalApiKey = (apiKey || "").trim() || (process.env.API_KEY || "").trim();
      if (!finalApiKey) throw new Error("Chưa có API Key để tạo ảnh.");

      const ai = new GoogleGenAI({ apiKey: finalApiKey });
      
      // Bổ sung các từ khóa tối ưu cho việc minh họa giáo dục nếu AI chưa thêm vào
      const enhancedPrompt = prompt.toLowerCase().includes('white background') 
        ? prompt 
        : `${prompt}, black lines, white background, 3D mathematical illustration, clear labels, professional diagram`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ parts: [{ text: enhancedPrompt }] }],
        config: {
          imageConfig: { aspectRatio: "1:1" }
        }
      });

      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (part?.inlineData) {
        const b64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        setImgUrl(b64);
        if (onImageGenerated) onImageGenerated(b64);
      } else {
        throw new Error("Không nhận được dữ liệu hình ảnh từ AI.");
      }
    } catch (err: any) {
      console.error("AI Image Generation Error:", err);
      setError(err.message);
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
      <div className="flex flex-col items-center justify-center p-8 bg-indigo-50 rounded-xl border border-dashed border-indigo-300 w-full max-w-[400px] mx-auto">
        <Sparkles className="animate-pulse text-indigo-600 mb-2" />
        <p className="text-[10px] text-indigo-500 font-medium uppercase tracking-wider">AI đang vẽ hình theo đề bài...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 bg-orange-50 text-orange-700 rounded-lg text-xs flex items-center gap-2 border border-orange-200 w-full max-w-[400px] mx-auto">
        <AlertCircle size={14} />
        <div className="flex-1">
          <span>{error}</span>
          <button onClick={generateImage} className="ml-2 font-bold underline">Thử lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group flex flex-col items-center">
       <div className="text-[10px] text-indigo-500 font-bold mb-2 uppercase flex items-center gap-1">
        <Sparkles size={12} /> Hình khối 3D minh họa
      </div>
      <div className="relative">
        {imgUrl && (
          <img 
            src={imgUrl} 
            alt="AI Generated Illustration" 
            className="max-w-full w-[400px] h-auto rounded-2xl shadow-xl border border-indigo-100" 
          />
        )}
        <button
          onClick={generateImage}
          className="absolute top-3 right-3 bg-white/90 hover:bg-white p-2.5 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-all text-indigo-600 border border-indigo-50 transform hover:scale-110 active:rotate-180"
          title="Yêu cầu AI vẽ lại hình mới"
        >
          <RefreshCw size={20} />
        </button>
      </div>
      <span className="text-[10px] text-gray-400 italic mt-2">Được tạo dựa trên thông số đề bài</span>
    </div>
  );
};
