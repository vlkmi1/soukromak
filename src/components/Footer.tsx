import Link from "next/link";
import { Facebook, Instagram, Mail, Phone, MapPin, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* O rybníku */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-primary">Rybník Ostrata</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Moderní rezervační systém pro lovná místa na rybníku Ostrata. 
              Rezervujte si své místo online a užijte si skvělý rybolov.
            </p>
          </div>

          {/* Rychlé odkazy */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-primary">Rychlé odkazy</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Aktuality
                </Link>
              </li>
              <li>
                <Link href="/#o-nas" className="text-muted-foreground hover:text-primary transition-colors">
                  O nás
                </Link>
              </li>
              <li>
                <Link href="/rezervace" className="text-muted-foreground hover:text-primary transition-colors">
                  Rezervace
                </Link>
              </li>
              <li>
                <Link href="/#cenik" className="text-muted-foreground hover:text-primary transition-colors">
                  Ceník
                </Link>
              </li>
              <li>
                <Link href="/#podminky" className="text-muted-foreground hover:text-primary transition-colors">
                  Podmínky rybolovu
                </Link>
              </li>
            </ul>
          </div>

          {/* Kontakt */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-primary">Kontakt</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <a href="mailto:info@rybnikostrata.cz" className="text-muted-foreground hover:text-primary transition-colors">
                  info@rybnikostrata.cz
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <a href="tel:+420123456789" className="text-muted-foreground hover:text-primary transition-colors">
                  +420 123 456 789
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  Rybník Ostrata<br />
                  Česká republika
                </span>
              </li>
            </ul>
          </div>

          {/* Sociální sítě & Provozní doba */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-primary">Sledujte nás</h3>
            <div className="flex items-center gap-3 mb-6">
              <a
                href="https://www.facebook.com/people/Rybn%C3%ADk-Ostrata/100088864874003/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary hover:text-white flex items-center justify-center text-primary transition-all"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/rybnik_ostrata/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary hover:text-white flex items-center justify-center text-primary transition-all"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://www.fishinginvest.cz/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary hover:text-white flex items-center justify-center text-primary transition-all"
                aria-label="Fishing Invest"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            </div>
            
            <h4 className="font-semibold text-sm mb-2">Provozní doba</h4>
            <p className="text-sm text-muted-foreground">
              Pondělí - Neděle<br />
              6:00 - 22:00
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            © {new Date().getFullYear()} Rybník Ostrata. Všechna práva vyhrazena.
          </p>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/zasady-cookies" className="text-muted-foreground hover:text-primary transition-colors">
              Zásady cookies (EU)
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}