import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Chatbot } from "@/components/Chatbot";
import { supabase } from "@/lib/supabase";
import { SEO } from "@/components/SEO";

interface PageData {
  title: string;
  content: string;
  excerpt: string;
  featured_image: string | null;
}

export default function DynamicPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [page, setPage] = useState<PageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    
    loadPage(slug as string);
  }, [slug]);

  const loadPage = async (pageSlug: string) => {
    try {
      const { data, error } = await supabase
        .from("pages")
        .select("title, content, excerpt, featured_image")
        .eq("slug", pageSlug)
        .eq("published", true)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setPage(data);
      }
    } catch (error) {
      console.error("Error loading page:", error);
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-lg text-gray-600">Načítám stránku...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-lg text-gray-600 mb-8">Stránka nebyla nalezena</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-[#3d5a43] text-white rounded-lg hover:bg-[#4a6850] transition-colors"
          >
            Zpět na hlavní stránku
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SEO
        title={`${page.title} | Rybník Ostrata`}
        description={page.excerpt}
        image={page.featured_image || undefined}
      />
      <Header />

      <main className="flex-1">
        {page.featured_image && (
          <div className="relative h-64 bg-gradient-to-br from-[#3d5a43] to-[#2a3d32] overflow-hidden">
            <img
              src={page.featured_image}
              alt={page.title}
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <h1 className="text-4xl md:text-5xl font-bold text-white uppercase tracking-wide">
                {page.title}
              </h1>
            </div>
          </div>
        )}

        <div className="container max-w-4xl py-16">
          {!page.featured_image && (
            <h1 className="text-4xl md:text-5xl font-bold text-[#2a3d32] mb-8 uppercase tracking-wide">
              {page.title}
            </h1>
          )}

          <div
            className="prose prose-lg max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </div>
      </main>

      <Footer />
      <Chatbot />
    </div>
  );
}