import { GetStaticPaths, GetStaticProps } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Chatbot } from "@/components/Chatbot";
import { supabase } from "@/lib/supabase";
import { SEO } from "@/components/SEO";

interface PageProps {
  page: {
    title: string;
    content: string;
    excerpt: string;
    featured_image: string | null;
  };
}

export default function DynamicPage({ page }: PageProps) {
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

export const getStaticPaths: GetStaticPaths = async () => {
  // Vercel build: Don't query database at build time
  // Pages will be generated on-demand with fallback: 'blocking'
  return {
    paths: [],
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;

  const { data: page, error } = await supabase
    .from("pages")
    .select("title, content, excerpt, featured_image")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (error || !page) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      page,
    },
    revalidate: 60,
  };
};