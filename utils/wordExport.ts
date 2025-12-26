
import { Document, Packer, Paragraph, TextRun, Footer, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ImageRun, PageBreak } from "docx";
import * as FileSaver from "file-saver";

const FONT_FAMILY = "Times New Roman";
const FONT_SIZE = 26; // 13pt
const COLOR_BLACK = "000000";

const base64ToUint8Array = (base64: string): Uint8Array => {
  try {
    if (!base64) return new Uint8Array(0);
    const base64Content = base64.includes(',') ? base64.split(',')[1] : base64;
    const binaryString = window.atob(base64Content);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.error("Base64 conversion error:", e);
    return new Uint8Array(0);
  }
};

const processContentToElements = (content: string, mediaStorage: Record<number, string>): (Paragraph | Table)[] => {
  const elements: (Paragraph | Table)[] = [];
  const parts = content.split(/(\[\[GEOMETRY_CODE\]\][\s\S]*?\[\[\/GEOMETRY_CODE\]\]|\[\[AI_IMAGE_PROMPT\]\][\s\S]*?\[\[\/AI_IMAGE_PROMPT\]\]|```[\s\S]*?```)/g);

  parts.forEach((part, index) => {
    if (!part) return;

    if (part.startsWith('[[GEOMETRY_CODE]]') || part.startsWith('[[AI_IMAGE_PROMPT]]') || (part.startsWith('```') && part.includes('python'))) {
      const imgData = base64ToUint8Array(mediaStorage[index]);
      if (imgData.length > 0) {
        elements.push(new Paragraph({
          children: [
            new ImageRun({
              data: imgData,
              transformation: { width: 450, height: 320 },
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 400 }
        }));
      }
    } else if (part.startsWith('```')) {
      if (!part.includes('python')) {
        const code = part.replace(/```/g, '').trim();
        elements.push(new Paragraph({
          children: [new TextRun({ text: code, font: "Courier New", size: 20 })],
          shading: { fill: "F3F4F6" },
          spacing: { before: 200, after: 200 }
        }));
      }
    } else {
      const lines = part.split('\n');
      let i = 0;
      while (i < lines.length) {
        const line = lines[i].trim();
        if (line.includes(':::')) {
          const tableRows: TableRow[] = [];
          while (i < lines.length && lines[i].trim().includes(':::')) {
            const cells = lines[i].trim().split(':::').map(c => c.trim());
            tableRows.push(new TableRow({
              children: cells.map(c => new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ 
                    text: c.replace(/\*\*/g, ''), 
                    font: FONT_FAMILY, 
                    size: FONT_SIZE 
                  })],
                  alignment: AlignmentType.CENTER
                })],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BLACK },
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BLACK },
                  left: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BLACK },
                  right: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BLACK },
                }
              }))
            }));
            i++;
          }
          if (tableRows.length > 0) {
            elements.push(new Table({ 
              rows: tableRows, 
              width: { size: 100, type: WidthType.PERCENTAGE },
              spacing: { before: 200, after: 200 }
            }));
          }
          continue;
        } else if (line !== "") {
          const isHeader = (line === line.toUpperCase() && line.length > 5) || line.includes('SỞ GD&ĐT') || line.includes('ĐỀ SỐ');
          elements.push(new Paragraph({
            children: [new TextRun({ 
              text: line.replace(/\*\*/g, ''), 
              font: FONT_FAMILY, 
              size: FONT_SIZE, 
              bold: isHeader 
            })],
            alignment: isHeader ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
            spacing: { before: 120, after: 120, line: 360 }
          }));
        }
        i++;
      }
    }
  });
  return elements;
};

export const generateDocx = async (
  content: string, 
  copyNumber: number, 
  originalFileName: string, 
  mediaStorage: Record<number, string>,
  solutionContent?: string,
  solutionMediaStorage?: Record<number, string>
) => {
  let children: (Paragraph | Table)[] = processContentToElements(content, mediaStorage);
  
  // Nếu có lời giải, thêm dấu ngắt trang và nội dung lời giải
  if (solutionContent) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    
    // Thêm tiêu đề cho phần đáp án
    children.push(new Paragraph({
      children: [new TextRun({ 
        text: "ĐÁP ÁN VÀ LỜI GIẢI CHI TIẾT", 
        font: FONT_FAMILY, 
        size: 32, 
        bold: true,
        underline: {}
      })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 400 }
    }));

    const solutionElements = processContentToElements(solutionContent, solutionMediaStorage || {});
    children = children.concat(solutionElements);
  }

  const footer = new Footer({
    children: [
      new Paragraph({
        children: [new TextRun({ 
          text: "Create by Hoà Hiệp AI – 0983.676.470", 
          font: FONT_FAMILY, 
          size: 16, 
          italics: true, 
          color: "808080" 
        })],
        alignment: AlignmentType.CENTER
      }),
    ],
  });

  const doc = new Document({
    sections: [{
      properties: { margin: { top: 720, right: 720, bottom: 720, left: 720 } },
      footers: { default: footer },
      children: children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const saveAsFn = (FileSaver as any).saveAs || (FileSaver as any).default?.saveAs || (window as any).saveAs;
  saveAsFn(blob, `Ban_Sao_De_${copyNumber}.docx`);
};
