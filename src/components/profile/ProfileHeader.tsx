import { useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Edit2, MessageCircle, UserPlus, Clock, Check } from "lucide-react";

interface ProfileHeaderProps {
  profile: {
    full_name: string;
    username: string;
    avatar_url: string;
    bio: string;
    is_private: boolean;
  };
  postsCount: number;
  friendsCount: number;
  isOwner: boolean;
  uploading: boolean;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEdit: () => void;
  friendStatus?: "friend" | "sent" | "none";
  onAddFriend?: () => void;
  onMessage?: () => void;
}

export default function ProfileHeader({
  profile,
  postsCount,
  friendsCount,
  isOwner,
  uploading,
  onAvatarUpload,
  onEdit,
  friendStatus = "none",
  onAddFriend,
  onMessage,
}: ProfileHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative">
      {/* Cover */}
      <div className="h-40 sm:h-48 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/20" />
      </div>

      <div className="mx-auto max-w-lg px-4 -mt-16 relative z-10">
        <div className="flex flex-col items-center">
          {/* Avatar */}
          <div className="relative group">
            <Avatar className="h-28 w-28 border-4 border-background shadow-xl ring-2 ring-primary/20">
              <AvatarImage src={profile.avatar_url || undefined} className="object-cover" />
              <AvatarFallback className="gradient-primary text-primary-foreground text-3xl font-bold">
                {profile.full_name?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            {isOwner && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                >
                  {uploading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onAvatarUpload} />
              </>
            )}
          </div>

          {/* Name & Username */}
          <h2 className="mt-3 text-xl font-bold text-foreground">{profile.full_name || "Utilisateur"}</h2>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
          {profile.bio && (
            <p className="mt-1.5 text-sm text-muted-foreground text-center max-w-xs leading-relaxed">{profile.bio}</p>
          )}
          {profile.is_private && (
            <span className="mt-1.5 text-[10px] bg-muted px-2.5 py-0.5 rounded-full text-muted-foreground font-medium">
              🔒 Profil privé
            </span>
          )}

          {/* Stats */}
          <div className="flex gap-10 mt-4">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{postsCount}</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{friendsCount}</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Amis</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            {isOwner ? (
              <Button variant="outline" size="sm" className="rounded-full px-5" onClick={onEdit}>
                <Edit2 className="mr-1.5 h-3.5 w-3.5" /> Modifier profil
              </Button>
            ) : (
              <>
                {friendStatus === "none" && (
                  <Button size="sm" className="rounded-full px-4 gradient-primary border-0" onClick={onAddFriend}>
                    <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Ajouter
                  </Button>
                )}
                {friendStatus === "sent" && (
                  <Button size="sm" variant="secondary" className="rounded-full px-4" disabled>
                    <Clock className="mr-1.5 h-3.5 w-3.5" /> Demande envoyée
                  </Button>
                )}
                {friendStatus === "friend" && (
                  <Button size="sm" variant="secondary" className="rounded-full px-4" disabled>
                    <Check className="mr-1.5 h-3.5 w-3.5" /> Amis
                  </Button>
                )}
                <Button variant="outline" size="sm" className="rounded-full px-4" onClick={onMessage}>
                  <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> Message
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
