
import React, { useState, useCallback, useMemo } from 'react';
import { LatexContent } from './LatexContent';
import { GeneratedExam } from '../types';
import { Download, Box, Shapes } from 'lucide-react';
import { generateDocx } from '../utils/wordExport';
import { PythonChart } from './PythonChart';
import { AiGeneratedImage } from './AiGeneratedImage';

interface ExamPreviewProps {
  exam: GeneratedExam;
  apiKey: string;
  originalFileName: string;
}

export const ExamPreview: React.FC<ExamPreviewProps> = ({ exam, apiKey, originalFileName }) => {
  const [mediaStorage, setMediaStorage] = useState<Record<number, string>>({});

  const handleMediaGenerated = useCallback((index: number, base64: string) => {
    setMediaStorage(prev => ({ ...prev, [index]: base64 }));
  }, []);

  const handleDownload = () => {
    generateDocx(exam.content, exam.copyNumber, originalFileName, mediaStorage);
  };

  const renderedElements = useMemo(() => {
    const content = exam.content;
    const elements: React.ReactNode[] = [];
    
    // Cải tiến Regex để bắt block linh hoạt hơn, bao gồm cả các trường hợp AI quên thẻ đóng ở cuối văn bản
    const parts = content.split(/(\[\[GEOMETRY_CODE\]\][\s\S]*?\[\[\/GEOMETRY_CODE\]\]|\[\[AI_IMAGE_PROMPT\]\][\s\S]*?\[\[\/AI_IMAGE_PROMPT\]\]|```[\s\S]*?```)/g);

    parts.forEach((part, index) => {
      if (!part) return;

      const trimmedPart = part.trim();

      if (trimmedPart.startsWith('[[GEOMETRY_CODE]]')) {
        const code = trimmedPart
          .replace('[[GEOMETRY_CODE]]', '')
          .replace('[[/GEOMETRY_CODE]]', '')
          .trim();
        elements.push(
          <div key={index} className="my-8 flex flex-col items-center">
            <PythonChart code={code} onImageGenerated={(b64) => handleMediaGenerated(index, b64)} />
          </div>
        );
      } 
      else if (trimmedPart.startsWith('[[AI_IMAGE_PROMPT]]')) {
        const prompt = trimmedPart
          .replace('[[AI_IMAGE_PROMPT]]', '')
          .replace('[[/AI_IMAGE_PROMPT]]', '')
          .replace(/^"|"$/g, '') // Xóa dấu ngoặc kép thừa nếu có
          .trim();
        elements.push(
          <div key={index} className="my-8">
            <AiGeneratedImage 
              prompt={prompt} 
              apiKey={apiKey}
              onImageGenerated={(b64) => handleMediaGenerated(index, b64)} 
            />
          </div>
        );
      }
      else if (trimmedPart.startsWith('```')) {
        const code = trimmedPart.replace(/```(python)?/g, '').replace(/```/g, '').trim();
        if (trimmedPart.includes('python')) {
           elements.push(
            <div key={index} className="my-8 flex flex-col items-center">
              <PythonChart code={code} onImageGenerated={(b64) => handleMediaGenerated(index, b64)} />
            </div>
          );
        } else {
          elements.push(
            <pre key={index} className="bg-gray-50 p-4 rounded-xl text-xs overflow-x-auto my-4 border border-gray-200 font-mono text-gray-700">
              <code>{code}</code>
            </pre>
          );
        }
      }
      else {
        const lines = part.split('\n');
        let i = 0;
        while (i < lines.length) {
          const line = lines[i];
          const trimmedLine = line.trim();
          
          if (trimmedLine.includes(':::')) {
            const rows = [];
            while (i < lines.length && lines[i].trim().includes(':::')) {
              rows.push(lines[i].trim().split(':::').map(c => c.trim()));
              i++;
            }
            elements.push(
              <div key={`table-${index}-${i}`} className="my-6 overflow-x-auto shadow-sm rounded-lg border border-gray-200">
                <table className="w-full border-collapse bg-white table-fixed">
                  <tbody className="divide-y divide-gray-200">
                    {rows.map((row, rIdx) => (
                      <tr key={rIdx} className="divide-x divide-gray-200 hover:bg-gray-50 transition-colors">
                        {row.map((c, ci) => (
                          <td key={ci} className="p-4 text-center align-middle">
                            <LatexContent content={c} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          } else if (trimmedLine === "") {
            elements.push(<div key={`empty-${index}-${i}`} className="h-4"></div>);
            i++;
          } else {
            const isHeader = (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 5 && trimmedLine.length < 120) || trimmedLine.includes('SỞ GD&ĐT') || trimmedLine.includes('ĐỀ SỐ');
            elements.push(
              <div key={`text-${index}-${i}`} className={`mb-3 ${isHeader ? 'text-center font-bold text-blue-900 uppercase tracking-wide' : 'text-justify'}`}>
                <LatexContent content={line} />
              </div>
            );
            i++;
          }
        }
      }
    });

    return elements;
  }, [exam.content, apiKey, handleMediaGenerated]);

  return (
    <div className="bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[850px] transition-all hover:shadow-blue-200/50">
      <div className="bg-gradient-to-r from-blue-800 to-indigo-900 p-6 flex justify-between items-center sticky top-0 z-20 text-white shadow-lg">
        <div className="flex flex-col">
            <h3 className="font-black text-xl flex items-center gap-2">
                <Box size={24} className="text-blue-300" /> BẢN SAO SỐ {exam.copyNumber}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] bg-blue-700/50 px-2 py-0.5 rounded-full border border-blue-500/30 font-mono">
                {exam.id.slice(-6)}
              </span>
              <span className="text-[10px] text-blue-200 italic flex items-center gap-1">
                <Shapes size={10} /> Xử lý LaTeX & Hình ảnh AI
              </span>
            </div>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 bg-white text-blue-900 px-6 py-3 rounded-2xl hover:bg-blue-50 active:scale-95 transition-all shadow-xl font-black text-sm uppercase tracking-wider"
        >
          <Download size={20} />
          Xuất Word
        </button>
      </div>
      <div className="p-12 overflow-y-auto flex-1 font-serif text-[19px] leading-[1.7] bg-white text-gray-900 selection:bg-blue-100">
        <div className="max-w-[850px] mx-auto">
            {renderedElements}
        </div>
      </div>
      <div className="bg-gray-50 p-4 text-center border-t border-gray-100 flex flex-col gap-1">
        <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">Thiết kế bởi Hoà Hiệp AI | 0983.676.470</div>
      </div>
    </div>
  );
};
