
import { GoogleGenAI } from "@google/genai";
import { ModelType } from "../types";
import { fileToGenerativePart } from "../utils/helpers";

export const generateExamCopy = async (
  model: ModelType,
  files: File[],
  copyIndex: number,
  customApiKey?: string
): Promise<string> => {
  const apiKey = customApiKey || process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey as string });
  const fileParts = await Promise.all(files.map(f => fileToGenerativePart(f)));

  const systemInstruction = `
Bạn là một chuyên gia biên soạn đề thi Toán chuyên nghiệp. Nhiệm vụ của bạn là tạo ra "Đề bản sao số ${copyIndex}" dựa trên đề gốc.

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
- Không thêm bất kỳ thông tin bản quyền cá nhân nào vào nội dung đề thi.
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
            text: `Tạo "Bản sao số ${copyIndex}". Hãy tuân thủ đúng quy tắc: bao quanh công thức phức tạp bằng $, nhưng KHÔNG dùng $ cho các chữ cái đơn lẻ (x, y), điểm (A, B), cạnh (AB) và ký hiệu %.`
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
1. Trình bày rõ ràng, từng bước một.
2. Với mỗi bài toán hình học, bạn BẮT BUỘC phải tạo hình vẽ minh họa (2D hoặc 3D) bằng các tag chuyên dụng:
   - [[GEOMETRY_CODE]] cho code Python (Matplotlib).
   - [[AI_IMAGE_PROMPT]] cho mô tả hình vẽ 3D trực quan.
3. Tuân thủ quy tắc LaTeX: dùng $ cho công thức phức tạp, không dùng $ cho biến đơn (x, y), điểm (A, B), cạnh (AB).
4. Sử dụng bảng biểu ':::' nếu cần trình bày bảng biến thiên hoặc bảng giá trị.
5. Cuối mỗi bài giải phải có kết luận rõ ràng.

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
