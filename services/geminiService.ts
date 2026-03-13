
import { GoogleGenAI } from "@google/genai";
import { ModelType } from "../types";
import { fileToGenerativePart } from "../utils/helpers";

export const generateExamCopy = async (
  model: ModelType,
  files: File[],
  copyIndex: number,
  customApiKey?: string,
  includeSolution: boolean = false
): Promise<string> => {
  const apiKey = customApiKey || process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey as string });
  const fileParts = await Promise.all(files.map(f => fileToGenerativePart(f)));

  const isOriginal = copyIndex === 0;

  const systemInstruction = `
Bạn là một chuyên gia biên soạn đề thi Toán chuyên nghiệp. Nhiệm vụ của bạn là ${isOriginal ? 'trích xuất nội dung từ đề gốc' : `tạo ra "Đề bản sao số ${copyIndex}" dựa trên đề gốc`}.

${isOriginal ? 'YÊU CẦU QUAN TRỌNG: Giữ nguyên toàn bộ nội dung, câu hỏi, số liệu và thứ tự từ đề gốc. Không thay đổi bất kỳ thông tin nào.' : 'YÊU CẦU QUAN TRỌNG: Khi tạo bản sao, bạn phải GIỮ NGUYÊN các thông tin hành chính như: Tên Sở Giáo dục & Đào tạo, Tên Trường, Năm học, Kỳ thi, Môn thi, và Thời gian làm bài. Chỉ thay đổi số liệu và nội dung trong các câu hỏi để tạo ra đề tương đương.'}

QUY TẮC TRÌNH BÀY TOÁN HỌC (QUAN TRỌNG):
- Sử dụng dấu $ để bao quanh các công thức toán học phức tạp (ví dụ: $\\frac{a}{b}$, $\\sqrt{x^2+1}$, $\\sin x$).
- NGOẠI LỆ (KHÔNG dùng dấu $):
  + Các biến số đơn giản: x, y, z, m, n.
  + Các điểm hình học: A, B, C, S, O.
  + Các cạnh, đường thẳng, đoạn thẳng: AB, BC, CD, SA, d, Delta.
  + Các giá trị phần trăm: 5%, 10%, 100%.
- Mục tiêu: Các công thức phức tạp sẽ được chuyển thành MathType, còn các ký hiệu đơn giản giữ nguyên định dạng văn bản bình thường.

QUY TẮC HÌNH ẢNH:
1. **HÌNH 2D (Python)**: Viết code trong [[GEOMETRY_CODE]] ... [[/GEOMETRY_CODE]]. Sử dụng plt.grid(False) và plt.axis('off').
2. **HÌNH 3D (AI Prompt)**: Viết mô tả trong [[AI_IMAGE_PROMPT]] ... [[/AI_IMAGE_PROMPT]].

QUY TẮC CẤU TRÚC:
- Bảng biểu dùng phân cách ':::'.
- Đối với câu hỏi trắc nghiệm, các lựa chọn (A, B, C, D) phải nằm trên cùng một dòng và cách nhau đúng 10 khoảng trắng (ví dụ: A. ...          B. ...          C. ...          D. ...).
- Không thêm bất kỳ thông tin bản quyền cá nhân nào vào nội dung đề thi.
${includeSolution ? `
QUY TẮC ĐÁP ÁN:
- Sau khi kết thúc đề thi, hãy thêm một dấu phân cách duy nhất là [[SOLUTION_START]].
- Đầu tiên, hãy tạo một BẢNG ĐÁP ÁN TRẮC NGHIỆM (nếu có câu hỏi trắc nghiệm) theo định dạng sau:
  Dòng 1: Câu ::: 1 ::: 2 ::: 3 ::: ...
  Dòng 2: Chọn ::: A ::: B ::: C ::: ...
- Sau đó, trình bày lời giải chi tiết cho từng câu.
- Trình bày lời giải rõ ràng, từng bước.
` : ''}
`;

  const config: any = {
    systemInstruction: systemInstruction,
    temperature: 0.2,
  };

  if (model === ModelType.PRO) {
    config.thinkingConfig = { thinkingBudget: 16000 }; 
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [
        ...fileParts,
        {
            text: isOriginal 
              ? `Trích xuất nội dung từ đề gốc, giữ nguyên toàn bộ câu hỏi và số liệu${includeSolution ? ' kèm theo đáp án chi tiết' : ''}. Tuân thủ đúng quy tắc LaTeX.`
              : `Tạo "Bản sao số ${copyIndex}"${includeSolution ? ' kèm theo đáp án chi tiết' : ''}. Chú ý: GIỮ NGUYÊN tên Sở, Trường, Năm học, Kỳ thi từ đề gốc. Hãy tuân thủ đúng quy tắc: bao quanh công thức phức tạp bằng $, nhưng KHÔNG dùng $ cho các chữ cái đơn lẻ (x, y), điểm (A, B), cạnh (AB) và ký hiệu %.`
        }
      ],
      config: config
    });

    return response.text || "Lỗi: Không nhận được phản hồi từ AI.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(`Lỗi kết nối AI: ${error.message || "Kiểm tra lại kết nối mạng hoặc API Key"}`);
  }
};

export const solveExam = async (
  examContent: string,
  model: ModelType,
  customApiKey?: string
): Promise<string> => {
  const apiKey = customApiKey || process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey as string });

  const systemInstruction = `
Bạn là một chuyên gia giải Toán cao cấp. Nhiệm vụ của bạn là giải chi tiết đề thi được cung cấp.

YÊU CẦU LỜI GIẢI:
1. Đầu tiên, hãy tạo một BẢNG ĐÁP ÁN TRẮC NGHIỆM (nếu có câu hỏi trắc nghiệm) theo định dạng sau:
   Dòng 1: Câu ::: 1 ::: 2 ::: 3 ::: ...
   Dòng 2: Chọn ::: A ::: B ::: C ::: ...
2. Trình bày lời giải rõ ràng, từng bước một.
3. Với mỗi bài toán hình học, bạn BẮT BUỘC phải tạo hình vẽ minh họa (2D hoặc 3D) bằng các tag chuyên dụng:
   - [[GEOMETRY_CODE]] cho code Python (Matplotlib).
   - [[AI_IMAGE_PROMPT]] cho mô tả hình vẽ 3D trực quan.
4. Tuân thủ quy tắc LaTeX: dùng $ cho công thức phức tạp, không dùng $ cho biến đơn (x, y), điểm (A, B), cạnh (AB).
5. Đối với câu hỏi trắc nghiệm, các lựa chọn (A, B, C, D) phải nằm trên cùng một dòng và cách nhau đúng 10 khoảng trắng.
6. Sử dụng bảng biểu ':::' nếu cần trình bày bảng biến thiên hoặc bảng giá trị.
7. Cuối mỗi bài giải phải có kết luận rõ ràng.

ĐỊNH DẠNG ĐẦU RA:
- Chia thành từng Câu/Bài tương ứng với đề thi.
- Mỗi lời giải bao gồm: "Hướng dẫn giải", "Hình vẽ minh họa" (nếu có), "Lời giải chi tiết", và "Đáp số".
`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [{ text: `Hãy giải chi tiết đề thi sau đây:\n\n${examContent}` }],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1,
        thinkingConfig: model === ModelType.PRO ? { thinkingBudget: 16000 } : undefined
      }
    });

    return response.text || "Lỗi: Không thể tạo lời giải.";
  } catch (error: any) {
    console.error("Gemini Solve Error:", error);
    throw new Error(`Lỗi giải đề: ${error.message}`);
  }
};
