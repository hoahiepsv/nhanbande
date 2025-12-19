
import React, { useState, useCallback, useMemo } from 'react';
import { LatexContent } from './LatexContent';
import { GeneratedExam } from '../types';
import { Download, Box, Shapes, Table as TableIcon } from 'lucide-react';
import { generateDocx } from '../utils/wordExport';
import { PythonChart } from './PythonChart';
import { AiGeneratedImage } from './AiGeneratedImage';

interface ExamPreviewProps {
  exam: GeneratedExam;
  originalFileName: string;
}

export const ExamPreview: React.FC<ExamPreviewProps> = ({ exam, originalFileName }) => {
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
          .replace(/^"|"$/g, '')
          .trim();
        elements.push(
          <div key={index} className="my-8">
            <AiGeneratedImage 
              prompt={prompt} 
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
            const rows: string[][] = [];
            while (i < lines.length && lines[i].trim().includes(':::')) {
              rows.push(lines[i].trim().split(':::').map(c => c.trim()).filter(c => c !== ""));
              i++;
            }
            if (rows.length > 0) {
              elements.push(
                <div key={`table-${index}-${i}`} className="my-8 overflow-x-auto">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full border-collapse border-2 border-gray-800 bg-white">
                      <thead>
                        <tr className="bg-gray-50">
                           {rows[0].map((cell, cIdx) => (
                             <th key={cIdx} className="border border-gray-800 p-3 text-center font-bold">
                               <LatexContent content={cell} />
                             </th>
                           ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {rows.slice(1).map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-blue-50/30 transition-colors">
                            {row.map((cell, ci) => (
                              <td key={ci} className="border border-gray-800 p-3 text-center align-middle">
                                <LatexContent content={cell} />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }
          } else if (trimmedLine === "") {
            elements.push(<div key={`empty-${index}-${i}`} className="h-6"></div>);
            i++;
          } else {
            const isHeader = (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 5 && trimmedLine.length < 120) || 
                             trimmedLine.includes('SỞ GD&ĐT') || 
                             trimmedLine.includes('ĐỀ SỐ') ||
                             trimmedLine.includes('KỲ THI');
            elements.push(
              <div key={`text-${index}-${i}`} className={`mb-4 ${isHeader ? 'text-center font-bold text-black uppercase tracking-tight' : 'text-justify'}`}>
                <LatexContent content={line} />
              </div>
            );
            i++;
          }
        }
      }
    });

    return elements;
  }, [exam.content, handleMediaGenerated]);

  return (
    <div className="bg-white border border-gray-300 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-[900px] transition-all hover:shadow-blue-300/30">
      <div className="bg-slate-900 p-6 flex justify-between items-center sticky top-0 z-20 text-white border-b border-slate-700">
        <div className="flex flex-col">
            <h3 className="font-black text-xl flex items-center gap-2 tracking-tighter uppercase">
                BẢN SAO ĐỀ SỐ {exam.copyNumber}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700 font-mono text-blue-400">
                REF: {exam.id.slice(-6).toUpperCase()}
              </span>
              <span className="text-[10px] text-slate-400 italic flex items-center gap-1">
                <Shapes size={10} /> Định dạng MathType Ready
              </span>
            </div>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-500 active:scale-95 transition-all shadow-lg font-black text-sm uppercase tracking-widest border border-blue-400"
        >
          <Download size={18} />
          XUẤT FILE WORD
        </button>
      </div>
      
      <div className="p-16 overflow-y-auto flex-1 font-serif text-[18px] leading-[1.8] bg-white text-black selection:bg-blue-100 preview-content">
        <div className="max-w-[800px] mx-auto print-area">
            {renderedElements}
        </div>
      </div>

      <div className="bg-slate-50 p-4 text-center border-t border-gray-200 flex items-center justify-center gap-4">
        <div className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] flex items-center gap-2">
          <span>Hệ thống biên soạn đề thi AI</span>
          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
          <span>Phát triển 2024</span>
        </div>
      </div>

      <style>{`
        .preview-content {
          font-family: "Times New Roman", Times, serif;
        }
        .print-area table {
          border-collapse: collapse;
          width: 100%;
        }
        .print-area td, .print-area th {
          border: 1px solid black;
        }
      `}</style>
    </div>
  );
};
