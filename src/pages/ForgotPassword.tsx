import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";
import { z } from "zod";

const schema = z.object({ email: z.string().trim().email("Adresse email invalide").max(255) });

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      toast({ variant: "destructive", title: "Erreur", description: parsed.error.errors[0].message });
      return;
    }
    setLoading(true);
    const { error } = await resetPassword(parsed.data.email);
    setLoading(false);
    if (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Une erreur est survenue." });
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <AuthLayout title="Email envoyé" subtitle="Consultez votre boîte de réception pour réinitialiser votre mot de passe.">
        <Link to="/login"><Button variant="outline" className="w-full">Retour à la connexion</Button></Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Mot de passe oublié" subtitle="Entrez votre email pour recevoir un lien de réinitialisation">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="vous@exemple.com" value={email} onChange={e => setEmail(e.target.value)} required maxLength={255} />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : <><Mail className="mr-2 h-4 w-4" /> Envoyer le lien</>}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline">Retour à la connexion</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
