const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const REQUEST_TIMEOUT_MS = 60000;
const FALLBACK_MODELS = ["mixtral-8x7b-32768", "llama-3.1-70b-versatile", "llama-3.1-8b-instant"];

const buildSystemPrompt = (user) => {
  const name = user?.name || "student";
  return [
    "You are Harmoniq Assistant, a helpful AI chatbot for music students.",
    `The current user is ${name} and their role is ${user?.role || "student"}.`,
    "Help with music learning, practice routines, instrument basics, motivation, course navigation, and subscription questions.",
    "Keep answers clear, supportive, and practical.",
    "Use plain text only. Do not include markdown formatting such as **bold**, *italics*, or markdown list syntax.",
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

const getPreferredModels = () => {
  return FALLBACK_MODELS;
};

const extractErrorMessage = (payload) => {
  if (typeof payload?.error === "string" && payload.error.trim()) {
    return payload.error.trim();
  }

  if (typeof payload?.error?.message === "string" && payload.error.message.trim()) {
    return payload.error.message.trim();
  }

  if (typeof payload?.message === "string" && payload.message.trim()) {
    return payload.message.trim();
  }

  if (typeof payload?.code === "string" && payload.code.trim()) {
    return payload.code.trim();
  }

  return "Groq request failed.";
};

const cleanAssistantText = (text) => {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const extractText = (payload) => {
  if (typeof payload?.choices?.[0]?.message?.content === "string") {
    return cleanAssistantText(payload.choices[0].message.content);
  }

  return "I could not generate a response right now.";
};

const shouldRetryWithNextModel = (status, message) => {
  if (![400, 404].includes(status)) {
    return false;
  }

  return /model|unknown|unsupported|not found|does not exist/i.test(String(message || ""));
};

const requestGroqResponse = async ({ apiKey, model, input }) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: input,
        max_tokens: 1024,
      }),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => ({}));
    return { response, payload };
  } finally {
    clearTimeout(timeoutId);
  }
};

export const chatWithAssistant = async (req, res) => {
  try {
    const apiKey = String(process.env.GROQ_API_KEY || "").trim();
    if (!apiKey) {
      return res.status(503).json({
        success: false,
        message: "GROQ_API_KEY is not configured on the server yet.",
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

    const input = [
      {
        role: "system",
        content: buildSystemPrompt(req.user),
      },
      ...messages,
    ];

    const modelsToTry = getPreferredModels();
    let lastError = null;

    for (const model of modelsToTry) {
      const { response, payload } = await requestGroqResponse({ apiKey, model, input });

      if (response.ok) {
        return res.json({
          success: true,
          reply: extractText(payload),
          model: payload?.model || model,
          id: payload?.id || null,
        });
      }

      const message = extractErrorMessage(payload);
      lastError = { status: response.status, message, model };

      if (!shouldRetryWithNextModel(response.status, message)) {
        break;
      }
    }

    return res.status(lastError?.status || 502).json({
      success: false,
      message: lastError?.message || "Groq request failed.",
      model: lastError?.model || null,
    });
  } catch (error) {
    console.error("chatWithAssistant error:", error);

    if (error?.name === "AbortError") {
      return res.status(504).json({
        success: false,
        message: "The AI assistant took too long to respond. Please try again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to reach the AI assistant right now.",
    });
  }
};
