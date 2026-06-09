import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { getCharacterInstruction } from "./src/data";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload bounds for historical image analysis
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Initialize GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Check Health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 1. CHAT WITH HISTORICAL FIGURES PROXY
app.post("/api/chat", async (req, res) => {
  try {
    const { characterId, history, message } = req.body;

    if (!characterId) {
      return res.status(400).json({ error: "Thiếu thông tin danh nhân lịch sử (characterId)" });
    }
    if (!message) {
      return res.status(400).json({ error: "Thiếu nội dung câu hỏi (message)" });
    }

    const systemInstruction = getCharacterInstruction(characterId);

    // Format historical messages for `@google/genai`
    const contents = (history || []).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    // Add current user message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.4, // Keep output relatively factual and controlled
      }
    });

    const textOutput = response.text || "Không có phản hồi từ danh nhân.";
    res.json({ reply: textOutput });
  } catch (err: any) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Có lỗi xảy ra khi truyền tin với danh nhân trí tuệ nhân tạo: " + err.message });
  }
});

// 2. CHECK ACCURACY OF GENERATED HISTORICAL CONTENT
app.post("/api/check-accuracy", async (req, res) => {
  try {
    const { characterId, messageContent } = req.body;

    if (!characterId || !messageContent) {
      return res.status(400).json({ error: "Thiếu thông tin thẩm định lịch sử." });
    }

    const prompt = `Bạn là một nhà sử học Việt Nam độc lập và khách quan. Nhận định sâu sắc các thông tin lịch sử.
Hãy phân tích tính chính xác của câu trả lời sau đây dưới danh nghĩa nhân vật lịch sử có ID là "${characterId}".
Nội dung cần thẩm định:
"${messageContent}"

Hãy phân loại chính xác các thông tin trong câu trả lời trên thành 3 phần rõ ràng:
1. Sự thật lịch sử (fact): Những chi tiết lịch sử hoàn toàn trung thực, có bằng chứng khảo cổ/tư liệu học thuật/sách giáo khoa rõ ràng.
2. Diễn giải/Nhận định lịch sử (interpretation): Những chi tiết mang cảm xúc, gán ghép nhân vật hóa thân biểu đạt, hoặc góc nhìn triết lý còn đang tranh luận mở rộng.
3. Thiếu bằng chứng hoặc Không chắc chắn (unverified): Các chi tiết truyền thuyết dân gian, giai thoại truyền miệng chưa kiểm chứng khoa học, hoặc kiến thức nằm ngoài trực giác thời đại nhân vật (như các sự kiện hậu năm nhân vật mất).

Hãy viết kết luận ngắn gọn, khoa học và công tâm cho từng phần bằng tiếng Việt.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fact: { type: Type.STRING, description: "Phần lịch sử thực tế đã được kiểm chứng bằng giáo lý hay sách giáo khoa" },
            interpretation: { type: Type.STRING, description: "Phần gán suy tưởng chủ quan, góc nhìn nghiên cứu hay diễn dịch văn hóa nghệ thuật" },
            unverified: { type: Type.STRING, description: "Phần thiếu sử ký hoặc không thể tự chứng bởi danh nhân (hậu sinh, giai thoại huyền bí)" }
          },
          required: ["fact", "interpretation", "unverified"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (err: any) {
    console.error("Accuracy check error:", err);
    res.status(500).json({ error: "Lỗi kiểm tra tính chính xác lịch sử: " + err.message });
  }
});

// 3. ANALYZE HISTORICAL IMAGES WITH VISION
app.post("/api/analyze-image", async (req, res) => {
  try {
    const { image, mimeType } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Vui lòng cung cấp dữ liệu hình ảnh (base64)" });
    }

    const pureBase64 = image.includes("base64,") ? image.split("base64,")[1] : image;
    const realMime = mimeType || "image/jpeg";

    const imagePart = {
      inlineData: {
        mimeType: realMime,
        data: pureBase64,
      },
    };

    const textPart = {
      text: `Bạn là một chuyên gia khảo cổ và lịch sử Việt Nam danh tiếng. Hãy phân tích hình ảnh hiện vật hoặc địa danh/di tích lịch sử quốc gia này.
Phán đoán xem đây có phải là một di tích lịch sử tiêu biểu (ví dụ: Lăng Bác, Dinh Độc Lập, Văn Miếu Quốc Tử Giám, Hoàng Thành Thăng Long, Cốc Bó, Điện Biên Phủ, Côn Đảo...) hay hiện vật lịch sử chính thống Việt Nam.

Phân tích và điền vào các trường JSON:
1. siteName: Tên chính thức hoặc ước lượng của di tích/hiện vật được ghi nhận (Nếu không phải di tích lịch sử VN, đặt tên là "Không xác định").
2. period: Thời kỳ lịch sử hoặc triều đại tương ứng.
3. significance: Ý nghĩa văn hóa, giá trị lịch sử Việt Nam sâu sắc.
4. confidence: Cung cấp mức độ tin tưởng là "high" (nếu nhận diện rõ ràng địa danh/hiện vật lịch sử chính thống) hoặc "low" (nếu hình ảnh không phải di tích lịch sử Việt Nam, mờ ảo hoặc không chắc chắn).
5. explanation: Nhận định đánh giá tổng quan, lý giải lý do phân loại tự tin cao hay thấp và đưa ra khuyến cáo kiến thức khoa học hữu ích.

Luật thép:
- Tuyệt đối không bịa đặt, tưởng tượng hư cấu các hiện vật không có thật.
- Nếu không chắc chắn, bạn phải đặt tự tin 'low' và ghi rõ ở phần giải thích: "Không có đủ tư liệu lịch sử hoặc hình ảnh không đủ rõ ràng để khẳng định."`,
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            siteName: { type: Type.STRING, description: "Tên chính thức địa danh học hoặc hiện vật" },
            period: { type: Type.STRING, description: "Thời kỳ lịch sử đại diện cổ đại, phong kiến hay hiện đại" },
            significance: { type: Type.STRING, description: "Ý nghĩa, giá trị lịch sử và đóng vai trò quốc gia" },
            confidence: { type: Type.STRING, description: "'high' (rõ ràng di tích VN) hoặc 'low' (mờ mịt, không thuộc sử Việt)" },
            explanation: { type: Type.STRING, description: "Giải trình chi tiết học thuật về phân loại và độ tin cậy" }
          },
          required: ["siteName", "period", "significance", "confidence", "explanation"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (err: any) {
    console.error("Image analysis error:", err);
    res.status(500).json({ error: "Lỗi phân tích hình ảnh di sản: " + err.message });
  }
});


// FRONTEND SERVING IN EXPRESS
async function serveApp() {
  if (process.env.NODE_ENV !== "production") {
    // Vite Middlewares for local reactive editing
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware mounted.");
  } else {
    // Production serving statically compiled React
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static files serving from:", distPath);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Bảo Tàng Lịch Sử Việt Nam AI Server running on http://localhost:${PORT}`);
  });
}

serveApp().catch((err) => {
  console.error("Failed to boot app server:", err);
});
