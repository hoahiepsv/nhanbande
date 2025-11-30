import { GoogleGenAI } from "@google/genai";
import { ModelType } from "../types";
import { fileToGenerativePart } from "../utils/helpers";

export const generateExamCopy = async (
  apiKey: string,
  model: ModelType,
  files: File[],
  copyIndex: number
): Promise<string> => {
  // Use the key provided by the user via the UI
  const ai = new GoogleGenAI({ apiKey: apiKey });

  const fileParts = await Promise.all(files.map(f => fileToGenerativePart(f)));

  const systemInstruction = `
Bạn là một chuyên gia biên soạn đề thi Toán học chuyên nghiệp.
Nhiệm vụ: Phân tích hình ảnh/PDF đề gốc và tạo ra "Đề bản sao số ${copyIndex}".

QUY TẮC CẤU TRÚC & TRÌNH BÀY (QUAN TRỌNG):

1.  **PHẦN ĐẦU (HEADER) - BỐ CỤC BẢNG BIỂU**:
    *   Trích xuất chính xác thông tin: Tên Sở, Tên Trường, Tên Kỳ Thi, Môn Thi, Thời Gian làm bài từ đề gốc.
    *   **QUAN TRỌNG**: Sử dụng ký hiệu \`:::\` để ngăn cách các cột. **TUYỆT ĐỐI KHÔNG** dùng dấu \`|\` để chia cột vì sẽ nhầm với dấu trị tuyệt đối trong toán học.
    *   **Vị trí "Đề số ${copyIndex}"**: Thêm dòng chữ "**Đề số ${copyIndex}**" nằm ngay phía dưới Tên Trường.
    *   Mẫu output bắt buộc cho phần Header:
        \`SỞ GD&ĐT [TÊN SỞ] ::: KỲ THI [TÊN KỲ THI]\`
        \`TRƯỜNG [TÊN TRƯỜNG] ::: Môn thi: TOÁN\`
        \`**Đề số ${copyIndex}** ::: Thời gian làm bài: [Thời gian]\`
    *   Nếu có dòng Họ tên học sinh/Số báo danh, cũng dùng \`:::\` để chia cột.

2.  **PHẦN NỘI DUNG ĐỀ THI**:
    *   Giữ nguyên 100% cấu trúc đề (số câu, chia phần trắc nghiệm/tự luận).
    *   **Tạo câu hỏi bản sao (Clone)**:
        *   Giữ nguyên dạng toán, phương pháp giải, mức độ khó.
        *   THAY ĐỔI SỐ LIỆU: Số liệu mới phải hợp lý, ra kết quả đẹp.
        *   Bài toán thực tế: Thay đổi ngữ cảnh/chủ đề nhưng giữ nguyên mô hình toán học.

3.  **HÌNH ẢNH & ĐỒ THỊ**:
    *   Hình 2D: Viết mã \`LaTeX TikZ\` trong block code (\`\`\`latex ... \`\`\`).
    *   Hình 3D/Đồ thị phức tạp: Viết mã \`Python\` trong block code (\`\`\`python ... \`\`\`).

4.  **ĐỊNH DẠNG TOÁN HỌC**:
    *   Dùng ký hiệu \`$\` cho biểu thức toán (ví dụ: $y = x^2 + |x|$).
    *   Lưu ý: Dấu trị tuyệt đối dùng \`|\` bình thường trong công thức toán ($|a|$), không ảnh hưởng đến bố cục bảng biểu vì bảng biểu dùng \`:::\`.

5.  **PHẦN CUỐI**:
    *   Tạo bảng đáp án chi tiết cho các câu hỏi đã thay đổi ở cuối trang.

OUTPUT FORMAT:
Chỉ trả về nội dung văn bản đề thi.
`;

  const config: any = {
    systemInstruction: systemInstruction,
    temperature: 0.4, // Lower temperature for more precise math
  };

  if (model === ModelType.PRO) {
    // Enable thinking budget for Pro models for deeper analysis and better math logic
    config.thinkingConfig = { thinkingBudget: 10240 }; 
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [
        ...fileParts,
        {
            text: `Thực hiện tạo bản sao đề số ${copyIndex}. Nhớ dùng ":::" để chia cột Header. Các công thức trị tuyệt đối dùng "|" bình thường.`
        }
      ],
      config: config
    });

    return response.text || "Không thể tạo nội dung. Vui lòng thử lại.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(`Lỗi khi gọi AI: ${error.message || error}`);
  }
};