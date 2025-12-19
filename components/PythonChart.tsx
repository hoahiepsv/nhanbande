
import React, { useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle, RefreshCw, Shapes } from 'lucide-react';

interface PythonChartProps {
  code: string;
  onImageGenerated?: (base64: string) => void;
}

declare global {
  interface Window {
    loadPyodide: any;
    pyodideInstance: any;
  }
}

export const PythonChart: React.FC<PythonChartProps> = ({ code, onImageGenerated }) => {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const executionCount = useRef(0);

  const runPython = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!window.pyodideInstance) {
        window.pyodideInstance = await window.loadPyodide();
        await window.pyodideInstance.loadPackage(['matplotlib', 'numpy']);
      }

      const fullCode = `
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
import io
import base64

plt.clf()
plt.rcParams['figure.autolayout'] = True

# Thực thi code AI
${code}

# Ép buộc ẩn lưới để hình ảnh sạch sẽ
plt.grid(False)
# Nếu AI không vẽ trục Oxy cụ thể, ẩn luôn axis
if plt.gca().get_xlabel() == "" and plt.gca().get_ylabel() == "":
    plt.axis('off')

buf = io.BytesIO()
plt.savefig(buf, format='png', bbox_inches='tight', dpi=150, transparent=False, facecolor='white')
buf.seek(0)
img_str = "data:image/png;base64," + base64.b64encode(buf.read()).decode('utf-8')
plt.close('all')
img_str
      `;

      const result = await window.pyodideInstance.runPythonAsync(fullCode);
      setImgUrl(result);
      if (onImageGenerated) onImageGenerated(result);
    } catch (err: any) {
      console.error("Python Execution Error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (executionCount.current === 0) {
      runPython();
      executionCount.current++;
    }
  }, [code, onImageGenerated]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-blue-50 rounded-2xl border border-dashed border-blue-300 w-full max-w-[500px] mx-auto animate-pulse">
        <Loader2 className="animate-spin text-blue-600 mb-2" />
        <p className="text-[10px] text-blue-500 font-black uppercase">Đang vẽ hình học phẳng...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-start gap-2 w-full max-w-[500px] mx-auto">
        <AlertCircle size={16} className="shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-bold uppercase tracking-tighter">Lỗi vẽ hình 2D:</p>
          <code className="block mt-1 whitespace-pre-wrap opacity-80">{error}</code>
          <button onClick={runPython} className="mt-2 text-blue-600 font-black hover:underline flex items-center gap-1">
            <RefreshCw size={12} /> VẼ LẠI
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group flex flex-col items-center py-4">
      <div className="text-[10px] text-blue-600 font-black mb-2 uppercase flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 shadow-sm">
        <Shapes size={12} className="fill-blue-500" /> Hình vẽ kỹ thuật
      </div>
      <div className="relative bg-white p-3 rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        {imgUrl && (
          <img 
            src={imgUrl} 
            alt="Generated Geometry" 
            className="max-w-full h-auto rounded-xl" 
          />
        )}
        <button
          onClick={runPython}
          className="absolute top-4 right-4 bg-white/90 hover:bg-white p-2.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all text-blue-600 border border-blue-50"
          title="Vẽ lại hình"
        >
          <RefreshCw size={18} />
        </button>
      </div>
      <span className="text-[9px] text-gray-400 mt-2 font-bold uppercase tracking-widest">AI Geometry System</span>
    </div>
  );
};
