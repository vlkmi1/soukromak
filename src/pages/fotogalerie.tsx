import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Chatbot } from "@/components/Chatbot";
import { supabase } from "@/lib/supabase";
import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface GalleryImage {
  id: number;
  title: string;
  description: string | null;
  image_url: string;
  thumbnail_url: string | null;
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    try {
      const { data } = await supabase
        .from("gallery")
        .select("*")
        .order("display_order", { ascending: true });

      setImages(data || []);
    } catch (error) {
      console.error("Error loading gallery:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SEO
        title="Fotogalerie | Rybník Ostrata"
        description="Fotografie rybníku Ostrata v Novém Veselí"
      />
      <Header />

      <main className="flex-1">
        <div className="relative h-64 bg-gradient-to-br from-[#3d5a43] to-[#2a3d32]">
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white uppercase tracking-wide">
              Fotogalerie
            </h1>
          </div>
        </div>

        <div className="container max-w-6xl py-16">
          {isLoading ? (
            <div className="text-center text-gray-600 py-12">
              <p className="text-lg">Načítám fotografie...</p>
            </div>
          ) : images.length === 0 ? (
            <div className="text-center text-gray-600 py-12">
              <p className="text-lg">Zatím nejsou žádné fotografie.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImage(image)}
                  className="group relative aspect-video overflow-hidden bg-gray-100 border border-gray-300 hover:border-[#3d5a43] transition-all"
                >
                  <img
                    src={image.thumbnail_url || image.image_url}
                    alt={image.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-bold text-sm">{image.title}</h3>
                      {image.description && (
                        <p className="text-white/90 text-xs mt-1 line-clamp-2">
                          {image.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            aria-label="Zavřít"
          >
            <X className="h-8 w-8" />
          </button>
          <div className="max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImage.image_url}
              alt={selectedImage.title}
              className="w-full h-auto max-h-[80vh] object-contain"
            />
            <div className="mt-4 text-white text-center">
              <h2 className="text-2xl font-bold">{selectedImage.title}</h2>
              {selectedImage.description && (
                <p className="text-gray-300 mt-2">{selectedImage.description}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
      <Chatbot />
    </div>
  );
}