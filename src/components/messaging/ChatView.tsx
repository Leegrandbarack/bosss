import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  Mic,
  MicOff,
  ArrowLeft,
  Check,
  CheckCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useMessaging";
import type { Participant } from "@/hooks/useMessaging";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Props {
  conversationId: string;
  participants: Participant[];
  title: string;
  onBack?: () => void;
}

export default function ChatView({ conversationId, participants, title, onBack }: Props) {
  const { user } = useAuth();
  const { messages, sendMessage, sendFile, markAsRead } = useChat(conversationId);
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const other = participants.find((p) => p.user_id !== user?.id);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark as read
  useEffect(() => {
    markAsRead();
  }, [messages.length, markAsRead]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [text]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(text);
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "file" | "image") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Fichier trop volumineux (max 10 Mo)");
      return;
    }
    sendFile(file, type);
    e.target.value = "";
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
        sendFile(file, "voice");
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      alert("Microphone non disponible");
    }
  }, [sendFile]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }, []);

  // Group messages by date
  const groupedByDate: { date: string; msgs: typeof messages }[] = [];
  messages.forEach((msg) => {
    const dateStr = format(new Date(msg.created_at), "d MMMM yyyy", { locale: fr });
    const last = groupedByDate[groupedByDate.length - 1];
    if (last && last.date === dateStr) {
      last.msgs.push(msg);
    } else {
      groupedByDate.push({ date: dateStr, msgs: [msg] });
    }
  });

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-card/80 glass px-4 py-3">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden h-9 w-9 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="relative">
          {other?.profile?.avatar_url ? (
            <img src={other.profile.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-accent" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-primary-foreground font-bold text-sm">
              {title[0]?.toUpperCase()}
            </div>
          )}
          {other?.is_online && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-success" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">
            {other?.is_online ? (
              <span className="text-success font-medium">En ligne</span>
            ) : "Hors ligne"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-1">
        {groupedByDate.map(({ date, msgs }) => (
          <div key={date}>
            <div className="flex justify-center my-3">
              <span className="text-[10px] text-muted-foreground bg-secondary/80 px-3 py-1 rounded-full">{date}</span>
            </div>
            {msgs.map((msg, i) => {
              const isMine = msg.sender_id === user?.id;
              const showTail = i === msgs.length - 1 || msgs[i + 1]?.sender_id !== msg.sender_id;
              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"} mb-0.5 animate-fade-in`}>
                  <div
                    className={`max-w-[75%] px-3.5 py-2 ${showTail ? "mb-1.5" : ""} ${
                      isMine
                        ? `gradient-primary text-primary-foreground ${showTail ? "rounded-2xl rounded-br-md" : "rounded-2xl"}`
                        : `bg-card border border-border text-card-foreground ${showTail ? "rounded-2xl rounded-bl-md" : "rounded-2xl"}`
                    }`}
                  >
                    {msg.message_type === "image" && msg.file_url && (
                      <img
                        src={msg.file_url}
                        alt={msg.file_name || "image"}
                        className="max-w-full rounded-xl mb-1 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(msg.file_url!, "_blank")}
                      />
                    )}
                    {msg.message_type === "voice" && msg.file_url && (
                      <audio controls className="max-w-full mb-1" preload="metadata">
                        <source src={msg.file_url} type="audio/webm" />
                      </audio>
                    )}
                    {msg.message_type === "file" && msg.file_url && (
                      <a
                        href={msg.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 mb-1 text-sm underline ${
                          isMine ? "text-primary-foreground" : "text-foreground"
                        }`}
                      >
                        <Paperclip className="h-4 w-4" />
                        {msg.file_name || "Fichier"}
                      </a>
                    )}
                    {msg.message_type === "text" && (
                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                    )}
                    <div className={`flex items-center gap-1 mt-0.5 ${isMine ? "justify-end" : ""}`}>
                      <span className={`text-[10px] ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        {format(new Date(msg.created_at), "HH:mm", { locale: fr })}
                      </span>
                      {isMine && (
                        msg.is_read ? (
                          <CheckCheck className="h-3 w-3 text-primary-foreground/60" />
                        ) : (
                          <Check className="h-3 w-3 text-primary-foreground/60" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Input bar */}
      <div className="border-t border-border bg-card/80 glass p-3">
        <div className="flex items-end gap-2">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e, "image")}
          />
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => handleFileUpload(e, "file")}
          />
          <div className="flex gap-0.5">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => imageInputRef.current?.click()}>
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-9 w-9 rounded-full ${recording ? "text-destructive animate-pulse" : ""}`}
              onClick={recording ? stopRecording : startRecording}
            >
              {recording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5 text-muted-foreground" />}
            </Button>
          </div>
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              placeholder="Écrire un message…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              className="w-full resize-none rounded-2xl border border-input bg-secondary/50 px-4 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ maxHeight: 120 }}
            />
          </div>
          <Button
            size="icon"
            className="h-10 w-10 rounded-full gradient-primary border-0 flex-shrink-0 transition-transform hover:scale-105 active:scale-95"
            onClick={handleSend}
            disabled={!text.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
