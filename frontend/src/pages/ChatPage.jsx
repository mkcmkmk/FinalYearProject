import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/authContext";
import StudentLayout from "../components/StudentLayout";
import TeacherLayout from "../components/TeacherLayout";
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
  const { user, login } = useAuth();
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
      // Keep existing session state if user lookup fails
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

  if (loadingRooms) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#e8ecf3] text-gray-500 font-medium">
        Loading chat rooms...
      </div>
    );
  }

  const Layout = user?.role === "teacher" ? TeacherLayout : StudentLayout;

  return (
    <Layout>
      <div className="flex gap-4 h-full overflow-hidden">
        {/* Rooms Sidebar */}
        <aside className="w-[30%] bg-white rounded-[2rem] p-6 shadow-sm flex flex-col overflow-hidden h-full">
          <div className="flex justify-between items-center mb-6 pl-2 pr-2">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Your spaces</p>
              <h2 className="text-xl font-extrabold text-gray-900">Chat Rooms</h2>
            </div>
            <span className="bg-purple-100 text-purple-600 text-xs px-2.5 py-1 rounded-full font-bold">{rooms.length}</span>
          </div>

          {error && <div className="p-3 mb-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold">{error}</div>}

          {rooms.length === 0 ? (
            <div className="text-center py-10 text-gray-400 font-bold text-sm bg-gray-50 rounded-[1.5rem] flex-1 flex items-center justify-center">
              {user?.role === "student"
                ? "Join a group first to unlock chat."
                : "No chat rooms available."}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 custom-scrollbar">
              {rooms.map((room) => {
                const isActive = room.id === activeRoomId;
                return (
                  <button key={room.id} className={`w-full text-left p-4 rounded-[1.5rem] border-2 transition-all ${
                    isActive ? "bg-[#f4f7fe] border-blue-500" : "bg-white border-gray-50 hover:bg-gray-50"
                  }`} onClick={() => setActiveRoomId(room.id)}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="pr-2">
                        <strong className="text-sm font-extrabold text-gray-800 block leading-snug">{room.title}</strong>
                        <span className="text-[12px] text-gray-400 font-medium block mt-0.5">{room.subtitle}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${
                        room.roomType === "teachers" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                      }`}>{room.roomType === "teachers" ? "Lounge" : "Group"}</span>
                    </div>
                    <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">{room.participants?.length || 0} participants</div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {/* Chat Pane */}
        <main className="flex-1 bg-white rounded-[2rem] p-7 shadow-sm flex flex-col overflow-hidden h-full">
          {activeRoom ? (
            <div className="flex flex-col h-full justify-between">
              {/* Active Room Top */}
              <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-4">
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{getRoomTypeLabel(activeRoom.roomType)}</p>
                  <h2 className="text-[22px] font-extrabold text-gray-900 leading-snug">{activeRoom.title}</h2>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">{activeRoom.subtitle}</p>
                </div>
                <div className="flex gap-2">
                  <span className="bg-gray-50 px-3 py-1.5 rounded-full text-xs font-bold text-gray-500 border border-gray-100">{activeRoom.participants?.length || 0} members</span>
                </div>
              </div>

              {/* Messages viewport */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 custom-scrollbar">
                {loadingMessages && <div className="text-center py-4 text-xs font-bold text-gray-400">Loading messages...</div>}
                {!loadingMessages && messages.length === 0 && (
                  <div className="text-center py-10 text-gray-400 font-medium text-sm">No messages yet. Send a message to start.</div>
                )}
                {messages.map((message) => {
                  const mine = String(message.sender?._id || message.sender?.id || "") === String(currentUserId);
                  return (
                    <article key={message._id} className={`flex gap-3 max-w-[80%] ${mine ? "ml-auto flex-row-reverse" : ""}`}>
                      <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-600 font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
                        {getInitial(message.sender?.name)}
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className={`flex items-center gap-2 text-xs ${mine ? "justify-end" : ""}`}>
                          <strong className="text-gray-700 font-bold">{mine ? "You" : message.sender?.name || "Member"}</strong>
                          <span className="text-gray-400 font-medium text-[10px] uppercase">({message.sender?.role || "user"})</span>
                          <time className="text-[10px] text-gray-400 font-medium">{formatTime(message.createdAt)}</time>
                        </div>
                        <div className={`px-5 py-3.5 rounded-[1.5rem] text-sm font-semibold leading-relaxed break-words w-fit ${
                          mine ? "bg-[#1e1e1e] text-white rounded-tr-none ml-auto" : "bg-[#f8f9fb] text-gray-800 rounded-tl-none border border-gray-50"
                        }`}>
                          <p>{message.body}</p>
                        </div>
                      </div>
                    </article>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Composer */}
              <form onSubmit={handleSend} className="bg-[#f8f9fb] border border-gray-100 rounded-[1.5rem] p-4 flex flex-col gap-3">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={`Message ${activeRoom.title}...`}
                  rows="2"
                  className="bg-transparent border-0 focus:ring-0 text-sm font-semibold text-gray-700 focus:outline-none placeholder-gray-400 w-full resize-none"
                />
                <div className="flex justify-between items-center border-t border-gray-100/50 pt-3">
                  <span className="text-[11px] font-bold text-gray-400">Press Send to post instantly.</span>
                  <button className="px-5 py-2.5 bg-[#1e1e1e] text-white rounded-[1.25rem] font-bold text-xs hover:bg-black transition-colors disabled:opacity-50" type="submit" disabled={sending || !draft.trim()}>
                    {sending ? "Sending..." : "Send"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <h2 className="text-xl font-bold text-gray-800">No room selected</h2>
              <p className="text-sm text-gray-400 mt-1">Select a classroom group chat from the sidebar space list to begin.</p>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
};

export default ChatPage;
