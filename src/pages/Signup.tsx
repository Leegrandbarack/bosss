import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { z } from "zod";

const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  email: z.string().trim().email("Adresse email invalide").max(255),
  phone: z.string().trim().min(6, "Numéro de téléphone invalide").max(20),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères").max(128)
    .regex(/[A-Z]/, "Doit contenir au moins une majuscule")
    .regex(/[a-z]/, "Doit contenir au moins une minuscule")
    .regex(/[0-9]/, "Doit contenir au moins un chiffre"),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export default function Signup() {
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signupSchema.safeParse(form);
    if (!parsed.success) {
      toast({ variant: "destructive", title: "Erreur", description: parsed.error.errors[0].message });
      return;
    }
    setLoading(true);
    const { error } = await signUp(parsed.data.email, parsed.data.password, parsed.data.fullName, parsed.data.phone);
    setLoading(false);
    if (error) {
      toast({ variant: "destructive", title: "Inscription échouée", description: "Une erreur est survenue. Veuillez réessayer." });
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <AuthLayout title="Vérifiez votre email" subtitle="Un lien de confirmation a été envoyé à votre adresse email.">
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Cliquez sur le lien dans l'email pour activer votre compte.
          </p>
          <Link to="/login">
            <Button variant="outline" className="w-full">Retour à la connexion</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Créer un compte" subtitle="Rejoignez NEXORA dès maintenant">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nom complet</Label>
          <Input id="fullName" placeholder="Jean Dupont" value={form.fullName} onChange={update("fullName")} required maxLength={100} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="vous@exemple.com" value={form.email} onChange={update("email")} autoComplete="email" required maxLength={255} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input id="phone" type="tel" placeholder="+33 6 12 34 56 78" value={form.phone} onChange={update("phone")} required maxLength={20} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <div className="relative">
            <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={form.password} onChange={update("password")} autoComplete="new-password" required maxLength={128} />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
          <Input id="confirmPassword" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={update("confirmPassword")} autoComplete="new-password" required />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : <><UserPlus className="mr-2 h-4 w-4" /> S'inscrire</>}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Déjà un compte ? <Link to="/login" className="text-primary hover:underline">Se connecter</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
