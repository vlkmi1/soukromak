import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calendar, Fish, MapPin } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        {/* Hero sekce - tmavý background jako na screenshotu */}
        <section className="relative bg-[#2a3d32] text-white py-24">
          {/* Tmavý overlay pro lepší čitelnost */}
          <div className="absolute inset-0 bg-black/30"></div>
          
          <div className="container text-center relative z-10">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-wide uppercase">Můj soukromák

            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto font-light">Kaprový rybník se 14 lovnými místy

            </p>
            <Link href="/rezervace">
              <Button size="lg" className="bg-[#3d5a43] hover:bg-[#4a6850] text-white text-base px-8 py-6 uppercase tracking-wider font-bold">
                Rezervovat lovné místo
              </Button>
            </Link>
          </div>
        </section>

        {/* O rybníku - jednodušší bez přehnaných prvků */}
        <section className="py-20 bg-white" id="o-nas">
          <div className="container max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-[#2a3d32] mb-6 uppercase tracking-wide">
                O rybníku
              </h2>
            </div>
            
            <div className="text-center space-y-6 text-gray-700 text-lg leading-relaxed">
              <p>Rybník soukromák je kaprový rybník nacházející se v Novém Veselí. Nabízíme 14 kvalitních lovných míst s možností rezervace online.


              </p>
              <p>
                Každé lovné místo může pojmout až 2 rybáře. Rybník je ideální 
                pro sportovní lov kaprů i rodinné rybářské akce.
              </p>
            </div>
          </div>
        </section>

        {/* Rezervace CTA - tmavší pozadí */}
        <section className="py-20 bg-[#f5f5f5]">
          <div className="container text-center max-w-3xl">
            <h2 className="text-4xl md:text-5xl font-bold text-[#2a3d32] mb-6 uppercase tracking-wide">
              Připraveni na lov?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Rezervujte si lovné místo online a vyberte si termín, který vám vyhovuje.
            </p>
            <Link href="/rezervace">
              <Button size="lg" className="bg-[#3d5a43] hover:bg-[#4a6850] text-white text-base px-8 py-6 uppercase tracking-wider font-bold">
                Rezervovat nyní
              </Button>
            </Link>
          </div>
        </section>

        {/* Kontakt - jednoduchý */}
        <section className="py-20 bg-white" id="kontakt">
          <div className="container max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-[#2a3d32] mb-6 uppercase tracking-wide">
                Kontakt
              </h2>
            </div>

            <div className="text-center space-y-4">
              <p className="text-lg text-gray-700">Rybník soukromák, Nové Veselí

              </p>
              <p className="text-gray-600">
                Pro více informací nás kontaktujte prostřednictvím sociálních sítí.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>);

}