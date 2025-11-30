import React from 'react';
import katex from 'katex';

interface LatexContentProps {
  content: string;
}

export const LatexContent: React.FC<LatexContentProps> = ({ content }) => {
  // Split content by LaTeX delimiters ($...$ or $$...$$)
  // This regex captures the delimiters to preserve them for identifying math parts
  const parts = content.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);

  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          // Display Mode
          const math = part.slice(2, -2);
          try {
             const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
             return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
          } catch (e) {
             return <code key={index} className="text-red-500 text-xs">{part}</code>;
          }
        } else if (part.startsWith('$') && part.endsWith('$')) {
          // Inline Mode
          const math = part.slice(1, -1);
          try {
             const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
             return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
          } catch (e) {
             return <code key={index} className="text-red-500 text-xs">{part}</code>;
          }
        } else {
          // Plain Text
          return <span key={index}>{part}</span>;
        }
      })}
    </span>
  );
};
