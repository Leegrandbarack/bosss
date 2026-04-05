import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const other = participants.find((p) => p.user_id !== user?.id);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark as read on mount and new messages
  useEffect(() => {
    markAsRead();
  }, [messages.length, markAsRead]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(text);
    setText("");
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

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="relative">
          {other?.profile?.avatar_url ? (
            <img src={other.profile.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
              {title[0]?.toUpperCase()}
            </div>
          )}
          {other?.is_online && (
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-[hsl(var(--success))]" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">
            {other?.is_online ? "En ligne" : "Hors ligne"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isMine = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  isMine
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-accent text-accent-foreground rounded-bl-md"
                }`}
              >
                {msg.message_type === "image" && msg.file_url && (
                  <img
                    src={msg.file_url}
                    alt={msg.file_name || "image"}
                    className="max-w-full rounded-lg mb-1 cursor-pointer"
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
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                )}
                <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : ""}`}>
                  <span className={`text-[10px] ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {format(new Date(msg.created_at), "HH:mm", { locale: fr })}
                  </span>
                  {isMine && (
                    msg.is_read ? (
                      <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                    ) : (
                      <Check className="h-3 w-3 text-primary-foreground/70" />
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input bar */}
      <div className="border-t border-border bg-card p-3">
        <div className="flex items-center gap-2">
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
          <Button variant="ghost" size="icon" onClick={() => imageInputRef.current?.click()}>
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
            <Paperclip className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={recording ? stopRecording : startRecording}
            className={recording ? "text-destructive animate-pulse" : ""}
          >
            {recording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5 text-muted-foreground" />}
          </Button>
          <Input
            placeholder="Écrire un message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button size="icon" onClick={handleSend} disabled={!text.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
