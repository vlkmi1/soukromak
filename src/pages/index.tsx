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
        {/* Hero sekce */}
        <section className="relative bg-gradient-to-b from-[#1a4d2e] to-[#2d6b42] text-white py-20">
          <div className="container text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Rybník Ostrata
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              Kaprový rybník v Novém Veselí s 14 lovnými místy
            </p>
            <Link href="/rezervace">
              <Button size="lg" className="bg-white text-[#1a4d2e] hover:bg-white/90 text-lg px-8 py-6">
                <Calendar className="mr-2 h-5 w-5" />
                Rezervovat lovné místo
              </Button>
            </Link>
          </div>
        </section>

        {/* O rybníku */}
        <section className="py-16 bg-white" id="o-nas">
          <div className="container max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[#1a4d2e] mb-4">
                O rybníku
              </h2>
              <div className="w-20 h-1 bg-[#2d6b42] mx-auto mb-6"></div>
            </div>
            
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="text-lg leading-relaxed mb-6">
                Rybník Ostrata je kaprový rybník nacházející se v Novém Veselí. 
                Nabízíme 14 kvalitních lovných míst s možností rezervace online.
              </p>
              <p className="text-lg leading-relaxed">
                Každé lovné místo může pojmout až 2 rybáře. Rybník je ideální 
                pro sportovní lov kaprů i rodinné rybářské akce.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mt-12">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#1a4d2e]/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-6 w-6 text-[#1a4d2e]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#1a4d2e] mb-2">14 lovných míst</h3>
                  <p className="text-gray-600">Každé místo s kapacitou pro 2 rybáře</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#1a4d2e]/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Fish className="h-6 w-6 text-[#1a4d2e]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#1a4d2e] mb-2">Kaprový rybník</h3>
                  <p className="text-gray-600">Kvalitní násada a udržovaný rybník</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Rezervace CTA */}
        <section className="py-16 bg-[#f8f9fa]">
          <div className="container text-center max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1a4d2e] mb-6">
              Připraveni na lov?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Rezervujte si lovné místo online a vyberte si termín, který vám vyhovuje.
            </p>
            <Link href="/rezervace">
              <Button size="lg" className="bg-[#1a4d2e] hover:bg-[#2d6b42] text-white text-lg px-8 py-6">
                <Calendar className="mr-2 h-5 w-5" />
                Rezervovat nyní
              </Button>
            </Link>
          </div>
        </section>

        {/* Kontakt */}
        <section className="py-16 bg-white" id="kontakt">
          <div className="container max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[#1a4d2e] mb-4">
                Kontakt
              </h2>
              <div className="w-20 h-1 bg-[#2d6b42] mx-auto mb-6"></div>
            </div>

            <div className="text-center">
              <p className="text-lg text-gray-700 mb-4">
                Rybník Ostrata, Nové Veselí
              </p>
              <p className="text-gray-600">
                Pro více informací nás kontaktujte prostřednictvím sociálních sítí.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}