import { useRef, useState } from "react";
import type { GroupedStories, StoryWithProfile } from "@/hooks/useStories";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
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
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await onCreateStory(file);
  };

  const openStories = (group: GroupedStories) => {
    setOpenGroup(group);
    setStoryIndex(0);
    if (group.stories[0]) onMarkViewed(group.stories[0].id);
  };

  const nextStory = () => {
    if (!openGroup) return;
    if (storyIndex < openGroup.stories.length - 1) {
      const next = storyIndex + 1;
      setStoryIndex(next);
      onMarkViewed(openGroup.stories[next].id);
    } else {
      setOpenGroup(null);
    }
  };

  const prevStory = () => {
    if (storyIndex > 0) setStoryIndex(storyIndex - 1);
  };

  const currentStory = openGroup?.stories[storyIndex];

  return (
    <>
      <ScrollArea className="w-full">
        <div className="flex gap-3 px-1 py-2">
          {/* Add story button */}
          <button onClick={() => fileRef.current?.click()} className="flex flex-col items-center gap-1">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-primary/50 bg-secondary/50">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <span className="text-[10px] text-muted-foreground">Ma story</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />

          {groups.map(group => (
            <button key={group.user_id} onClick={() => openStories(group)} className="flex flex-col items-center gap-1">
              <div className={`rounded-full p-0.5 ${group.hasUnviewed ? "bg-gradient-to-br from-primary to-destructive" : "bg-muted"}`}>
                <Avatar className="h-14 w-14 border-2 border-background">
                  <AvatarImage src={group.profile.avatar_url || undefined} />
                  <AvatarFallback>{(group.profile.full_name || "U")[0]}</AvatarFallback>
                </Avatar>
              </div>
              <span className="max-w-[64px] truncate text-[10px] text-foreground">
                {group.user_id === user?.id ? "Moi" : group.profile.full_name?.split(" ")[0] || "User"}
              </span>
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <Dialog open={!!openGroup} onOpenChange={() => setOpenGroup(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-black border-0 [&>button]:hidden">
          {currentStory && (
            <div className="relative h-[80vh] w-full">
              {/* Progress bars */}
              <div className="absolute top-2 left-2 right-2 z-20 flex gap-1">
                {openGroup!.stories.map((_, i) => (
                  <div key={i} className="h-0.5 flex-1 rounded-full bg-white/30">
                    <div className={`h-full rounded-full bg-white transition-all ${i <= storyIndex ? "w-full" : "w-0"}`} />
                  </div>
                ))}
              </div>

              {/* Header */}
              <div className="absolute top-4 left-2 right-2 z-20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 border border-white/50">
                    <AvatarImage src={openGroup!.profile.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">{(openGroup!.profile.full_name || "U")[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-white drop-shadow">{openGroup!.profile.full_name || "Utilisateur"}</span>
                </div>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setOpenGroup(null)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Image */}
              {currentStory.image_url && (
                <img src={currentStory.image_url} alt="Story" className="h-full w-full object-contain" />
              )}

              {/* Caption */}
              {currentStory.caption && (
                <div className="absolute bottom-4 left-4 right-4 z-20">
                  <p className="text-sm text-white drop-shadow-lg">{currentStory.caption}</p>
                </div>
              )}

              {/* Nav */}
              <button onClick={prevStory} className="absolute left-0 top-0 h-full w-1/3 z-10" />
              <button onClick={nextStory} className="absolute right-0 top-0 h-full w-2/3 z-10" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
