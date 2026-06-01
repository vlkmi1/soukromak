import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-[#1a4d2e] text-white">
      <div className="container">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img 
              src="/logo-ostrata.png" 
              alt="Rybník Ostrata" 
              className="h-12 w-auto"
              onError={(e) => {
                // Fallback pokud logo neexistuje
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <span className="font-bold text-2xl hidden">Rybník Ostrata</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-white/90 hover:text-white transition-colors uppercase">
              Aktuality
            </Link>
            <Link href="/#o-nas" className="text-sm font-medium text-white/90 hover:text-white transition-colors uppercase">
              O nás
            </Link>
            <Link href="/rezervace" className="text-sm font-medium text-white/90 hover:text-white transition-colors uppercase">
              Rezervace
            </Link>
            <Link href="/#zavody" className="text-sm font-medium text-white/90 hover:text-white transition-colors uppercase">
              Závody
            </Link>
            <Link href="/#foto" className="text-sm font-medium text-white/90 hover:text-white transition-colors uppercase">
              Foto
            </Link>
            <Link href="/#kontakt" className="text-sm font-medium text-white/90 hover:text-white transition-colors uppercase">
              Kontakt
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
            <Link href="/" className="block text-sm font-medium text-white/90 hover:text-white transition-colors uppercase">
              Aktuality
            </Link>
            <Link href="/#o-nas" className="block text-sm font-medium text-white/90 hover:text-white transition-colors uppercase">
              O nás
            </Link>
            <Link href="/rezervace" className="block text-sm font-medium text-white/90 hover:text-white transition-colors uppercase">
              Rezervace
            </Link>
            <Link href="/#zavody" className="block text-sm font-medium text-white/90 hover:text-white transition-colors uppercase">
              Závody
            </Link>
            <Link href="/#foto" className="block text-sm font-medium text-white/90 hover:text-white transition-colors uppercase">
              Foto
            </Link>
            <Link href="/#kontakt" className="block text-sm font-medium text-white/90 hover:text-white transition-colors uppercase">
              Kontakt
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}