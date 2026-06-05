import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Plus, Edit, Trash2, Eye, Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface Page {
  id: number;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  featured_image: string | null;
  published: boolean;
  display_in_menu: boolean;
  menu_order: number;
}

export default function EditorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [pages, setPages] = useState<Page[]>([]);
  const [editingPage, setEditingPage] = useState<Partial<Page> | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadPages();
    }
  }, [isAuthenticated]);

  const checkAuth = () => {
    const adminPin = localStorage.getItem("adminPin");
    if (adminPin === "1234") {
      setIsAuthenticated(true);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === "1234") {
      localStorage.setItem("adminPin", pin);
      setIsAuthenticated(true);
      toast({
        title: "Přihlášení úspěšné",
        description: "Vítejte v administraci",
      });
    } else {
      toast({
        title: "Chyba",
        description: "Nesprávný PIN",
        variant: "destructive",
      });
    }
  };

  const loadPages = async () => {
    try {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .order("menu_order", { ascending: true });

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error("Error loading pages:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se načíst stránky",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!editingPage?.title || !editingPage?.slug) {
      toast({
        title: "Chyba",
        description: "Vyplňte název a slug",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingPage.id) {
        // Update
        const { error } = await supabase
          .from("pages")
          .update({
            title: editingPage.title,
            slug: editingPage.slug,
            content: editingPage.content || "",
            excerpt: editingPage.excerpt || "",
            featured_image: editingPage.featured_image,
            published: editingPage.published ?? true,
            display_in_menu: editingPage.display_in_menu ?? true,
            menu_order: editingPage.menu_order ?? 0,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingPage.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from("pages").insert({
          title: editingPage.title,
          slug: editingPage.slug,
          content: editingPage.content || "",
          excerpt: editingPage.excerpt || "",
          featured_image: editingPage.featured_image,
          published: editingPage.published ?? true,
          display_in_menu: editingPage.display_in_menu ?? true,
          menu_order: editingPage.menu_order ?? pages.length,
        });

        if (error) throw error;
      }

      toast({
        title: "Uloženo",
        description: "Stránka byla úspěšně uložena",
      });

      setEditingPage(null);
      setIsCreating(false);
      loadPages();
    } catch (error: any) {
      console.error("Error saving page:", error);
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se uložit stránku",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Opravdu chcete smazat tuto stránku?")) return;

    try {
      const { error } = await supabase.from("pages").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Smazáno",
        description: "Stránka byla smazána",
      });

      loadPages();
    } catch (error: any) {
      console.error("Error deleting page:", error);
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se smazat stránku",
        variant: "destructive",
      });
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin - Editor stránek</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="pin">PIN kód</Label>
                <Input
                  id="pin"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Zadejte PIN"
                />
              </div>
              <Button type="submit" className="w-full">
                Přihlásit
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-12">
        <div className="container max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#2a3d32] uppercase tracking-wide">
                Editor stránek
              </h1>
              <p className="text-gray-600 mt-2">Správa článků a obsahu webu</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setIsCreating(true);
                  setEditingPage({
                    title: "",
                    slug: "",
                    content: "",
                    excerpt: "",
                    published: true,
                    display_in_menu: true,
                    menu_order: pages.length,
                  });
                }}
                className="bg-[#3d5a43] hover:bg-[#4a6850]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nová stránka
              </Button>
              <Button
                onClick={() => router.push("/admin")}
                variant="outline"
              >
                Zpět na admin
              </Button>
            </div>
          </div>

          {(isCreating || editingPage) && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>
                  {editingPage?.id ? "Upravit stránku" : "Nová stránka"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Název stránky *</Label>
                    <Input
                      id="title"
                      value={editingPage?.title || ""}
                      onChange={(e) => {
                        setEditingPage({
                          ...editingPage,
                          title: e.target.value,
                          slug: !editingPage?.id ? generateSlug(e.target.value) : editingPage.slug,
                        });
                      }}
                      placeholder="např. O rybníku"
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">URL slug *</Label>
                    <Input
                      id="slug"
                      value={editingPage?.slug || ""}
                      onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value })}
                      placeholder="např. o-rybniku"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="excerpt">Krátký popis</Label>
                  <Input
                    id="excerpt"
                    value={editingPage?.excerpt || ""}
                    onChange={(e) => setEditingPage({ ...editingPage, excerpt: e.target.value })}
                    placeholder="Stručný popis stránky"
                  />
                </div>

                <div>
                  <Label htmlFor="content">Obsah (HTML)</Label>
                  <Textarea
                    id="content"
                    value={editingPage?.content || ""}
                    onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
                    rows={12}
                    className="font-mono text-sm"
                    placeholder="<h2>Nadpis</h2><p>Text...</p>"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Použijte HTML tagy. Příklad: &lt;h2&gt;Nadpis&lt;/h2&gt; &lt;p&gt;Odstavec textu&lt;/p&gt;
                  </p>
                </div>

                <div>
                  <Label htmlFor="featured_image">URL obrázku (volitelné)</Label>
                  <Input
                    id="featured_image"
                    value={editingPage?.featured_image || ""}
                    onChange={(e) => setEditingPage({ ...editingPage, featured_image: e.target.value })}
                    placeholder="/images/page-hero.jpg"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="published">Publikováno</Label>
                    <Switch
                      id="published"
                      checked={editingPage?.published ?? true}
                      onCheckedChange={(checked) =>
                        setEditingPage({ ...editingPage, published: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="display_in_menu">V menu</Label>
                    <Switch
                      id="display_in_menu"
                      checked={editingPage?.display_in_menu ?? true}
                      onCheckedChange={(checked) =>
                        setEditingPage({ ...editingPage, display_in_menu: checked })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="menu_order">Pořadí</Label>
                    <Input
                      id="menu_order"
                      type="number"
                      value={editingPage?.menu_order ?? 0}
                      onChange={(e) =>
                        setEditingPage({ ...editingPage, menu_order: parseInt(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave} className="bg-[#3d5a43] hover:bg-[#4a6850]">
                    <Save className="h-4 w-4 mr-2" />
                    Uložit
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingPage(null);
                      setIsCreating(false);
                    }}
                    variant="outline"
                  >
                    Zrušit
                  </Button>
                  {editingPage?.published && editingPage?.slug && (
                    <Button
                      onClick={() => window.open(`/${editingPage.slug}`, "_blank")}
                      variant="outline"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Náhled
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {pages.map((page) => (
              <Card key={page.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-[#2a3d32]">{page.title}</h3>
                        {!page.published && (
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                            Koncept
                          </span>
                        )}
                        {page.display_in_menu && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            V menu
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                          /{page.slug}
                        </span>
                      </p>
                      {page.excerpt && (
                        <p className="text-sm text-gray-600">{page.excerpt}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setEditingPage(page)}
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {page.published && (
                        <Button
                          onClick={() => window.open(`/${page.slug}`, "_blank")}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        onClick={() => handleDelete(page.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {pages.length === 0 && !isCreating && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Zatím nejsou žádné stránky. Vytvořte první stránku pomocí tlačítka "Nová stránka".
              </AlertDescription>
            </Alert>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}