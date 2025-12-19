
import { GoogleGenAI } from "@google/genai";
import { ModelType } from "../types";
import { fileToGenerativePart } from "../utils/helpers";

export const generateExamCopy = async (
  model: ModelType,
  files: File[],
  copyIndex: number
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    throw new Error(`Lỗi kết nối AI: ${error.message || "Kiểm tra lại kết nối mạng"}`);
  }
};
