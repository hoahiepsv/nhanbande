
import { GoogleGenAI } from "@google/genai";
import { ModelType } from "../types";
import { fileToGenerativePart } from "../utils/helpers";

export const generateExamCopy = async (
  apiKey: string,
  model: ModelType,
  files: File[],
  copyIndex: number
): Promise<string> => {
  const finalApiKey = apiKey.trim() || (process.env.API_KEY || "").trim();
  const ai = new GoogleGenAI({ apiKey: finalApiKey });
  const fileParts = await Promise.all(files.map(f => fileToGenerativePart(f)));

  const systemInstruction = `
Bạn là chuyên gia biên soạn đề thi Toán chuyên nghiệp. Nhiệm vụ của bạn là tạo ra "Đề bản sao số ${copyIndex}" dựa trên đề gốc.

QUY TẮC LATEX & ĐỊNH DẠNG (QUAN TRỌNG):
1. **Công thức PHỨC TẠP**: Sử dụng LaTeX đặt trong dấu $ cho các biểu thức như phân số (\\frac), tích phân (\\int), căn thức (\\sqrt), số mũ phức tạp, ma trận... Ví dụ: $f(x) = \\frac{x^2 + 1}{\\sqrt{x}}$.
2. **Ký hiệu ĐƠN GIẢN**: TUYỆT ĐỐI KHÔNG sử dụng dấu $ cho:
   - Tên điểm (Ví dụ: Viết "AB" thay vì "$AB$").
   - Số phần trăm (Ví dụ: Viết "50%" thay vì "$50%$").
   - Các chữ cái đơn lẻ hoặc biến số đơn giản trong văn bản thông thường.
   - Các nhãn đơn giản như "Câu 1", "Bài 2".

QUY TẮC HÌNH ẢNH (BẮT BUỘC SỬ DỤNG THẺ ĐÓNG):
1. **HÌNH HỌC PHẲNG (2D)**:
   - Viết mã Python trong block: [[GEOMETRY_CODE]] ...mã python... [[/GEOMETRY_CODE]]
   - PHẢI tính toán tọa độ (x, y) chính xác. Sử dụng plt.text() để đánh nhãn.

2. **HÌNH KHỐI 3D & MINH HỌA**:
   - Viết mô tả tiếng Anh trong block: [[AI_IMAGE_PROMPT]] ...mô tả chi tiết... [[/AI_IMAGE_PROMPT]]
   - **Yêu cầu mô tả**: Nêu rõ loại hình, các đỉnh (ví dụ: S.ABCD), đặc điểm đáy, vị trí đường cao.
   - **Phong cách**: "Professional 3D mathematical diagram, clean black lines on white background, high contrast, clearly labeled vertices".

QUY TẮC CẤU TRÚC:
1. **Bảng biểu**: Sử dụng ':::' để phân tách các cột.
2. **Nội dung**: Giữ nguyên cấu trúc, thay đổi số liệu thông minh.
3. **Bản quyền**: Tuyệt đối không ghi ký tự "L" hay bất kỳ dấu hiệu bản quyền nào.
`;

  const config: any = {
    systemInstruction: systemInstruction,
    temperature: 0.3,
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
            text: `Dựa trên file đề gốc, hãy tạo "Bản sao số ${copyIndex}". Hãy chắc chắn RẰNG các block [[GEOMETRY_CODE]] và [[AI_IMAGE_PROMPT]] luôn có thẻ đóng tương ứng là [[/GEOMETRY_CODE]] và [[/AI_IMAGE_PROMPT]].`
        }
      ],
      config: config
    });

    return response.text || "Lỗi: Không nhận được phản hồi từ AI.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes('ISO-8859-1') || error.message?.includes('Headers')) {
       throw new Error("Lỗi định dạng yêu cầu. Vui lòng kiểm tra lại API Key hoặc nội dung file.");
    }
    throw new Error(`Lỗi kết nối AI: ${error.message || "Kiểm tra lại kết nối mạng"}`);
  }
};
