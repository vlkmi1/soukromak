import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Fish, MapPin, Users } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="relative h-[500px] bg-gradient-to-b from-accent/20 to-background overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: "url('/generated/pond-aerial.png')" }}
          />
          <div className="container relative h-full flex flex-col justify-center items-center text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
              Rybník Ostrata
            </h1>
            <p className="text-xl md:text-2xl text-secondary mb-8 max-w-2xl">
              Rezervujte si své oblíbené lovné místo online
            </p>
            <Link href="/rezervace">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg">
                <Calendar className="mr-2 h-5 w-5" />
                Zobrazit dostupnost
              </Button>
            </Link>
          </div>
        </section>

        <section className="py-16 bg-muted/50">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-12">Jak to funguje</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="border-2 hover:border-primary transition-colors">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>1. Vyberte místo</CardTitle>
                  <CardDescription>
                    Prohlédněte si interaktivní mapu rybníku s 13 lovnými místy
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:border-primary transition-colors">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                    <Calendar className="h-6 w-6 text-accent" />
                  </div>
                  <CardTitle>2. Zvolte datum</CardTitle>
                  <CardDescription>
                    Vyberte si termín a počet rybářů (1-3 osoby)
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:border-primary transition-colors">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                    <Fish className="h-6 w-6 text-secondary" />
                  </div>
                  <CardTitle>3. Potvrďte rezervaci</CardTitle>
                  <CardDescription>
                    Vyplňte kontaktní údaje a dokončete rezervaci
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container">
            <div className="bg-primary text-white rounded-2xl p-12 text-center">
              <Users className="h-16 w-16 mx-auto mb-6 opacity-90" />
              <h2 className="text-3xl font-bold mb-4">13 lovných míst</h2>
              <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
                Každé místo je vhodné pro 1-2 rybáře. Systém automaticky najde nejlepší dostupná místa podle vašich požadavků.
              </p>
              <Link href="/rezervace">
                <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                  Zobrazit mapu rybníku
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 bg-muted/50">
          <div className="container max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-12">Důležité informace</h2>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Kapacita míst</CardTitle>
                  <CardDescription>
                    Každé z 13 lovných míst může pojmout maximálně 2 rybáře. Při rezervaci pro více osob systém automaticky vyhledá vhodná sousední místa.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Potvrzení rezervace</CardTitle>
                  <CardDescription>
                    Po odeslání rezervace obdržíte potvrzovací email. Rezervace je platná až po jejím potvrzení správcem.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Storno podmínky</CardTitle>
                  <CardDescription>
                    Rezervaci je možné zrušit nejpozději 24 hodin před termínem. Kontaktujte nás prosím emailem nebo telefonicky.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}