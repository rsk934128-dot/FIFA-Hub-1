import React, { useState, useRef, useEffect } from "react";
import { ChatMessage } from "../types";
import { Send, User, Bot, RefreshCw, Sparkles, MessageSquare, ShieldAlert, History } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { collection, addDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useFirebase } from "./FirebaseProvider";
import { handleFirestoreError, OperationType } from "../lib/firebaseUtils";

export default function TacticalAdvisor() {
  const { user } = useFirebase();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history from Firebase
  useEffect(() => {
    if (!user) {
      setMessages([{
        role: "assistant",
        content: "Greetings. I am your Tactical Advisor. Whether you are analyzing high-pressing systems or looking for the perfect midfield pivot role, I am here to provide elite-level insights. What tactical challenge are we solving today?",
        timestamp: new Date().toLocaleTimeString(),
      }]);
      return;
    }

    const q = query(
      collection(db, "chats"),
      where("userId", "==", user.uid),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setMessages([{
          role: "assistant",
          content: "Greetings. I am your Tactical Advisor. Whether you are analyzing high-pressing systems or looking for the perfect midfield pivot role, I am here to provide elite-level insights. What tactical challenge are we solving today?",
          timestamp: new Date().toLocaleTimeString(),
        }]);
      } else {
        const loadedMessages = snapshot.docs
          .map(doc => ({
            role: doc.data().role,
            content: doc.data().content,
            timestamp: doc.data().timestamp?.toDate().toLocaleTimeString() || new Date().toLocaleTimeString(),
            rawTimestamp: doc.data().timestamp?.toDate().getTime() || 0
          }))
          .sort((a, b) => a.rawTimestamp - b.rawTimestamp)
          .map(({ role, content, timestamp }) => ({ role, content, timestamp } as ChatMessage));
        setMessages(loadedMessages);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, "chats");
    });

    return () => unsubscribe();
  }, [user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString(),
    };

    // Optimistic update
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Save user message to Firebase
      if (user) {
        await addDoc(collection(db, "chats"), {
          role: "user",
          content: input,
          timestamp: serverTimestamp(),
          userId: user.uid
        });
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) throw new Error("Failed to reach the advisor.");

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.content,
        timestamp: new Date().toLocaleTimeString(),
      };

      // Save assistant response to Firebase
      if (user) {
        await addDoc(collection(db, "chats"), {
          role: "assistant",
          content: data.content,
          timestamp: serverTimestamp(),
          userId: user.uid
        });
      }

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "I apologize, but my tactical uplink is currently disrupted. Please try again in a moment.",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="tactical-advisor-module" className="max-w-4xl mx-auto h-[700px] flex flex-col bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
      {/* Header */}
      <div className="bg-white/5 border-b border-white/10 p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Bot className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase italic tracking-tight">Tactical Advisor</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Elite Uplink Active</span>
            </div>
          </div>
        </div>
        <div className="bg-amber-500/10 text-amber-400 text-[10px] font-mono px-3 py-1.5 rounded-full border border-amber-500/20 flex items-center gap-2 font-bold uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" />
          AI Powered
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center border ${
                  msg.role === "user" 
                    ? "bg-white text-black border-white" 
                    : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                }`}>
                  {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className="space-y-1">
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-lg ${
                    msg.role === "user"
                      ? "bg-white text-black rounded-tr-none"
                      : "bg-[#0A0F1E] text-slate-200 border border-white/5 rounded-tl-none"
                  }`}>
                    {msg.content}
                  </div>
                  <div className={`text-[9px] font-mono text-slate-500 uppercase tracking-widest ${msg.role === "user" ? "text-right" : "text-left"}`}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="flex gap-3 items-center bg-white/5 border border-white/10 px-4 py-2 rounded-full">
              <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Advisor is thinking...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white/5 border-t border-white/10">
        <form onSubmit={handleSendMessage} className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about formations, player roles, or tactical philosophies..."
            className="w-full bg-[#050811] border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-sm text-white focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-600 group-hover:border-white/20 shadow-inner"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 bottom-2 w-10 bg-amber-500 hover:bg-amber-400 text-black rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-amber-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="mt-3 flex justify-center gap-6">
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">
            <MessageSquare className="w-3 h-3" />
            Tactical Analysis
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">
            <ShieldAlert className="w-3 h-3" />
            Manager Insights
          </div>
        </div>
      </div>
    </div>
  );
}
