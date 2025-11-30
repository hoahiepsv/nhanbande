import React from 'react';
import { LatexContent } from './LatexContent';
import { GeneratedExam } from '../types';
import { Download } from 'lucide-react';
import { generateDocx } from '../utils/wordExport';

interface ExamPreviewProps {
  exam: GeneratedExam;
  originalFileName: string;
}

export const ExamPreview: React.FC<ExamPreviewProps> = ({ exam, originalFileName }) => {
  const handleDownload = () => {
    generateDocx(exam.content, exam.copyNumber, originalFileName);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden flex flex-col h-[600px]">
      <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10">
        <h3 className="font-bold text-lg text-primary">Bản sao đề số {exam.copyNumber}</h3>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Download size={18} />
          Xuất Word
        </button>
      </div>
      <div className="p-6 overflow-y-auto flex-1 font-serif text-lg leading-relaxed space-y-4">
        {/* Render content line by line to handle paragraphs */}
        {exam.content.split('\n').map((line, index) => (
            <div key={index} className="min-h-[1em]">
                {line.trim() === '' ? <br/> : <LatexContent content={line} />}
            </div>
        ))}
      </div>
      <div className="bg-gray-100 p-2 text-center text-xs text-gray-500 border-t border-gray-200 italic">
        Create by Hoà Hiệp AI – 0983.676.470
      </div>
    </div>
  );
};