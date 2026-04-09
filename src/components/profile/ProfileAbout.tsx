import { Card } from "@/components/ui/card";
import { MapPin, Briefcase, GraduationCap, Calendar, User, Mail, Phone } from "lucide-react";

interface AboutData {
  full_name: string;
  username: string;
  bio: string;
  city: string;
  country: string;
  school: string;
  work: string;
  birth_date: string;
  gender: string;
  is_private: boolean;
  phone: string;
}

interface ProfileAboutProps {
  profile: AboutData;
  isOwner: boolean;
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-accent-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

export default function ProfileAbout({ profile, isOwner }: ProfileAboutProps) {
  const location = [profile.city, profile.country].filter(Boolean).join(", ");

  return (
    <div className="space-y-4">
      <Card className="p-4 border-border/50 space-y-1">
        <h3 className="text-sm font-semibold text-foreground mb-2">Informations</h3>
        <InfoRow icon={User} label="Nom" value={profile.full_name} />
        <InfoRow icon={MapPin} label="Localisation" value={location || null} />
        <InfoRow icon={Briefcase} label="Emploi" value={profile.work} />
        <InfoRow icon={GraduationCap} label="École" value={profile.school} />
        {profile.birth_date && (
          <InfoRow icon={Calendar} label="Date de naissance" value={new Date(profile.birth_date).toLocaleDateString("fr-FR")} />
        )}
        <InfoRow icon={User} label="Genre" value={profile.gender} />
      </Card>

      {isOwner && (
        <Card className="p-4 border-border/50 space-y-1">
          <h3 className="text-sm font-semibold text-foreground mb-2">Contact</h3>
          <InfoRow icon={Phone} label="Téléphone" value={profile.phone} />
        </Card>
      )}

      <Card className="p-4 border-border/50">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Visibilité</span>
          <span className="text-foreground font-medium">{profile.is_private ? "Privé 🔒" : "Public 🌐"}</span>
        </div>
      </Card>
    </div>
  );
}
