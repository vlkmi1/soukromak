import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Upload, Trash2, Eye, Image as ImageIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import imageCompression from "browser-image-compression";

interface GalleryImage {
  id: number;
  title: string;
  description: string | null;
  image_url: string;
  thumbnail_url: string | null;
  display_order: number;
}

export default function GalleryAdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [newImage, setNewImage] = useState<{ title: string; description: string }>({
    title: "",
    description: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadImages();
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

  const loadImages = async () => {
    try {
      const { data, error } = await supabase
        .from("gallery")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error("Error loading images:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se načíst galerii",
        variant: "destructive",
      });
    }
  };

  const compressImage = async (file: File, maxSizeMB: number, maxWidthOrHeight: number) => {
    const options = {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      console.error("Error compressing image:", error);
      throw error;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Chyba",
        description: "Prosím nahrajte obrázek",
        variant: "destructive",
      });
      return;
    }

    if (!newImage.title) {
      toast({
        title: "Chyba",
        description: "Vyplňte název obrázku",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Komprese plného obrázku (max 2MB, max 1920px)
      const compressedFull = await compressImage(file, 2, 1920);
      
      // Komprese thumbnailuť(max 200KB, max 400px)
      const compressedThumb = await compressImage(file, 0.2, 400);

      // Upload do /public/gallery/ (simulace - v reálném světě by to šlo do Supabase Storage)
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name.replace(/\s+/g, "-")}`;
      const thumbFileName = `${timestamp}-thumb-${file.name.replace(/\s+/g, "-")}`;

      // Pro účely demo simulujeme upload pomocí FileReader a uložení do databáze jako data URL
      const fullReader = new FileReader();
      const thumbReader = new FileReader();

      fullReader.onload = async (event) => {
        const fullDataUrl = event.target?.result as string;

        thumbReader.onload = async (thumbEvent) => {
          const thumbDataUrl = thumbEvent.target?.result as string;

          try {
            const { error } = await supabase.from("gallery").insert({
              title: newImage.title,
              description: newImage.description || null,
              image_url: fullDataUrl,
              thumbnail_url: thumbDataUrl,
              display_order: images.length,
            });

            if (error) throw error;

            toast({
              title: "Úspěch",
              description: "Obrázek byl nahrán a zkomprimován",
            });

            setNewImage({ title: "", description: "" });
            loadImages();
          } catch (error: any) {
            console.error("Error saving image:", error);
            toast({
              title: "Chyba",
              description: error.message || "Nepodařilo se uložit obrázek",
              variant: "destructive",
            });
          } finally {
            setUploading(false);
          }
        };

        thumbReader.readAsDataURL(compressedThumb);
      };

      fullReader.readAsDataURL(compressedFull);
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se nahrát obrázek",
        variant: "destructive",
      });
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Opravdu chcete smazat tento obrázek?")) return;

    try {
      const { error } = await supabase.from("gallery").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Smazáno",
        description: "Obrázek byl smazán",
      });

      loadImages();
    } catch (error: any) {
      console.error("Error deleting image:", error);
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se smazat obrázek",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin - Fotogalerie</CardTitle>
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
                Správa fotogalerie
              </h1>
              <p className="text-gray-600 mt-2">Nahrávání a správa fotografií</p>
            </div>
            <Button onClick={() => router.push("/admin")} variant="outline">
              Zpět na admin
            </Button>
          </div>

          {/* Upload formulář */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Nahrát nový obrázek</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Název *</Label>
                <Input
                  id="title"
                  value={newImage.title}
                  onChange={(e) => setNewImage({ ...newImage, title: e.target.value })}
                  placeholder="např. Rybník soukromák v létě"
                />
              </div>
              <div>
                <Label htmlFor="description">Popis (volitelné)</Label>
                <Textarea
                  id="description"
                  value={newImage.description}
                  onChange={(e) => setNewImage({ ...newImage, description: e.target.value })}
                  rows={3}
                  placeholder="Krátký popis fotografie"
                />
              </div>
              <div>
                <Label htmlFor="file">Vybrat obrázek *</Label>
                <Input
                  id="file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Obrázek bude automaticky zkomprimován (max 2MB, max 1920px). Thumbnail vytvoříme automaticky.
                </p>
              </div>
              {uploading && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Nahrávání a komprese obrázku... Prosím počkejte.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Galerie */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((img) => (
              <Card key={img.id} className="overflow-hidden">
                <div className="relative aspect-video bg-gray-100">
                  <img
                    src={img.thumbnail_url || img.image_url}
                    alt={img.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-[#2a3d32] mb-1">{img.title}</h3>
                  {img.description && (
                    <p className="text-sm text-gray-600 mb-3">{img.description}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => window.open(img.image_url, "_blank")}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Zobrazit
                    </Button>
                    <Button
                      onClick={() => handleDelete(img.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {images.length === 0 && (
            <Alert>
              <ImageIcon className="h-4 w-4" />
              <AlertDescription>
                Zatím nejsou žádné fotografie. Nahrajte první fotografii pomocí formuláře výše.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}