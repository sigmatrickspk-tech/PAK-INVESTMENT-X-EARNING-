var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_meta = {};
import_dotenv.default.config();
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = import_path.default.dirname(__filename);
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "10mb" }));
  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is missing.");
    }
    return new import_genai.GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  };
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      service: "PAK INVESTMENT X EARNING Backend API",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      hasGeminiKey: !!process.env.GEMINI_API_KEY
    });
  });
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history, ticketSubject, userName, category } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message text is required." });
      }
      const ai = getAiClient();
      const systemInstruction = `You are the official AI Live Support Assistant for "PAK INVESTMENT X EARNING" - Pakistan's premier online financial earning & investment platform.
Your primary role is to answer user questions instantly, clearly, and politely in live chat, helping them with deposits, withdrawals, investment plans, referral bonuses, earning tasks, promo codes, and account issues.

Key Platform Info:
- Minimum Deposit: 100 PKR.
- Minimum Withdrawal: 200 PKR.
- Deposit & Withdrawal Methods: JazzCash & EasyPaisa (processed & manually verified by Admin team within 24 hours).
- Investment Plans: High yield plans with daily returns (e.g. Starter Plan 1,000 PKR, VIP Plans up to 50,000 PKR).
- Referral System: Earn direct cash commission when referred friends register and invest.
- Promo Codes: Users claim instant balance rewards by entering promo codes.
- Earning Tasks: Daily check-in rewards, watching video ads, taking quick surveys.
- Support: Admin team monitors all live chats in real-time and can jump in anytime.

Guidelines:
1. Provide accurate, direct, friendly, and helpful answers in clean formatting.
2. Use clear bullet points if listing steps (e.g., how to deposit or withdraw).
3. If a question requires manual account verification (e.g., specific transaction TID verification), reassure the user that their full chat transcript is saved and visible to the Admin team in real-time.
4. Keep replies concise, readable, and customer-focused.`;
      let promptText = "";
      if (Array.isArray(history) && history.length > 0) {
        promptText += "--- Conversation History ---\n";
        history.slice(-6).forEach((h) => {
          promptText += `${h.senderName || h.sender}: ${h.text}
`;
        });
        promptText += "---------------------------\n";
      }
      promptText += `User Question (${userName || "User"}): ${message}`;
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: promptText,
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });
      const replyText = response.text || "Thank you for reaching out! Our official support team will also review your query shortly.";
      return res.json({
        reply: replyText,
        timestamp: Date.now(),
        sender: "ai",
        senderName: "\u{1F916} AI Support Assistant"
      });
    } catch (err) {
      console.error("Error calling Gemini API in /api/chat:", err);
      return res.status(500).json({
        error: "AI chatbot service error",
        message: err?.message || "Failed to generate AI response.",
        fallbackReply: "Thank you for your message! Our human support admin team has received your ticket and will respond shortly."
      });
    }
  });
  app.post("/api/chat/summarize", async (req, res) => {
    try {
      const { ticketSubject, userEmail, userName, messages } = req.body;
      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Messages array is required for summary." });
      }
      const ai = getAiClient();
      const transcript = messages.map((m) => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.senderName || m.sender}: ${m.text}`).join("\n");
      const prompt = `Summarize the following support chat ticket for the Admin Panel:
User: ${userName} (${userEmail})
Subject: ${ticketSubject || "General Support Inquiry"}

Transcript:
${transcript}

Provide:
1. Short Summary (2-3 bullet points)
2. Core Issue / Action Required
3. Recommended Resolution`;
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an executive customer support manager summarizing support tickets for admins.",
          temperature: 0.3
        }
      });
      return res.json({
        summary: response.text || "Unable to generate summary.",
        timestamp: Date.now()
      });
    } catch (err) {
      console.error("Error generating chat summary:", err);
      return res.status(500).json({
        error: "Failed to generate chat summary",
        message: err?.message || "Error executing AI summary"
      });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\u{1F680} PAK INVESTMENT X EARNING Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
