import { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./StudentAIChat.css";

const initialGreeting = (name) => ({
  role: "assistant",
  content: `Hi ${name || "there"}, I am your Harmoniq AI assistant. Ask me about practice plans, instruments, classes, or music learning tips.`,
});

const StudentAIChat = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => [initialGreeting(user?.name)]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  useEffect(() => {
    setMessages((current) => {
      if (current.length !== 1 || current[0]?.role !== "assistant") {
        return current;
      }

      return [initialGreeting(user?.name)];
    });
  }, [user?.name]);

  const sendMessage = async (event) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in again to use the assistant.");
      return;
    }

    const nextMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:3000/api/ai/chat",
        { messages: nextMessages },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: response.data?.reply || "I could not generate a response right now.",
        },
      ]);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to reach the assistant right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-ai-shell">
      {isOpen ? (
        <div className="student-ai-panel">
          <div className="student-ai-header">
            <div>
              <p className="student-ai-kicker">Harmoniq AI</p>
              <h3>Student assistant</h3>
            </div>
            <button
              type="button"
              className="student-ai-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close AI assistant"
            >
              x
            </button>
          </div>

          <div className="student-ai-messages">
            {messages.map((message, index) => (
              <div
                className={`student-ai-bubble ${message.role === "user" ? "student-ai-bubble--user" : "student-ai-bubble--assistant"}`}
                key={`${message.role}-${index}`}
              >
                {message.content}
              </div>
            ))}
            {loading ? <div className="student-ai-status">Thinking...</div> : null}
            <div ref={messagesEndRef} />
          </div>

          {error ? <div className="student-ai-error">{error}</div> : null}

          <form className="student-ai-form" onSubmit={sendMessage}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about practice, theory, instrument basics, or your classes..."
              rows="3"
            />
            <button type="submit" disabled={loading || !input.trim()}>
              {loading ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        className="student-ai-launcher"
        onClick={() => setIsOpen((current) => !current)}
        aria-label="Open AI assistant"
      >
        AI Chat
      </button>
    </div>
  );
};

export default StudentAIChat;
