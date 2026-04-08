import { useRef, useState, useEffect } from "react";
import type { GroupedStories } from "@/hooks/useStories";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, X, Eye, ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface StoriesCarouselProps {
  groups: GroupedStories[];
  onCreateStory: (file: File, caption?: string) => Promise<void>;
  onMarkViewed: (storyId: string) => void;
}

export default function StoriesCarousel({ groups, onCreateStory, onMarkViewed }: StoriesCarouselProps) {
  const { user } = useAuth();
  const [openGroup, setOpenGroup] = useState<GroupedStories | null>(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [videoPaused, setVideoPaused] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const videoRef = useRef<HTMLVideoElement>(null);

  const STORY_DURATION = 5000;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate file type
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      alert("Format non supporté. Utilisez une image ou vidéo (mp4, mov, webm).");
      e.target.value = "";
      return;
    }
    // Size limit: 50MB for video, 5MB for image
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`Fichier trop volumineux (max ${isVideo ? "50" : "5"} Mo)`);
      e.target.value = "";
      return;
    }
    await onCreateStory(file);
    e.target.value = "";
  };

  const openStories = (group: GroupedStories) => {
    setOpenGroup(group);
    setStoryIndex(0);
    setProgress(0);
    setPaused(false);
    setVideoPaused(false);
    if (group.stories[0]) onMarkViewed(group.stories[0].id);
  };

  const goToStory = (idx: number) => {
    if (!openGroup) return;
    if (idx >= openGroup.stories.length) {
      const currentGroupIdx = groups.findIndex(g => g.user_id === openGroup.user_id);
      if (currentGroupIdx < groups.length - 1) {
        const nextGroup = groups[currentGroupIdx + 1];
        setOpenGroup(nextGroup);
        setStoryIndex(0);
        setProgress(0);
        setPaused(false);
        setVideoPaused(false);
        if (nextGroup.stories[0]) onMarkViewed(nextGroup.stories[0].id);
      } else {
        setOpenGroup(null);
      }
      return;
    }
    if (idx < 0) {
      const currentGroupIdx = groups.findIndex(g => g.user_id === openGroup.user_id);
      if (currentGroupIdx > 0) {
        const prevGroup = groups[currentGroupIdx - 1];
        setOpenGroup(prevGroup);
        setStoryIndex(prevGroup.stories.length - 1);
        setProgress(100);
        return;
      }
      return;
    }
    setStoryIndex(idx);
    setProgress(0);
    setPaused(false);
    setVideoPaused(false);
    onMarkViewed(openGroup.stories[idx].id);
  };

  const toggleVideoPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setVideoPaused(false);
      setPaused(false);
    } else {
      videoRef.current.pause();
      setVideoPaused(true);
      setPaused(true);
    }
  };

  // Auto-advance timer for images
  useEffect(() => {
    if (!openGroup || paused) return;
    const currentStory = openGroup.stories[storyIndex];
    const isVideo = !!currentStory?.video_url;
    if (isVideo) return;

    setProgress(0);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(timerRef.current);
        goToStory(storyIndex + 1);
      }
    }, 50);
    return () => clearInterval(timerRef.current);
  }, [openGroup?.user_id, storyIndex, paused]);

  const currentStory = openGroup?.stories[storyIndex];
  const isVideo = !!currentStory?.video_url;

  return (
    <>
      <ScrollArea className="w-full">
        <div className="flex gap-3 px-1 py-2">
          {/* Add story */}
          <button onClick={() => fileRef.current?.click()} className="flex flex-col items-center gap-1.5 flex-shrink-0 group">
            <div className="relative">
              <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full border-2 border-dashed border-primary/40 bg-accent transition-all group-hover:border-primary group-hover:bg-accent/80">
                <Plus className="h-6 w-6 text-primary" />
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">Ma story</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*,video/mp4,video/mov,video/webm" className="hidden" onChange={handleFileSelect} />

          {groups.map(group => (
            <button key={group.user_id} onClick={() => openStories(group)} className="flex flex-col items-center gap-1.5 flex-shrink-0 group">
              <div className={`rounded-full p-[2.5px] transition-all ${group.hasUnviewed ? "gradient-story" : "bg-muted"}`}>
                <Avatar className="h-[62px] w-[62px] border-[3px] border-background">
                  <AvatarImage src={group.profile.avatar_url || undefined} className="object-cover" />
                  <AvatarFallback className="text-sm gradient-primary text-primary-foreground">{(group.profile.full_name || "U")[0]}</AvatarFallback>
                </Avatar>
              </div>
              <span className="max-w-[68px] truncate text-[10px] text-foreground font-medium">
                {group.user_id === user?.id ? "Moi" : group.profile.full_name?.split(" ")[0] || "User"}
              </span>
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <Dialog open={!!openGroup} onOpenChange={() => setOpenGroup(null)}>
        <DialogContent className="max-w-[100vw] max-h-[100vh] w-screen h-screen p-0 overflow-hidden bg-black border-0 rounded-none [&>button]:hidden">
          {currentStory && (
            <div className="relative h-full w-full flex items-center justify-center">
              {/* Progress bars */}
              <div className="absolute top-3 left-3 right-3 z-30 flex gap-1">
                {openGroup!.stories.map((_, i) => (
                  <div key={i} className="h-[3px] flex-1 rounded-full bg-white/25 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-white transition-all duration-100"
                      style={{ width: i < storyIndex ? "100%" : i === storyIndex ? `${progress}%` : "0%" }}
                    />
                  </div>
                ))}
              </div>

              {/* Header */}
              <div className="absolute top-7 left-3 right-3 z-30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-10 w-10 border-2 border-white/40">
                    <AvatarImage src={openGroup!.profile.avatar_url || undefined} />
                    <AvatarFallback className="text-xs gradient-primary text-primary-foreground">{(openGroup!.profile.full_name || "U")[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-semibold text-white drop-shadow-lg">{openGroup!.profile.full_name || "Utilisateur"}</span>
                </div>
                <div className="flex items-center gap-1">
                  {isVideo && (
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-10 w-10 rounded-full" onClick={toggleVideoPause}>
                      {videoPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-10 w-10 rounded-full" onClick={() => setOpenGroup(null)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Media */}
              {isVideo && currentStory.video_url ? (
                <video
                  ref={videoRef}
                  src={currentStory.video_url}
                  className="absolute inset-0 h-full w-full object-contain bg-black"
                  autoPlay
                  playsInline
                  muted={false}
                  onEnded={() => goToStory(storyIndex + 1)}
                  onTimeUpdate={() => {
                    if (videoRef.current) {
                      const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
                      setProgress(pct);
                    }
                  }}
                />
              ) : currentStory.image_url ? (
                <img
                  src={currentStory.image_url}
                  alt="Story"
                  className="absolute inset-0 h-full w-full object-contain bg-black"
                />
              ) : null}

              {/* Caption */}
              {currentStory.caption && (
                <div className="absolute bottom-20 left-4 right-4 z-30">
                  <p className="text-base text-white font-medium drop-shadow-lg text-center bg-black/30 backdrop-blur-sm rounded-xl px-4 py-2">{currentStory.caption}</p>
                </div>
              )}

              {/* View count */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5">
                <Eye className="h-3.5 w-3.5 text-white/80" />
                <span className="text-xs text-white/80 font-medium">{currentStory.views_count || 0} vues</span>
              </div>

              {/* Nav buttons - desktop */}
              <button
                onClick={() => goToStory(storyIndex - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </button>
              <button
                onClick={() => goToStory(storyIndex + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="h-6 w-6 text-white" />
              </button>

              {/* Touch navigation - mobile */}
              <button onClick={() => goToStory(storyIndex - 1)} className="absolute left-0 top-0 h-full w-1/3 z-20 md:hidden" />
              <button onClick={() => goToStory(storyIndex + 1)} className="absolute right-0 top-0 h-full w-2/3 z-20 md:hidden" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
