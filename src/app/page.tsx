"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github-dark.css";

// ── Models ──────────────────────────────────────────────────────────
const MODELS = [
  // OpenAI (3 models)
  { id: "openai/gpt-5.4",                        name: "GPT-5.4",               sub: "OpenAI's latest frontier model",        provider: "OpenAI",     color: "#74aa9c" },
  { id: "openai/gpt-5.4-mini",                   name: "GPT-5.4 Mini",          sub: "Fast & efficient GPT-5.4 variant",      provider: "OpenAI",     color: "#74aa9c" },
  { id: "openai/gpt-4o",                         name: "GPT-4o",                sub: "Multimodal flagship, vision + text",     provider: "OpenAI",     color: "#74aa9c" },

  // Anthropic (3 models)
  { id: "anthropic/claude-sonnet-4-5",           name: "Claude Sonnet 4.5",     sub: "Anthropic's newest balanced flagship",   provider: "Anthropic",  color: "#cc785c" },
  { id: "anthropic/claude-sonnet-4",             name: "Claude Sonnet 4",       sub: "Strong coding & long-horizon tasks",     provider: "Anthropic",  color: "#cc785c" },
  { id: "anthropic/claude-opus-4-5",             name: "Claude Opus 4.5",       sub: "Most powerful Anthropic model",          provider: "Anthropic",  color: "#cc785c" },

  // Google
  { id: "google/gemini-2.5-flash-preview",       name: "Gemini 2.5 Flash",      sub: "Fast reasoning & coding by Google",      provider: "Google",     color: "#4285f4" },

  // Meta
  { id: "meta-llama/llama-3.3-70b-instruct",     name: "Llama 3.3 70B",         sub: "Meta's open-source powerhouse",          provider: "Meta",       color: "#0668E1" },

  // Mistral
  { id: "mistralai/mistral-small-3.1",           name: "Mistral Small 3.1",     sub: "Efficient, multilingual & smart",        provider: "Mistral",    color: "#f77f00" },

  // DeepSeek
  { id: "deepseek/deepseek-v3-0324",             name: "DeepSeek V3",           sub: "GPT-5 class, agentic reasoning",         provider: "DeepSeek",   color: "#5b8dee" },

  // xAI
  { id: "x-ai/grok-3",                           name: "Grok 3",                sub: "xAI's top reasoning model",              provider: "xAI",        color: "#e0e0e0" },
];

const SUGGESTED = [
  "How does AI work?",
  "Are black holes real?",
  `How many R's are in the word "strawberry"?`,
  "What is the meaning of life?",
];

const CATEGORIES = [
  { label: "Create",  icon: "✦" },
  { label: "Explore", icon: "⊕" },
  { label: "Code",    icon: "</>" },
  { label: "Learn",   icon: "◎" },
];

const MOCK_THREADS = {
  pinned:  ["Title not applicable"],
  today:   ["Explain quantum computing", "Write a Python script for data viz"],
  older:   ["React hooks tutorial", "CSS Grid vs Flexbox explained"],
};

// ── Provider icon letter ─────────────────────────────────────────────
function ProviderDot({ provider, color }: { provider: string; color: string }) {
  return (
    <span
      className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold shrink-0"
      style={{ background: color + "22", color, border: `1px solid ${color}55` }}
    >
      {provider[0]}
    </span>
  );
}

