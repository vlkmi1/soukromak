import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-[#3d5a43] text-white">
      <div className="container">
        <div className="flex h-20 items-center justify-between">
          {/* Logo - jednoduchý text uppercase */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="text-2xl font-bold tracking-wide">
              RYBNÍK<br/>OSTRATA
            </div>
          </Link>

          {/* Desktop Navigation - vše uppercase */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link href="/" className="text-sm font-bold tracking-wider text-white hover:text-white/80 transition-colors uppercase">
              Aktuality
            </Link>
            <Link href="/#o-nas" className="text-sm font-bold tracking-wider text-white hover:text-white/80 transition-colors uppercase">
              O nás
            </Link>
            <Link href="/rezervace" className="text-sm font-bold tracking-wider text-white hover:text-white/80 transition-colors uppercase">
              Rezervace
            </Link>
            <Link href="/#informace" className="text-sm font-bold tracking-wider text-white hover:text-white/80 transition-colors uppercase">
              Informace
            </Link>
            <Link href="/#zavody" className="text-sm font-bold tracking-wider text-white hover:text-white/80 transition-colors uppercase">
              Závody
            </Link>
            <Link href="/#foto" className="text-sm font-bold tracking-wider text-white hover:text-white/80 transition-colors uppercase">
              Foto
            </Link>
            <Link href="/#kontakt" className="text-sm font-bold tracking-wider text-white hover:text-white/80 transition-colors uppercase">
              Kontakt
            </Link>
            <Link href="/admin" className="text-sm font-bold tracking-wider text-white/60 hover:text-white/40 transition-colors uppercase">
              Admin
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white hover:bg-white/10"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="lg:hidden py-6 border-t border-white/10 space-y-4">
            <Link href="/" className="block text-sm font-bold tracking-wider text-white hover:text-white/80 transition-colors uppercase">
              Aktuality
            </Link>
            <Link href="/#o-nas" className="block text-sm font-bold tracking-wider text-white hover:text-white/80 transition-colors uppercase">
              O nás
            </Link>
            <Link href="/rezervace" className="block text-sm font-bold tracking-wider text-white hover:text-white/80 transition-colors uppercase">
              Rezervace
            </Link>
            <Link href="/#informace" className="block text-sm font-bold tracking-wider text-white hover:text-white/80 transition-colors uppercase">
              Informace
            </Link>
            <Link href="/#zavody" className="block text-sm font-bold tracking-wider text-white hover:text-white/80 transition-colors uppercase">
              Závody
            </Link>
            <Link href="/#foto" className="block text-sm font-bold tracking-wider text-white hover:text-white/80 transition-colors uppercase">
              Foto
            </Link>
            <Link href="/#kontakt" className="block text-sm font-bold tracking-wider text-white hover:text-white/80 transition-colors uppercase">
              Kontakt
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}