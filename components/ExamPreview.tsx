
import React, { useState, useCallback, useMemo } from 'react';
import { LatexContent } from './LatexContent';
import { GeneratedExam, ModelType } from '../types';
import { Download, Box, Shapes, Table as TableIcon, Lightbulb, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { generateDocx } from '../utils/wordExport';
import { PythonChart } from './PythonChart';
import { AiGeneratedImage } from './AiGeneratedImage';
import { solveExam } from '../services/geminiService';

interface ExamPreviewProps {
  exam: GeneratedExam;
  originalFileName: string;
  model: ModelType;
  apiKey?: string;
}

export const ExamPreview: React.FC<ExamPreviewProps> = ({ exam, originalFileName, model, apiKey }) => {
  const [examMedia, setExamMedia] = useState<Record<number, string>>({});
  const [solutionMedia, setSolutionMedia] = useState<Record<number, string>>({});
  const [solution, setSolution] = useState<string | null>(null);
  const [isSolving, setIsSolving] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const handleExamMediaGenerated = useCallback((index: number, base64: string) => {
    setExamMedia(prev => ({ ...prev, [index]: base64 }));
  }, []);

  const handleSolutionMediaGenerated = useCallback((index: number, base64: string) => {
    setSolutionMedia(prev => ({ ...prev, [index]: base64 }));
  }, []);

  const handleDownload = () => {
    generateDocx(
      exam.content, 
      exam.copyNumber, 
      originalFileName, 
      examMedia, 
      solution || undefined, 
      solutionMedia
    );
  };

  const handleSolve = async () => {
    if (solution) {
      setShowSolution(!showSolution);
      return;
    }
    
    setIsSolving(true);
    try {
      const result = await solveExam(exam.content, model, apiKey);
      setSolution(result);
      setShowSolution(true);
    } catch (err: any) {
      alert("Không thể giải đề: " + err.message);
    } finally {
      setIsSolving(false);
    }
  };

  const renderContent = (content: string, baseId: string, mediaHandler: (index: number, b64: string) => void) => {
    const elements: React.ReactNode[] = [];
    const parts = content.split(/(\[\[GEOMETRY_CODE\]\][\s\S]*?\[\[\/GEOMETRY_CODE\]\]|\[\[AI_IMAGE_PROMPT\]\][\s\S]*?\[\[\/AI_IMAGE_PROMPT\]\]|```[\s\S]*?```)/g);

    parts.forEach((part, index) => {
      if (!part) return;
      const trimmedPart = part.trim();
      const uniqueKey = `${baseId}-${index}`;

      if (trimmedPart.startsWith('[[GEOMETRY_CODE]]')) {
        const code = trimmedPart.replace('[[GEOMETRY_CODE]]', '').replace('[[/GEOMETRY_CODE]]', '').trim();
        elements.push(
          <div key={uniqueKey} className="my-8 flex flex-col items-center">
            <PythonChart code={code} onImageGenerated={(b64) => mediaHandler(index, b64)} />
          </div>
        );
      } 
      else if (trimmedPart.startsWith('[[AI_IMAGE_PROMPT]]')) {
        const prompt = trimmedPart.replace('[[AI_IMAGE_PROMPT]]', '').replace('[[/AI_IMAGE_PROMPT]]', '').replace(/^"|"$/g, '').trim();
        elements.push(
          <div key={uniqueKey} className="my-8">
            <AiGeneratedImage prompt={prompt} onImageGenerated={(b64) => mediaHandler(index, b64)} />
          </div>
        );
      }
      else if (trimmedPart.startsWith('```')) {
        const code = trimmedPart.replace(/```(python)?/g, '').replace(/```/g, '').trim();
        if (trimmedPart.includes('python')) {
           elements.push(
            <div key={uniqueKey} className="my-8 flex flex-col items-center">
              <PythonChart code={code} onImageGenerated={(b64) => mediaHandler(index, b64)} />
            </div>
          );
        } else {
          elements.push(
            <pre key={uniqueKey} className="bg-gray-50 p-4 rounded-xl text-xs overflow-x-auto my-4 border border-gray-200 font-mono text-gray-700">
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
                <div key={`${uniqueKey}-table-${i}`} className="my-8 overflow-x-auto">
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
                        <tr key={rIdx} className="hover:bg-blue-50/30">
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
              );
            }
          } else if (trimmedLine === "") {
            elements.push(<div key={`${uniqueKey}-empty-${i}`} className="h-4"></div>);
            i++;
          } else {
            const isHeader = (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 5 && trimmedLine.length < 120) || 
                             trimmedLine.includes('SỞ GD&ĐT') || trimmedLine.includes('ĐỀ SỐ') || trimmedLine.includes('KỲ THI');
            elements.push(
              <div key={`${uniqueKey}-text-${i}`} className={`mb-4 ${isHeader ? 'text-center font-bold text-black uppercase tracking-tight' : 'text-justify'}`}>
                <LatexContent content={line} />
              </div>
            );
            i++;
          }
        }
      }
    });
    return elements;
  };

  const renderedExam = useMemo(() => renderContent(exam.content, `exam-${exam.id}`, handleExamMediaGenerated), [exam.content, exam.id, handleExamMediaGenerated]);
  const renderedSolution = useMemo(() => solution ? renderContent(solution, `sol-${exam.id}`, handleSolutionMediaGenerated) : null, [solution, exam.id, handleSolutionMediaGenerated]);

  return (
    <div className="bg-white border border-gray-300 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col transition-all hover:shadow-blue-300/30">
      <div className="bg-slate-900 p-6 flex flex-wrap justify-between items-center sticky top-0 z-20 text-white border-b border-slate-700 gap-4">
        <div className="flex flex-col">
            <h3 className="font-black text-xl flex items-center gap-2 tracking-tighter uppercase">
                BẢN SAO ĐỀ SỐ {exam.copyNumber}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700 font-mono text-blue-400">
                REF: {exam.id.slice(-6).toUpperCase()}
              </span>
            </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSolve}
            disabled={isSolving}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all shadow-lg font-black text-sm uppercase tracking-widest border border-emerald-400/30 ${
              isSolving 
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                : 'bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95'
            }`}
          >
            {isSolving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Lightbulb size={18} />
            )}
            {solution ? (showSolution ? 'ẨN LỜI GIẢI' : 'XEM LỜI GIẢI') : 'GIẢI ĐỀ'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-500 active:scale-95 transition-all shadow-lg font-black text-sm uppercase tracking-widest border border-blue-400"
          >
            <Download size={18} />
            XUẤT FILE WORD
          </button>
        </div>
      </div>
      
      <div className="flex-1 font-serif text-[18px] leading-[1.8] bg-white text-black selection:bg-blue-100 preview-content">
        <div className="p-16 max-w-[800px] mx-auto print-area">
            {renderedExam}
        </div>

        {/* LỜI GIẢI SECTION */}
        {showSolution && solution && (
          <div className="border-t-8 border-emerald-100 bg-emerald-50/30 animate-in slide-in-from-top-4 duration-500">
             <div className="max-w-[800px] mx-auto p-16">
                <div className="flex items-center gap-3 mb-10 border-b-2 border-emerald-200 pb-4">
                   <div className="bg-emerald-600 text-white p-2 rounded-lg">
                      <Lightbulb size={24} />
                   </div>
                   <h4 className="text-2xl font-black text-emerald-900 tracking-tighter uppercase">LỜI GIẢI CHI TIẾT VÀ HÌNH VẼ</h4>
                </div>
                <div className="text-slate-800">
                   {renderedSolution}
                </div>
             </div>
          </div>
        )}
      </div>

      <div className="bg-slate-50 p-4 text-center border-t border-gray-200 flex items-center justify-center gap-4">
        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
          <span>Create by Hoà Hiệp AI – 0983.676.470</span>
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