// ── User avatar ──────────────────────────────────────────────────────
function UserAvatar({ name, image, size = 32 }: { name?: string | null; image?: string | null; size?: number }) {
  const initials = name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() ?? "?";
  if (image) {
    return (
      <Image
        src={image} alt={name ?? "User"} width={size} height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center text-[#0a0a0a] font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38,
        background: "linear-gradient(135deg,#C9A84C,#E8D08A)" }}
    >
      {initials}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// CHAT INTERFACE  (shown when session is active)
// ════════════════════════════════════════════════════════════════════════
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  aiModel?: string;
  createdAt: string;
};

type ConversationType = {
  id: string;
  title: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
};

function ChatInterface({ user }: { user: { name?: string | null; email: string; image?: string | null } }) {
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [modelOpen, setModelOpen]         = useState(false);
  const [userMenuOpen, setUserMenuOpen]   = useState(false);
  const [sidebarOpen, setSidebarOpen]     = useState(true);
  const [message, setMessage]             = useState("");
  const [activeCategory, setActiveCategory] = useState("Create");
  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages]           = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading]         = useState(false);
  const [searchQuery, setSearchQuery]     = useState("");
  const [timeFilter, setTimeFilter]       = useState<"all" | "today" | "week" | "older">("all");
  const [deleteMenuOpen, setDeleteMenuOpen] = useState<string | null>(null);

  const modelRef   = useRef<HTMLDivElement>(null);
  const userRef    = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) setModelOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const loadConversations = async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setCurrentConversationId(conversationId);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message;
    setMessage("");
    setIsLoading(true);

    // Optimistically add user message to UI
    const tempUserMsg: ChatMessage = {
      id: "temp-user-" + Date.now(),
      role: "user",
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    // Add temporary assistant message for streaming
    const tempAssistantMsg: ChatMessage = {
      id: "temp-assistant-" + Date.now(),
      role: "assistant",
      content: "",
      aiModel: selectedModel.id,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempAssistantMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationId: currentConversationId,
          model: selectedModel.id,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      // Handle streaming response
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      let streamedContent = "";
      let realUserMessageId = "";
      let realAssistantMessageId = "";
      let newConversationId = currentConversationId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "start") {
                // Update with real user message ID
                realUserMessageId = data.userMessage.id;
                newConversationId = data.conversationId;
                
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === tempUserMsg.id
                      ? { ...data.userMessage }
                      : m
                  )
                );
              } else if (data.type === "content") {
                // Stream content to assistant message
                streamedContent += data.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === tempAssistantMsg.id
                      ? { ...m, content: streamedContent }
                      : m
                  )
                );
              } else if (data.type === "done") {
                // Replace temp assistant message with real one
                realAssistantMessageId = data.assistantMessage.id;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === tempAssistantMsg.id
                      ? { ...data.assistantMessage }
                      : m
                  )
                );
              } else if (data.type === "error") {
                throw new Error(data.error);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Update conversation ID if it's a new conversation
      if (!currentConversationId && newConversationId) {
        setCurrentConversationId(newConversationId);
        loadConversations(); // Reload to show new conversation in sidebar
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      // Remove temp messages on error
      setMessages((prev) =>
        prev.filter(
          (m) => m.id !== tempUserMsg.id && m.id !== tempAssistantMsg.id
        )
      );
      alert("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm("Are you sure you want to delete this conversation?")) return;

    try {
      const res = await fetch(`/api/conversations?id=${conversationId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // Remove from list
        setConversations((prev) => prev.filter((c) => c.id !== conversationId));
        // If it was the current conversation, clear messages
        if (currentConversationId === conversationId) {
          setCurrentConversationId(null);
          setMessages([]);
        }
      } else {
        alert("Failed to delete conversation");
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      alert("Failed to delete conversation");
    }
  };

  // Filter conversations based on search and time filter
  const getFilteredConversations = () => {
    let filtered = conversations;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((conv) =>
        conv.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply time filter
    if (timeFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter((conv) => {
        const convDate = new Date(conv.updatedAt);
        if (timeFilter === "today") {
          return convDate >= today;
        } else if (timeFilter === "week") {
          return convDate >= weekAgo && convDate < today;
        } else if (timeFilter === "older") {
          return convDate < weekAgo;
        }
        return true;
      });
    }

    return filtered;
  };

  const firstName = user.name?.split(" ")[0] ?? "there";
  const filteredConversations = getFilteredConversations();

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-[#f0e8d0] overflow-hidden">

      {/* ── SIDEBAR ─────────────────────────────── */}
      <aside
        className={`flex flex-col shrink-0 border-r border-[rgba(201,168,76,0.1)] bg-[#0e0e0e] transition-all duration-300 ${
          sidebarOpen ? "w-[240px]" : "w-0 overflow-hidden"
        }`}
      >
        {/* Logo + toggle */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[rgba(201,168,76,0.08)]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#1a1500] to-[#2a2000] border border-[rgba(201,168,76,0.3)] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 28 28" fill="none">
                <path d="M14 2L4 7v14l10 5 10-5V7L14 2z" stroke="#C9A84C" strokeWidth="1.8" strokeLinejoin="round"/>
                <path d="M14 2v19M4 7l10 5 10-5" stroke="#C9A84C" strokeWidth="1.8" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-sm font-semibold text-[#e8d5a0] tracking-tight">MultiModel</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-[rgba(240,232,208,0.3)] hover:text-[rgba(240,232,208,0.7)] transition-colors cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        </div>

        {/* New Chat */}
        <div className="px-3 pt-3 pb-2">
          <button onClick={handleNewChat} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#E8D08A] text-[#0a0a0a] text-sm font-bold cursor-pointer hover:-translate-y-0.5 transition-transform shadow-[0_2px_12px_rgba(201,168,76,0.3)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Chat
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <div className="relative flex items-center">
            <svg className="absolute left-2.5 w-3.5 h-3.5 text-[rgba(240,232,208,0.25)] pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search your threads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-lg text-xs text-[rgba(240,232,208,0.5)] placeholder-[rgba(240,232,208,0.2)] outline-none focus:border-[rgba(201,168,76,0.3)] transition-colors"
            />
          </div>
        </div>

        {/* Time Filters */}
        <div className="px-3 pb-3">
          <div className="flex gap-1">
            {[
              { value: "all", label: "All" },
              { value: "today", label: "Today" },
              { value: "week", label: "Week" },
              { value: "older", label: "Older" },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setTimeFilter(filter.value as any)}
                className={`flex-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                  timeFilter === filter.value
                    ? "bg-[rgba(201,168,76,0.15)] text-[#C9A84C]"
                    : "text-[rgba(240,232,208,0.4)] hover:text-[rgba(240,232,208,0.7)] hover:bg-[rgba(255,255,255,0.04)]"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-4 scrollbar-hide">
          {filteredConversations.filter(c => c.isPinned).length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-2 py-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#C9A84C" stroke="#C9A84C" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                <span className="text-[10px] font-semibold text-[#C9A84C] uppercase tracking-wider">Pinned</span>
              </div>
              {filteredConversations.filter(c => c.isPinned).map(conv => (
                <div
                  key={conv.id}
                  className="group relative"
                >
                  <button
                    onClick={() => loadMessages(conv.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer truncate ${
                      currentConversationId === conv.id
                        ? "bg-[rgba(201,168,76,0.15)] text-[rgba(240,232,208,0.95)]"
                        : "text-[rgba(240,232,208,0.55)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[rgba(240,232,208,0.85)]"
                    }`}
                  >
                    {conv.title}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conv.id);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[rgba(239,68,68,0.15)] transition-all"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(239,68,68,0.8)" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {filteredConversations.filter(c => !c.isPinned).length > 0 && (
            <div>
              <p className="px-2 py-1 text-[10px] font-semibold text-[rgba(240,232,208,0.25)] uppercase tracking-wider">Conversations</p>
              {filteredConversations.filter(c => !c.isPinned).map(conv => (
                <div
                  key={conv.id}
                  className="group relative"
                >
                  <button
                    onClick={() => loadMessages(conv.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer truncate ${
                      currentConversationId === conv.id
                        ? "bg-[rgba(201,168,76,0.15)] text-[rgba(240,232,208,0.95)]"
                        : "text-[rgba(240,232,208,0.55)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[rgba(240,232,208,0.85)]"
                    }`}
                  >
                    {conv.title}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conv.id);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[rgba(239,68,68,0.15)] transition-all"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(239,68,68,0.8)" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {filteredConversations.length === 0 && (
            <div className="px-2 py-8 text-center">
              <p className="text-xs text-[rgba(240,232,208,0.3)]">
                {searchQuery ? "No conversations found" : "No conversations yet"}
              </p>
            </div>
          )}
        </div>

        {/* User profile bottom */}
        <div className="border-t border-[rgba(201,168,76,0.08)] p-3">
          <div className="flex items-center gap-2.5">
            <UserAvatar name={user.name} image={user.image} size={32} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#f0e8d0] truncate">{user.name ?? user.email}</p>
              <p className="text-[10px] text-[rgba(240,232,208,0.3)] truncate">{user.email}</p>
            </div>
          </div>
          <div className="mt-2 flex gap-1">
            <button className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-[rgba(240,232,208,0.45)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[rgba(240,232,208,0.8)] transition-colors cursor-pointer">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
              Settings
            </button>
            <button
              onClick={() => signOut({ fetchOptions: { onSuccess: () => window.location.reload() } })}
              className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-[rgba(240,232,208,0.45)] hover:bg-[rgba(239,68,68,0.08)] hover:text-[#fca5a5] transition-colors cursor-pointer"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN AREA ────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Topbar */}
        <header className="flex items-center justify-between px-5 py-3 border-b border-[rgba(201,168,76,0.08)]">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="text-[rgba(240,232,208,0.3)] hover:text-[rgba(240,232,208,0.7)] transition-colors cursor-pointer mr-1">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
            )}
            {!sidebarOpen && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#1a1500] to-[#2a2000] border border-[rgba(201,168,76,0.3)] flex items-center justify-center">
                  <svg width="11" height="11" viewBox="0 0 28 28" fill="none">
                    <path d="M14 2L4 7v14l10 5 10-5V7L14 2z" stroke="#C9A84C" strokeWidth="2" strokeLinejoin="round"/>
                    <path d="M14 2v19M4 7l10 5 10-5" stroke="#C9A84C" strokeWidth="2" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-sm font-semibold text-[#e8d5a0]">MultiModel</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* History icon */}
            <button className="text-[rgba(240,232,208,0.3)] hover:text-[rgba(240,232,208,0.7)] transition-colors cursor-pointer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </button>

            {/* User dropdown */}
            <div className="relative" ref={userRef}>
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-[rgba(255,255,255,0.05)] transition-colors cursor-pointer">
                <UserAvatar name={user.name} image={user.image} size={28} />
                <span className="text-sm text-[rgba(240,232,208,0.7)] font-medium hidden sm:block">{user.name?.split(" ")[0] ?? "User"}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`text-[rgba(240,232,208,0.3)] transition-transform ${userMenuOpen ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"/></svg>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#141414] border border-[rgba(201,168,76,0.15)] rounded-xl shadow-2xl overflow-hidden z-50">
                  {/* User info header */}
                  <div className="px-3 py-2.5 border-b border-[rgba(255,255,255,0.06)]">
                    <p className="text-xs font-semibold text-[#f0e8d0] truncate">{user.name}</p>
                    <p className="text-[10px] text-[rgba(240,232,208,0.35)] truncate">{user.email}</p>
                  </div>
                  <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-[rgba(240,232,208,0.6)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[rgba(240,232,208,0.9)] transition-colors cursor-pointer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Profile
                  </button>
                  <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-[rgba(240,232,208,0.6)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[rgba(240,232,208,0.9)] transition-colors cursor-pointer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
                    Settings
                  </button>
                  <div className="border-t border-[rgba(255,255,255,0.06)]">
                    <button
                      onClick={() => signOut({ fetchOptions: { onSuccess: () => window.location.reload() } })}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-[rgba(239,68,68,0.7)] hover:bg-[rgba(239,68,68,0.08)] hover:text-[#fca5a5] transition-colors cursor-pointer"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Center content */}
        <main className="flex-1 flex flex-col px-4 pb-8 pt-4 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-full max-w-2xl flex flex-col items-center gap-6">
                {/* Greeting */}
                <div className="text-center">
                  <h1 className="text-3xl font-bold text-[#f0e8d0] tracking-tight">
                    How can I help you,{" "}
                    <span className="bg-gradient-to-r from-[#C9A84C] to-[#E8D08A] bg-clip-text text-transparent">
                      {firstName}?
                    </span>
                  </h1>
                </div>

                {/* Category pills */}
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.label}
                      onClick={() => setActiveCategory(c.label)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all ${
                        activeCategory === c.label
                          ? "bg-[rgba(201,168,76,0.15)] border border-[rgba(201,168,76,0.4)] text-[#C9A84C]"
                          : "bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] text-[rgba(240,232,208,0.5)] hover:border-[rgba(201,168,76,0.2)] hover:text-[rgba(240,232,208,0.8)]"
                      }`}
                    >
                      <span className="text-[13px]">{c.icon}</span>
                      {c.label}
                    </button>
                  ))}
                </div>

                {/* Suggested prompts */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SUGGESTED.map(p => (
                    <button
                      key={p}
                      onClick={() => setMessage(p)}
                      className="text-left px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] text-sm text-[rgba(240,232,208,0.55)] hover:bg-[rgba(201,168,76,0.06)] hover:border-[rgba(201,168,76,0.2)] hover:text-[rgba(240,232,208,0.85)] transition-all cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-4xl mx-auto space-y-8">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "items-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1a1500] to-[#2a2000] border border-[rgba(201,168,76,0.3)] flex items-center justify-center shrink-0 mt-1">
                      <svg width="14" height="14" viewBox="0 0 28 28" fill="none">
                        <path d="M14 2L4 7v14l10 5 10-5V7L14 2z" stroke="#C9A84C" strokeWidth="1.8" strokeLinejoin="round"/>
                        <path d="M14 2v19M4 7l10 5 10-5" stroke="#C9A84C" strokeWidth="1.8" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                  <div className={`flex-1 ${msg.role === "user" ? "max-w-[70%]" : ""}`}>
                    {msg.role === "user" ? (
                      <div className="px-4 py-3 rounded-2xl bg-gradient-to-r from-[#C9A84C] to-[#E8D08A] text-[#0a0a0a]">
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ) : (
                      <>
                        {msg.content ? (
                          <div className="markdown-content text-sm">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeHighlight, rehypeRaw]}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-[#C9A84C] animate-bounce" style={{ animationDelay: "0ms" }}></div>
                            <div className="w-2 h-2 rounded-full bg-[#C9A84C] animate-bounce" style={{ animationDelay: "150ms" }}></div>
                            <div className="w-2 h-2 rounded-full bg-[#C9A84C] animate-bounce" style={{ animationDelay: "300ms" }}></div>
                          </div>
                        )}
                        {msg.aiModel && msg.content && (
                          <p className="text-[10px] text-[rgba(240,232,208,0.25)] mt-2">
                            {MODELS.find(m => m.id === msg.aiModel)?.name || msg.aiModel}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <UserAvatar name={user.name} image={user.image} size={32} />
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* Message composer */}
        <div className="px-4 pb-5">
          <div className="max-w-2xl mx-auto">
            <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(201,168,76,0.15)] rounded-2xl focus-within:border-[rgba(201,168,76,0.35)] focus-within:shadow-[0_0_0_3px_rgba(201,168,76,0.06)] transition-all">
              <textarea
                rows={2}
                placeholder="Type your message here…"
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => { 
                  if (e.key === "Enter" && !e.shiftKey) { 
                    e.preventDefault(); 
                    handleSendMessage();
                  } 
                }}
                className="w-full px-4 pt-3.5 pb-2 bg-transparent text-[#f0e8d0] text-sm placeholder-[rgba(240,232,208,0.22)] outline-none resize-none"
              />

              {/* Bottom toolbar */}
              <div className="flex items-center justify-between px-3 pb-3 pt-1">
                <div className="flex items-center gap-1">

                  {/* Model selector */}
                  <div className="relative" ref={modelRef}>
                    <button
                      onClick={() => setModelOpen(!modelOpen)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[rgba(201,168,76,0.08)] border border-[rgba(201,168,76,0.2)] text-[11px] font-medium text-[#C9A84C] hover:bg-[rgba(201,168,76,0.14)] transition-colors cursor-pointer"
                    >
                      <ProviderDot provider={selectedModel.provider} color={selectedModel.color} />
                      {selectedModel.name}
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${modelOpen ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"/></svg>
                    </button>

                    {modelOpen && (
                      <div className="absolute left-0 bottom-full mb-2 w-72 bg-[#141414] border border-[rgba(201,168,76,0.15)] rounded-2xl shadow-2xl overflow-hidden z-50">
                        <div className="px-3 pt-3 pb-2 border-b border-[rgba(255,255,255,0.06)]">
                          <p className="text-[10px] font-semibold text-[rgba(240,232,208,0.3)] uppercase tracking-wider">Select Model</p>
                        </div>
                        <div className="max-h-72 overflow-y-auto py-1">
                          {MODELS.map(m => (
                            <button
                              key={m.id}
                              onClick={() => { setSelectedModel(m); setModelOpen(false); }}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors cursor-pointer ${
                                selectedModel.id === m.id
                                  ? "bg-[rgba(201,168,76,0.1)]"
                                  : "hover:bg-[rgba(255,255,255,0.04)]"
                              }`}
                            >
                              <ProviderDot provider={m.provider} color={m.color} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-[#f0e8d0] truncate">{m.name}</p>
                                <p className="text-[10px] text-[rgba(240,232,208,0.35)] truncate">{m.sub}</p>
                              </div>
                              {selectedModel.id === m.id && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Search toggle */}
                  <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[rgba(255,255,255,0.07)] text-[11px] text-[rgba(240,232,208,0.4)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[rgba(240,232,208,0.7)] transition-colors cursor-pointer">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    Search
                  </button>

                  {/* Attach */}
                  <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[rgba(255,255,255,0.07)] text-[11px] text-[rgba(240,232,208,0.4)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[rgba(240,232,208,0.7)] transition-colors cursor-pointer">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                    Attach
                  </button>
                </div>

                {/* Send */}
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isLoading}
                  className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#E8D08A] flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_2px_12px_rgba(201,168,76,0.4)] transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2.5"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
                </button>
              </div>
            </div>
            <p className="text-center text-[10px] text-[rgba(240,232,208,0.18)] mt-2">
              AI can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// LANDING PAGE  (shown when not authenticated)
// ════════════════════════════════════════════════════════════════════════
function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(201,168,76,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,0.04) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(201,168,76,0.1)_0%,transparent_65%)] blur-[80px]" />
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1a1500] to-[#2a2000] border border-[rgba(201,168,76,0.3)] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 28 28" fill="none"><path d="M14 2L4 7v14l10 5 10-5V7L14 2z" stroke="#C9A84C" strokeWidth="1.5" strokeLinejoin="round"/><path d="M14 2v19M4 7l10 5 10-5" stroke="#C9A84C" strokeWidth="1.5" strokeLinejoin="round"/></svg>
          </div>
          <span className="text-xs font-semibold text-[rgba(201,168,76,0.7)] uppercase tracking-[3px]">MultiModel AI</span>
        </div>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-[#f0e8d0] leading-[1.08] tracking-[-2px] max-w-2xl">
          Ready to{" "}
          <span className="bg-gradient-to-r from-[#C9A84C] via-[#E8D08A] to-[#C9A84C] bg-clip-text text-transparent">simplify your AI?</span>
        </h1>
        <p className="mt-5 text-lg text-[rgba(240,232,208,0.45)] max-w-md leading-relaxed">Join thousands of professionals who consolidated their AI tools into one premium experience.</p>
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link href="/auth" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#C9A84C] to-[#E8D08A] rounded-xl text-[#0a0a0a] font-bold text-base tracking-wide shadow-[0_4px_30px_rgba(201,168,76,0.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_40px_rgba(201,168,76,0.5)]">Get Started Now →</Link>
          <Link href="/auth" className="text-sm text-[rgba(240,232,208,0.4)] hover:text-[rgba(240,232,208,0.7)] transition-colors">Already have an account? Sign in</Link>
        </div>
        <div className="mt-14 flex flex-wrap justify-center gap-2">
          {["GPT-4o","Claude 3.5","Gemini 1.5","Llama 3.1","Mistral","DeepSeek"].map(m => (
            <span key={m} className="px-3 py-1.5 rounded-full border border-[rgba(201,168,76,0.15)] bg-[rgba(201,168,76,0.05)] text-[#C9A84C] text-xs font-medium">{m}</span>
          ))}
        </div>
      </div>
      <div className="absolute bottom-6 w-full flex justify-center gap-6 text-xs text-[rgba(240,232,208,0.2)]">
        <a href="/privacy" className="hover:text-[rgba(240,232,208,0.5)] transition-colors">Privacy</a>
        <a href="/terms" className="hover:text-[rgba(240,232,208,0.5)] transition-colors">Terms</a>
        <span>© 2025 MultiModel</span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// ROOT  — session gate
// ════════════════════════════════════════════════════════════════════════
export default function RootPage() {
  const { data, isPending } = useSession();

  if (isPending) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a1500] to-[#2a2000] border border-[rgba(201,168,76,0.3)] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none"><path d="M14 2L4 7v14l10 5 10-5V7L14 2z" stroke="#C9A84C" strokeWidth="1.8" strokeLinejoin="round"/><path d="M14 2v19M4 7l10 5 10-5" stroke="#C9A84C" strokeWidth="1.8" strokeLinejoin="round"/></svg>
          </div>
          <div className="w-5 h-5 border-2 border-[rgba(201,168,76,0.2)] border-t-[#C9A84C] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (data?.user) {
    return <ChatInterface user={data.user} />;
  }

  return <LandingPage />;
}
