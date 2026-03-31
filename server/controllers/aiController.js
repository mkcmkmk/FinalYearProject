const XAI_BASE_URL = "https://api.x.ai/v1";
const DEFAULT_MODEL = process.env.XAI_MODEL || "grok-3-mini";

const buildSystemPrompt = (user) => {
  const name = user?.name || "student";
  return [
    "You are Harmoniq Assistant, a helpful AI chatbot for music students.",
    `The current user is ${name} and their role is ${user?.role || "student"}.`,
    "Help with music learning, practice routines, instrument basics, motivation, course navigation, and subscription questions.",
    "Keep answers clear, supportive, and practical.",
    "If the user asks for something unrelated to Harmoniq or music learning, still help briefly and politely.",
  ].join(" ");
};

const sanitizeMessages = (messages) => {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .filter((message) => ["user", "assistant"].includes(message?.role))
    .map((message) => ({
      role: message.role,
      content: String(message.content || "").trim(),
    }))
    .filter((message) => message.content)
    .slice(-12);
};

const extractText = (payload) => {
  const outputItems = Array.isArray(payload?.output) ? payload.output : [];
  const text = outputItems
    .flatMap((item) => (item?.type === "message" ? item.content || [] : []))
    .filter((part) => part?.type === "output_text")
    .map((part) => part.text || "")
    .join("\n")
    .trim();

  return text || "I could not generate a response right now.";
};

export const chatWithAssistant = async (req, res) => {
  try {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        success: false,
        message: "XAI_API_KEY is not configured on the server yet.",
      });
    }

    const messages = sanitizeMessages(req.body?.messages);
    const latestUserMessage = [...messages].reverse().find((message) => message.role === "user");

    if (!latestUserMessage) {
      return res.status(400).json({
        success: false,
        message: "Please send a message before starting the chat.",
      });
    }

    const response = await fetch(`${XAI_BASE_URL}/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        store: false,
        input: [
          {
            role: "system",
            content: buildSystemPrompt(req.user),
          },
          ...messages,
        ],
      }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: payload?.error?.message || payload?.message || "Grok request failed.",
      });
    }

    return res.json({
      success: true,
      reply: extractText(payload),
      model: payload?.model || DEFAULT_MODEL,
      id: payload?.id || null,
    });
  } catch (error) {
    console.error("chatWithAssistant error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to reach the AI assistant right now.",
    });
  }
};
