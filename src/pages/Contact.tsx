import PublicLayout from "@/components/PublicLayout";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mail, MapPin } from "lucide-react";

export default function Contact() {
  const [sent, setSent] = useState(false);
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    toast.success("Merci ! Votre message a bien été envoyé.");
  };
  return (
    <PublicLayout
      title="Contact — Nexora"
      description="Contactez l'équipe Nexora pour toute question, suggestion ou demande de partenariat."
    >
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-extrabold mb-2">Contactez-nous</h1>
        <p className="text-muted-foreground mb-8">
          Une question, une suggestion ? Écrivez-nous, nous lisons tous les messages.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-primary mt-1" />
            <div>
              <div className="font-semibold text-sm">Email</div>
              <div className="text-sm text-muted-foreground">contact@nexora.app</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary mt-1" />
            <div>
              <div className="font-semibold text-sm">Adresse</div>
              <div className="text-sm text-muted-foreground">Disponible en ligne, partout dans le monde</div>
            </div>
          </div>
        </div>

        {sent ? (
          <div className="rounded-lg border border-border bg-card p-6 text-center">
            <p className="font-semibold">Message envoyé !</p>
            <p className="text-sm text-muted-foreground mt-1">Nous reviendrons vers vous très vite.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-border bg-card p-6">
            <div>
              <Label htmlFor="name">Nom</Label>
              <Input id="name" required placeholder="Votre nom" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required placeholder="vous@exemple.com" />
            </div>
            <div>
              <Label htmlFor="msg">Message</Label>
              <Textarea id="msg" required rows={5} placeholder="Votre message…" />
            </div>
            <Button type="submit" className="w-full">Envoyer</Button>
          </form>
        )}
      </div>
    </PublicLayout>
  );
}
