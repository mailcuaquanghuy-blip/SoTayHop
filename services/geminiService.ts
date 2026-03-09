import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Player, RoundScores } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getGameCommentary = async (players: Player[]): Promise<string> => {
  try {
    // Prepare a simple summary of the game state
    const summary = players.map(p => `${p.name}: ${p.totalScore} điểm`).join(', ');

    const prompt = `
      Bạn là một thư ký cuộc họp "xéo xắt", hài hước và lầy lội trong một công ty Gen Z.
      Các thành viên đang tham gia một cuộc họp (hoặc teambuilding) và đây là điểm số/ghi nhận hiện tại của họ:
      ${summary}
      
      Hãy đưa ra một nhận xét ngắn gọn (dưới 50 từ) bằng tiếng Việt về tình hình cuộc họp.
      Hãy "cà khịa" người ít điểm (có thể là người ít phát biểu hoặc bị phạt tiền) và tâng bốc "MVP" (người nhiều điểm) một cách hài hước.
      Sử dụng ngôn ngữ văn phòng trẻ trung (ví dụ: "chạy KPI", "chạy deadline", "trừ lương", "sếp", "OT", "drama công sở", "xu cà na").
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "AI đang bận chạy deadline, thử lại sau nhé!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Mạng công ty lag quá, không load nổi drama này!";
  }
};

export const getRoundCommentary = async (players: Player[], roundScores: RoundScores): Promise<string> => {
  try {
    const roundSummary = players.map(p => {
      const score = roundScores[p.id] || 0;
      return `${p.name}: ${score > 0 ? '+' : ''}${score}`;
    }).join(', ');

    const prompt = `
      Bạn là một bình luận viên AI hài hước, xéo xắt cho một trò chơi/cuộc họp nhóm.
      Vòng vừa rồi có kết quả như sau: ${roundSummary}.
      
      Hãy đưa ra một câu bình luận thật ngắn gọn (1-2 câu, dưới 30 từ), cực kỳ hài hước và "cà khịa" về kết quả vòng này.
      Tập trung vào người thắng đậm hoặc người thua thảm. Dùng từ lóng Gen Z, văn phòng (báo thủ, gánh team, ra chuồng gà, xỉu ngang...).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Vòng này nhạt quá, không có gì để nói!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Lỗi mạng, AI đi ngủ rồi!";
  }
};

export const parseScoresFromText = async (text: string, players: Player[]): Promise<RoundScores | null> => {
  try {
    const playerNames = players.map(p => p.name).join(', ');
    const prompt = `
      Tôi có danh sách người chơi: ${playerNames}.
      Người dùng vừa nhập câu sau để ghi điểm: "${text}"
      
      Nhiệm vụ của bạn là phân tích câu này và trả về điểm số tương ứng cho từng người chơi.
      Ví dụ: "Huy nhất, nam 1 khánh 1" nghĩa là Nam -1, Khánh -1, và Huy sẽ nhận tổng điểm cộng lại là +2 (vì Huy nhất).
      Nếu câu nói "A cộng 2, B trừ 1" thì A: 2, B: -1.
      Hãy suy luận logic trò chơi (người thắng nhận tổng điểm của những người thua).
      
      Trả về JSON với key là tên người chơi (chính xác như danh sách) và value là số điểm (integer).
      Chỉ trả về những người có điểm khác 0.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          description: "Điểm số của người chơi",
          additionalProperties: {
            type: Type.INTEGER
          }
        }
      }
    });

    const jsonStr = response.text?.trim() || "{}";
    const parsed = JSON.parse(jsonStr);
    
    // Map names back to IDs
    const result: RoundScores = {};
    for (const [name, score] of Object.entries(parsed)) {
      // Find closest matching player name (case insensitive)
      const player = players.find(p => p.name.toLowerCase() === name.toLowerCase() || name.toLowerCase().includes(p.name.toLowerCase()));
      if (player && typeof score === 'number') {
        result[player.id] = score;
      }
    }
    
    return result;
  } catch (error) {
    console.error("Gemini API Error parsing scores:", error);
    return null;
  }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, // You can change voice if needed
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return base64Audio;
    }
    return null;
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    return null;
  }
};