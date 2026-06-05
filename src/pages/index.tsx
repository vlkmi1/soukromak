import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Chatbot } from "@/components/Chatbot";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MapPin, Calendar, Fish } from "lucide-react";
import { getBrandSettings } from "@/lib/brandService";

export default function HomePage() {
  const [siteName, setSiteName] = useState("Rybník Ostrata");
  const [tagline, setTagline] = useState("Kaprový rybník v Novém Veselí");

  useEffect(() => {
    loadBrandSettings();
  }, []);

  const loadBrandSettings = async () => {
    try {
      const settings = await getBrandSettings();
      if (settings.site_name) {
        setSiteName(settings.site_name);
      }
      if (settings.tagline) {
        setTagline(settings.tagline);
      }
    } catch (error) {
      console.error("Error loading brand settings:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        {/* Hero sekce */}
        <section className="relative bg-gradient-to-br from-[#3d5a43] to-[#2a3d32] text-white py-24">
          <div className="container text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 uppercase tracking-wide">
              {siteName}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-100">
              {tagline}
            </p>
            <Link href="/rezervace">
              <Button size="lg" className="bg-white text-[#3d5a43] hover:bg-gray-100 text-lg px-8 py-6 font-bold uppercase tracking-wider">
                <Calendar className="h-5 w-5 mr-2" />
                Rezervovat místo
              </Button>
            </Link>
          </div>
        </section>

        {/* Vlastnosti */}
        <section className="py-16 bg-gray-50">
          <div className="container">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-white border border-gray-300">
                <div className="bg-[#3d5a43] text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-[#2a3d32] mb-2 uppercase tracking-wide">14 Lovných míst</h3>
                <p className="text-gray-600">
                  Každé místo s 2 pozicemi pro rybáře
                </p>
              </div>

              <div className="text-center p-6 bg-white border border-gray-300">
                <div className="bg-[#3d5a43] text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-[#2a3d32] mb-2 uppercase tracking-wide">Online rezervace</h3>
                <p className="text-gray-600">
                  Jednoduché a rychlé rezervování míst
                </p>
              </div>

              <div className="text-center p-6 bg-white border border-gray-300">
                <div className="bg-[#3d5a43] text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Fish className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-[#2a3d32] mb-2 uppercase tracking-wide">Kvalitní rybolov</h3>
                <p className="text-gray-600">
                  Ideální podmínky pro kaprový rybolov
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* O rybníku */}
        <section className="py-16">
          <div className="container max-w-4xl">
            <h2 className="text-3xl font-bold text-center text-[#2a3d32] mb-8 uppercase tracking-wide">
              O rybníku
            </h2>
            <div className="prose max-w-none text-gray-700">
              <p className="text-lg leading-relaxed">
                {siteName} nabízí 14 lovných míst s možností rezervace online. 
                Každé místo má 2 pozice pro rybáře. Ideální pro kaprový rybolov v příjemném prostředí.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <Chatbot />
    </div>
  );
}