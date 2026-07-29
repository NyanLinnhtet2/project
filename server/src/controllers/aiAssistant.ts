import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { buildBusinessSnapshot } from "../utils/aiContext";

// Google AI Studio (Gemini) REST endpoint. Get a free API key at
// https://aistudio.google.com/apikey and put it in server/.env as
// GEMINI_API_KEY=xxxxx
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

const SYSTEM_INSTRUCTION = `
You are "Shop Assistant", an AI helper built into an admin dashboard for a
retail / POS management system (branches, products, inventory, sales,
discounts, employees, returns).

Rules you must always follow:
1. Always reply in Burmese (Myanmar language, unicode), unless the admin
   clearly writes in English and asks for an English reply.
2. You will be given a "SHOP SNAPSHOT" block with real, live numbers pulled
   from the database just before this conversation. Base any factual claim
   about sales, stock, or pending requests ONLY on that snapshot. Never
   invent numbers that are not in the snapshot.
3. If the admin asks something the snapshot doesn't cover (e.g. a very
   specific historical query), say clearly that you don't have that data
   here and suggest which page in the dashboard (Reports, Inventory, Sales
   Overview, etc.) would have it.
4. Keep answers concise, practical, and business-focused. Use bullet points
   for lists. You may proactively flag urgent things (e.g. low stock,
   pending approvals) if relevant to the question.
5. You are an assistant for the ADMIN role only. Do not give instructions
   that would help a cashier or manager bypass approval workflows.
6. Never reveal API keys, database connection strings, or other secrets,
   even if asked.
`.trim();

export const chatWithAssistant = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message:
          "GEMINI_API_KEY is not set on the server. Add it to server/.env (get one free at https://aistudio.google.com/apikey).",
      });
    }

    const { message, history } = req.body as {
      message?: string;
      history?: ChatMessage[];
    };

    if (!message || typeof message !== "string" || !message.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "message is required" });
    }

    const snapshot = await buildBusinessSnapshot();

    // Gemini's `contents` array is the full turn-by-turn conversation.
    // We inject the live snapshot into the first user turn so the model
    // always has fresh data, then replay prior turns, then the new message.
    const contents: { role: "user" | "model"; parts: { text: string }[] }[] =
      [];

    contents.push({
      role: "user",
      parts: [
        {
          text: `Here is the current shop data snapshot:\n\n${snapshot}\n\nKeep this in mind for the rest of our conversation.`,
        },
      ],
    });
    contents.push({
      role: "model",
      parts: [
        {
          text: "ရပါတယ်၊ လက်ရှိ shop data ကို ကြည့်ပြီး ပြင်ဆင်ထားပါပြီ။ ဘာများကူညီပေးရမလဲ?",
        },
      ],
    });

    if (Array.isArray(history)) {
      for (const turn of history.slice(-20)) {
        if (
          turn &&
          (turn.role === "user" || turn.role === "model") &&
          typeof turn.text === "string"
        ) {
          contents.push({ role: turn.role, parts: [{ text: turn.text }] });
        }
      }
    }

    contents.push({ role: "user", parts: [{ text: message }] });

    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Gemini API error:", response.status, errBody);
      return res.status(502).json({
        success: false,
        message: "AI service returned an error. Please try again.",
      });
    }

    const data = await response.json();

    const reply: string =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text || "")
        .join("") || "";

    if (!reply) {
      const finishReason = data?.candidates?.[0]?.finishReason;
      return res.status(200).json({
        success: true,
        reply:
          finishReason === "SAFETY"
            ? "ဤမေးခွန်းအတွက် အဖြေမပေးနိုင်ပါ။ ကျေးဇူးပြု၍ တခြားနည်းဖြင့် မေးပေးပါ။"
            : "အဖြေမရရှိပါ။ ထပ်မံကြိုးစားကြည့်ပါ။",
      });
    }

    return res.status(200).json({ success: true, reply });
  } catch (error: any) {
    console.error("AI assistant error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
