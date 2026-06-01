import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#2a3d32] text-white/80 mt-auto border-t border-white/10">
      <div className="container py-6">
        <div className="text-center text-sm">
          <p className="mb-3">
            © {new Date().getFullYear()} Rybník Ostrata. Všechna práva vyhrazena.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap text-xs">
            <Link href="/#kontakt" className="hover:text-white transition-colors uppercase tracking-wide">
              Kontakt
            </Link>
            <span className="text-white/30">•</span>
            <a 
              href="https://www.facebook.com/people/Rybn%C3%ADk-Ostrata/100088864874003/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-white transition-colors uppercase tracking-wide"
            >
              Facebook
            </a>
            <span className="text-white/30">•</span>
            <a 
              href="https://www.instagram.com/rybnik_ostrata/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-white transition-colors uppercase tracking-wide"
            >
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}