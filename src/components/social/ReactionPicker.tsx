import { useState, useRef, useEffect, useCallback } from "react";

const REACTIONS = [
  { type: "like", emoji: "👍", label: "Like" },
  { type: "love", emoji: "❤️", label: "Love" },
  { type: "haha", emoji: "😂", label: "Haha" },
  { type: "wow", emoji: "😮", label: "Wow" },
  { type: "sad", emoji: "😢", label: "Sad" },
  { type: "angry", emoji: "😡", label: "Angry" },
] as const;

export type ReactionType = (typeof REACTIONS)[number]["type"];

export const REACTION_MAP: Record<string, { emoji: string; label: string }> = Object.fromEntries(
  REACTIONS.map(r => [r.type, { emoji: r.emoji, label: r.label }])
);

interface ReactionPickerProps {
  currentReaction: string | null;
  onReact: (type: ReactionType) => void;
  onUnreact: () => void;
}

export default function ReactionPicker({ currentReaction, onReact, onUnreact }: ReactionPickerProps) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback(() => {
    timerRef.current = setTimeout(() => setOpen(true), 500);
  }, []);

  const handlePointerUp = useCallback(() => {
    clearTimeout(timerRef.current);
  }, []);

  const handleClick = useCallback(() => {
    if (open) return;
    if (currentReaction) {
      onUnreact();
    } else {
      onReact("like");
    }
  }, [open, currentReaction, onReact, onUnreact]);

  const selectReaction = useCallback((type: ReactionType) => {
    onReact(type);
    setOpen(false);
  }, [onReact]);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const reactionInfo = currentReaction ? REACTION_MAP[currentReaction] : null;

  return (
    <div ref={containerRef} className="relative flex-1">
      {open && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 flex gap-1 rounded-full bg-card border border-border shadow-lg px-2 py-1.5 z-50 animate-scale-in">
          {REACTIONS.map(r => (
            <button
              key={r.type}
              onClick={() => selectReaction(r.type)}
              className="text-xl hover:scale-125 transition-transform duration-150 px-0.5"
              title={r.label}
            >
              {r.emoji}
            </button>
          ))}
        </div>
      )}
      <button
        className={`flex w-full items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors rounded-none ${
          currentReaction ? "text-primary" : "text-muted-foreground"
        }`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={handleClick}
      >
        {reactionInfo ? (
          <>
            <span className="text-base">{reactionInfo.emoji}</span>
            {reactionInfo.label}
          </>
        ) : (
          <>
            <span className="text-base">👍</span>
            J'aime
          </>
        )}
      </button>
    </div>
  );
}
