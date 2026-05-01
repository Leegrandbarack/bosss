import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BLOG_CATEGORIES, useCreateBlogPost } from "@/hooks/useBlog";
import { useNavigate } from "react-router-dom";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}

export default function BlogEditorDialog({ open, onOpenChange, onCreated }: Props) {
  const create = useCreateBlogPost();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>(BLOG_CATEGORIES[0]);
  const [tags, setTags] = useState("");
  const [cover, setCover] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTitle(""); setSummary(""); setContent(""); setTags(""); setCover(null);
    setCategory(BLOG_CATEGORIES[0]);
  };

  const onSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    const post = await create({
      title: title.trim(),
      summary: summary.trim(),
      content: content.trim(),
      category,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      coverFile: cover,
    });
    setSubmitting(false);
    if (post) {
      reset();
      onOpenChange(false);
      onCreated?.();
      navigate(`/blog/${post.slug}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvel article</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Titre</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de l'article" />
          </div>
          <div>
            <Label>Résumé</Label>
            <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Court résumé" rows={2} />
          </div>
          <div>
            <Label>Contenu</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Écrivez votre article…" rows={10} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Catégorie</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BLOG_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tags (séparés par ,)</Label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="react, design" />
            </div>
          </div>
          <div>
            <Label>Image de couverture</Label>
            <Input type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] || null)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button onClick={onSubmit} disabled={submitting || !title.trim() || !content.trim()}>
              {submitting ? "Publication…" : "Publier"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
