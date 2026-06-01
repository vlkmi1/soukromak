import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#1a4d2e] text-white mt-auto">
      <div className="container py-8">
        <div className="text-center text-sm text-white/80">
          <p className="mb-2">
            © {new Date().getFullYear()} Rybník Ostrata
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/#kontakt" className="hover:text-white transition-colors">
              Kontakt
            </Link>
            <span className="text-white/40">•</span>
            <a 
              href="https://www.facebook.com/people/Rybn%C3%ADk-Ostrata/100088864874003/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Facebook
            </a>
            <span className="text-white/40">•</span>
            <a 
              href="https://www.instagram.com/rybnik_ostrata/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}