import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import "./ChatPage.css";

const CHAT_API = "http://localhost:3000/api/chat";

const formatTime = (value) =>
  new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

const getInitial = (name) => String(name || "U").charAt(0).toUpperCase();

const getRoomTypeLabel = (roomType) =>
  roomType === "teachers" ? "Teacher lounge" : "Group room";

const ChatPage = () => {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const bottomRef = useRef(null);

  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const currentUserId = user?.id || user?._id || "";

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const activeRoom = useMemo(
    () => rooms.find((room) => room.id === activeRoomId) || null,
    [rooms, activeRoomId]
  );

  const syncCurrentUser = async () => {
    if (!token) return;

    try {
      const res = await axios.get("http://localhost:3000/api/users/me", authHeaders);
      if (res.data?.success && res.data?.user) {
        login(res.data.user);
      }
    } catch {
      // Keep existing session state if the user lookup fails.
    }
  };

  const loadRooms = async () => {
    if (!token) {
      setError("Please log in first.");
      setLoadingRooms(false);
      return;
    }

    try {
      setLoadingRooms(true);
      setError("");
      const res = await axios.get(`${CHAT_API}/rooms`, authHeaders);
      const availableRooms = res.data?.rooms || [];
      setRooms(availableRooms);
      setActiveRoomId((current) => {
        const exists = availableRooms.some((room) => room.id === current);
        return exists ? current : availableRooms[0]?.id || "";
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load chat rooms");
    } finally {
      setLoadingRooms(false);
    }
  };

  const loadMessages = async (roomId, keepError = false) => {
    if (!roomId) {
      setMessages([]);
      return;
    }

    try {
      setLoadingMessages(true);
      if (!keepError) setError("");
      const res = await axios.get(`${CHAT_API}/rooms/${roomId}/messages`, authHeaders);
      setMessages(res.data?.messages || []);
    } catch (err) {
      setMessages([]);
      setError(err?.response?.data?.message || "Unable to load messages");
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    syncCurrentUser();
    loadRooms();
  }, []);

  useEffect(() => {
    loadMessages(activeRoomId);
  }, [activeRoomId]);

  useEffect(() => {
    if (!activeRoomId) return undefined;

    const intervalId = window.setInterval(() => {
      loadMessages(activeRoomId, true);
    }, 6000);

    return () => window.clearInterval(intervalId);
  }, [activeRoomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !activeRoomId) return;

    try {
      setSending(true);
      setError("");
      const res = await axios.post(
        `${CHAT_API}/rooms/${activeRoomId}/messages`,
        { body },
        authHeaders
      );
      setMessages((prev) => [...prev, res.data.message]);
      setDraft("");
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to send message");
    } finally {
      setSending(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const goHome = () => {
    if (user?.role === "teacher") navigate("/teacher-dashboard");
    else navigate("/student-dashboard");
  };

  if (loadingRooms) {
    return <div className="chat-loading">Loading chat...</div>;
  }

  return (
    <div className="chat-page">
      <header className="chat-topbar">
        <div>
          <p className="chat-kicker">Harmoniq Chat</p>
          <h1>{user?.role === "teacher" ? "Teacher & Group Messaging" : "Group Chat"}</h1>
          <p className="chat-subtitle">
            {user?.role === "teacher"
              ? "Talk with your students inside each teaching group and coordinate with other teachers in the lounge."
              : "Stay in touch with your teacher and classmates inside your group room."}
          </p>
        </div>
        <div className="chat-top-actions">
          <button className="chat-btn chat-btn--ghost" onClick={goHome}>Back to dashboard</button>
          <button className="chat-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {error ? <div className="chat-banner">{error}</div> : null}

      <div className="chat-shell">
        <aside className="chat-sidebar">
          <div className="chat-sidebar-head">
            <div>
              <p className="chat-section-kicker">Your spaces</p>
              <h2>Rooms</h2>
            </div>
            <span className="chat-count-pill">{rooms.length}</span>
          </div>

          {rooms.length === 0 ? (
            <div className="chat-empty-note">
              {user?.role === "student"
                ? "You do not have a group room yet. Join a group first to unlock chat."
                : "No chat rooms are available yet."}
            </div>
          ) : (
            <div className="chat-room-list">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  className={room.id === activeRoomId ? "chat-room active" : "chat-room"}
                  onClick={() => setActiveRoomId(room.id)}
                >
                  <div className="chat-room-top">
                    <div>
                      <strong>{room.title}</strong>
                      <span>{room.subtitle}</span>
                    </div>
                    <span className="chat-room-badge">{room.roomType === "teachers" ? "Lounge" : "Group"}</span>
                  </div>
                  <div className="chat-room-meta">{room.participants?.length || 0} participants</div>
                </button>
              ))}
            </div>
          )}

          {activeRoom?.participants?.length ? (
            <div className="chat-members-card">
              <div className="chat-members-head">
                <div>
                  <p className="chat-section-kicker">In this room</p>
                  <h3>Participants</h3>
                </div>
                <span className="chat-count-pill">{activeRoom.participants.length}</span>
              </div>
              <div className="chat-members">
                {activeRoom.participants.map((member) => (
                  <div className="chat-member" key={member.id}>
                    <div className="chat-member-avatar">
                      {member.profileImage ? (
                        <img src={member.profileImage} alt={member.name} />
                      ) : (
                        getInitial(member.name)
                      )}
                    </div>
                    <div>
                      <strong>{member.name}</strong>
                      <span>{member.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </aside>

        <main className="chat-main">
          {activeRoom ? (
            <>
              <div className="chat-room-head">
                <div>
                  <p className="chat-section-kicker">{getRoomTypeLabel(activeRoom.roomType)}</p>
                  <h2>{activeRoom.title}</h2>
                  <p>{activeRoom.subtitle}</p>
                </div>
                <div className="chat-room-summary">
                  <span className="chat-room-pill">{activeRoom.participants?.length || 0} participants</span>
                  <span className="chat-room-pill chat-room-pill--ghost">
                    {activeRoom.roomType === "teachers" ? "Teachers only" : "Student group"}
                  </span>
                </div>
              </div>

              <div className="chat-messages">
                {loadingMessages ? <div className="chat-empty-note">Loading messages...</div> : null}
                {!loadingMessages && messages.length === 0 ? (
                  <div className="chat-empty-note">No messages yet. Start the conversation.</div>
                ) : null}
                {messages.map((message) => {
                  const mine = String(message.sender?._id || message.sender?.id || "") === String(currentUserId);
                  return (
                    <article key={message._id} className={mine ? "chat-message-row mine" : "chat-message-row"}>
                      {!mine ? (
                        <div className="chat-avatar">{getInitial(message.sender?.name)}</div>
                      ) : null}
                      <div className={mine ? "chat-bubble mine" : "chat-bubble"}>
                        <div className="chat-bubble-head">
                          <div className="chat-bubble-meta">
                            <strong>{mine ? "You" : message.sender?.name || "Member"}</strong>
                            <span>{message.sender?.role || "user"}</span>
                          </div>
                          <time>{formatTime(message.createdAt)}</time>
                        </div>
                        <p>{message.body}</p>
                      </div>
                      {mine ? <div className="chat-avatar chat-avatar--mine">{getInitial(message.sender?.name || user?.name)}</div> : null}
                    </article>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <form className="chat-composer" onSubmit={handleSend}>
                <div className="chat-composer-head">
                  <div>
                    <strong>Send a message</strong>
                    <span>Everyone in this room will see it instantly after refresh.</span>
                  </div>
                  <span className="chat-compose-badge">{activeRoom.title}</span>
                </div>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={`Message ${activeRoom.title}...`}
                  rows="3"
                />
                <div className="chat-composer-actions">
                  <p>Press send to post your message.</p>
                  <button className="chat-btn" type="submit" disabled={sending || !draft.trim()}>
                    {sending ? "Sending..." : "Send"}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="chat-empty-state">
              <h2>No room selected</h2>
              <p>Select a room from the left to start chatting.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ChatPage;
