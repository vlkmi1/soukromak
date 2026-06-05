import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { getBrandSettings, type BrandSettings } from "@/lib/brandService";
import { Button } from "@/components/ui/button";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [brand, setBrand] = useState<BrandSettings | null>(null);

  useEffect(() => {
    getBrandSettings().then(setBrand);
  }, []);

  const siteName = brand?.site_name || "RYBNÍK OSTRATA";

  return (
    <header className="sticky top-0 z-50 bg-[#3d5a43] text-white shadow-md">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo a název */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            {brand?.logo_url ? (
              <img src={brand.logo_url} alt={siteName} className="h-10 w-auto" />
            ) : (
              <>
                <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.46-4.44 6-8 6s-7.06-2.54-8-6z" />
                  <path d="M18 5L22 9" />
                  <path d="M2 9L6 5" />
                  <circle cx="12" cy="12" r="1" fill="currentColor" />
                </svg>
                <span className="text-xl font-bold tracking-wider uppercase">
                  {siteName}
                </span>
              </>
            )}
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