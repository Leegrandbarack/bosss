import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import LazyImage from "@/components/social/LazyImage";

interface ProfilePhotosProps {
  userId: string;
}

export default function ProfilePhotos({ userId }: ProfilePhotosProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("posts")
        .select("image_url")
        .eq("user_id", userId)
        .not("image_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(30);
      setPhotos((data || []).map(p => p.image_url!));
      setLoading(false);
    })();
  }, [userId]);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-12">Aucune photo</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
      {photos.map((url, i) => (
        <LazyImage
          key={i}
          src={url}
          alt={`Photo ${i + 1}`}
          className="aspect-square object-cover w-full hover:opacity-90 transition-opacity cursor-pointer"
        />
      ))}
    </div>
  );
}
