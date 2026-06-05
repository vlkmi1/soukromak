import Link from "next/link";
import { useState, useEffect } from "react";
import { getBrandSettings, type BrandSettings } from "@/lib/brandService";

export function Footer() {
  const [brand, setBrand] = useState<BrandSettings | null>(null);

  useEffect(() => {
    getBrandSettings().then(setBrand);
  }, []);

  const siteName = brand?.site_name || "Rybník Ostrata";
  const contactPhone = brand?.contact_phone || "+420 123 456 789";
  const contactEmail = brand?.contact_email || "info@rybnikostrata.cz";
  const contactAddress = brand?.contact_address || "Nové Veselí";
  const facebookUrl = brand?.facebook_url;
  const instagramUrl = brand?.instagram_url;

  return (
    <footer className="bg-[#2a3d32] text-white py-8">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {/* O rybníku */}
          <div>
            <h3 className="font-bold mb-3 uppercase tracking-wide">O rybníku</h3>
            <p className="text-white/80 text-sm leading-relaxed">
              {siteName} - kaprový rybník s možností online rezervace lovných míst.
            </p>
          </div>

          {/* Kontakt */}
          <div>
            <h3 className="font-bold mb-3 uppercase tracking-wide">Kontakt</h3>
            <div className="space-y-2 text-sm text-white/80">
              <p>{contactAddress}</p>
              <p>Tel: {contactPhone}</p>
              <p>Email: {contactEmail}</p>
            </div>
          </div>

          {/* Sociální sítě */}
          <div>
            <h3 className="font-bold mb-3 uppercase tracking-wide">Sledujte nás</h3>
            <div className="flex gap-4">
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-white transition-colors"
                >
                  Facebook
                </a>
              )}
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-white transition-colors"
                >
                  Instagram
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/20 pt-6 text-center text-sm text-white/60">
          <p>&copy; {new Date().getFullYear()} {siteName}. Všechna práva vyhrazena.</p>
        </div>
      </div>
    </footer>
  );
}