import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Image, Send, X } from "lucide-react";

interface CreatePostProps {
  onSubmit: (content: string, image?: File) => Promise<void>;
  avatarUrl?: string | null;
  fullName?: string | null;
}

export default function CreatePost({ onSubmit, avatarUrl, fullName }: CreatePostProps) {
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!content.trim() && !imageFile) return;
    setSubmitting(true);
    await onSubmit(content, imageFile || undefined);
    setContent("");
    setImageFile(null);
    setPreview(null);
    setSubmitting(false);
  };

  return (
    <Card className="p-4">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback>{(fullName || "U")[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-3">
          <Textarea
            placeholder="Quoi de neuf ?"
            value={content}
            onChange={e => setContent(e.target.value)}
            className="min-h-[60px] resize-none border-0 bg-secondary/50 focus-visible:ring-1"
          />
          {preview && (
            <div className="relative inline-block">
              <img src={preview} alt="Preview" className="max-h-48 rounded-lg object-cover" />
              <button onClick={() => { setImageFile(null); setPreview(null); }} className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
              <Image className="mr-1 h-4 w-4" /> Photo
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={submitting || (!content.trim() && !imageFile)}>
              <Send className="mr-1 h-4 w-4" /> Publier
            </Button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
        </div>
      </div>
    </Card>
  );
}
