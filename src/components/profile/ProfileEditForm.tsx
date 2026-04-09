import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Save } from "lucide-react";

interface ProfileFormData {
  full_name: string;
  bio: string;
  city: string;
  country: string;
  school: string;
  work: string;
  gender: string;
}

interface ProfileEditFormProps {
  data: ProfileFormData;
  saving: boolean;
  onChange: (field: keyof ProfileFormData, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function ProfileEditForm({ data, saving, onChange, onSave, onCancel }: ProfileEditFormProps) {
  return (
    <div className="mx-auto max-w-lg px-4 mt-6 animate-fade-in">
      <Card className="p-5 space-y-4 border-border/50">
        <h3 className="text-sm font-semibold text-foreground">Modifier le profil</h3>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="full_name" className="text-xs">Nom complet</Label>
            <Input id="full_name" value={data.full_name} onChange={e => onChange("full_name", e.target.value)} maxLength={100} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bio" className="text-xs">Bio</Label>
            <Textarea id="bio" value={data.bio} onChange={e => onChange("bio", e.target.value)} maxLength={200} className="rounded-xl resize-none" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="city" className="text-xs">Ville</Label>
              <Input id="city" value={data.city} onChange={e => onChange("city", e.target.value)} maxLength={50} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="country" className="text-xs">Pays</Label>
              <Input id="country" value={data.country} onChange={e => onChange("country", e.target.value)} maxLength={50} className="rounded-xl" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="work" className="text-xs">Emploi</Label>
            <Input id="work" value={data.work} onChange={e => onChange("work", e.target.value)} maxLength={100} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="school" className="text-xs">École</Label>
            <Input id="school" value={data.school} onChange={e => onChange("school", e.target.value)} maxLength={100} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gender" className="text-xs">Genre</Label>
            <Input id="gender" value={data.gender} onChange={e => onChange("gender", e.target.value)} maxLength={30} className="rounded-xl" placeholder="Homme, Femme, Autre…" />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={onCancel}>Annuler</Button>
          <Button onClick={onSave} className="flex-1 rounded-xl gradient-primary border-0" disabled={saving}>
            {saving ? "…" : <><Save className="mr-2 h-4 w-4" /> Enregistrer</>}
          </Button>
        </div>
      </Card>
    </div>
  );
}
