import { Document, Packer, Paragraph, TextRun, Footer, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";
import * as FileSaver from "file-saver";

// Constants for styling
const FONT_FAMILY = "Times New Roman";
const FONT_SIZE = 26; // 13pt = 26 half-points
const COLOR_BLACK = "000000";

export const generateDocx = async (content: string, copyNumber: number, originalFileName: string) => {
  const lines = content.split('\n');
  const children: (Paragraph | Table)[] = [];

  let inCodeBlock = false;

  // Process Content
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue; // Skip the delimiter line
    }

    if (line === "") {
        children.push(new Paragraph({}));
        continue;
    }

    if (inCodeBlock) {
        // Render code (Python/TikZ) in a distinct style
        children.push(new Paragraph({
            children: [
                new TextRun({
                    text: line,
                    font: "Courier New",
                    size: 20, // 10pt
                    color: "333333"
                })
            ],
            shading: {
                fill: "F3F4F6", // Light gray background for code
            },
            spacing: { line: 240 } // Single spacing
        }));
    } else {
        // Special Handling for Table-like lines using ':::' delimiter
        // Used for Headers to allow Multi-column layouts without conflicting with math |a|
        if (line.includes(':::')) {
            const cells = line.split(':::').map(c => c.trim());
            const numberOfColumns = cells.length;
            const columnWidthPercent = Math.floor(100 / numberOfColumns);
            
            // Create a row with dynamic number of cells
            const tableRow = new TableRow({
                children: cells.map(cellText => {
                    const isBold = cellText.includes('**') || cellText === cellText.toUpperCase();
                    const cleanText = cellText.replace(/\*\*/g, '');
                    
                    return new TableCell({
                        children: [new Paragraph({
                            children: [new TextRun({
                                text: cleanText,
                                font: FONT_FAMILY,
                                size: FONT_SIZE,
                                bold: isBold,
                                color: COLOR_BLACK,
                            })],
                            alignment: AlignmentType.CENTER
                        })],
                        width: {
                            size: columnWidthPercent,
                            type: WidthType.PERCENTAGE,
                        },
                        borders: {
                            top: { style: BorderStyle.NONE, size: 0, color: "auto" },
                            bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
                            left: { style: BorderStyle.NONE, size: 0, color: "auto" },
                            right: { style: BorderStyle.NONE, size: 0, color: "auto" },
                        },
                    });
                })
            });

            const table = new Table({
                rows: [tableRow],
                width: {
                    size: 100,
                    type: WidthType.PERCENTAGE,
                },
                borders: {
                    top: { style: BorderStyle.NONE, size: 0, color: "auto" },
                    bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
                    left: { style: BorderStyle.NONE, size: 0, color: "auto" },
                    right: { style: BorderStyle.NONE, size: 0, color: "auto" },
                    insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
                    insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
                }
            });
            children.push(table);
        } 
        else {
            // Normal Paragraph handling
            const isBold = line.startsWith('**') && line.endsWith('**');
            // Headers are often uppercase, short, and not math
            const isLikelyHeader = line === line.toUpperCase() && line.length < 60 && line.length > 3 && !line.includes('$');
            
            const cleanText = isBold ? line.replace(/\*\*/g, '') : line;
            
            children.push(new Paragraph({
                children: [
                    new TextRun({
                        text: cleanText,
                        font: FONT_FAMILY,
                        size: FONT_SIZE, // 13pt
                        bold: isBold || isLikelyHeader, 
                        color: COLOR_BLACK,
                    })
                ],
                spacing: { 
                    line: 360, // 1.5 spacing
                    before: isLikelyHeader ? 120 : 60, 
                    after: isLikelyHeader ? 120 : 60 
                }, 
                alignment: isLikelyHeader ? AlignmentType.CENTER : AlignmentType.JUSTIFIED
            }));
        }
    }
  }

  // Footer
  const footer = new Footer({
    children: [
      new Paragraph({
        children: [
            new TextRun({
                text: "Create by Hoà Hiệp AI – 0983.676.470",
                font: FONT_FAMILY,
                size: 20, // 10pt
                italics: true,
                color: "808080" // Gray
            })
        ],
        alignment: AlignmentType.CENTER,
        border: {
            top: {
                style: BorderStyle.SINGLE,
                size: 1,
                color: "E5E7EB", // Light gray
                space: 10
            }
        }
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        footers: {
          default: footer,
        },
        children: children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  
  // Safe saveAs implementation
  let saveAsFn: any = (FileSaver as any).saveAs;
  if (!saveAsFn && (FileSaver as any).default) {
      if (typeof (FileSaver as any).default === 'function') {
          saveAsFn = (FileSaver as any).default;
      } else if (typeof (FileSaver as any).default.saveAs === 'function') {
          saveAsFn = (FileSaver as any).default.saveAs;
      }
  }

  if (typeof saveAsFn === 'function') {
      saveAsFn(blob, `Ban_Sao_De_${copyNumber}.docx`);
  } else {
      console.warn("Could not find 'saveAs', using fallback.");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Ban_Sao_De_${copyNumber}.docx`;
      a.click();
      URL.revokeObjectURL(url);
  }
};