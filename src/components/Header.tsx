import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getBrandSettings } from "@/lib/brandService";

interface MenuItem {
  slug: string;
  title: string;
  menu_order: number;
}

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [siteName, setSiteName] = useState("Rybník Ostrata");

  useEffect(() => {
    loadMenuItems();
    loadBrandSettings();
  }, []);

  const loadBrandSettings = async () => {
    try {
      const settings = await getBrandSettings();
      if (settings.site_name) {
        setSiteName(settings.site_name);
      }
    } catch (error) {
      console.error("Error loading brand settings:", error);
    }
  };

  const loadMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from("pages")
        .select("slug, title, menu_order")
        .eq("published", true)
        .eq("display_in_menu", true)
        .order("menu_order", { ascending: true });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error("Error loading menu items:", error);
      // Fallback - defaultní menu
      setMenuItems([
        { slug: "o-rybniku", title: "O rybníku", menu_order: 1 },
        { slug: "pravidla", title: "Pravidla", menu_order: 2 },
        { slug: "fotogalerie", title: "Fotogalerie", menu_order: 3 },
        { slug: "kontakt", title: "Kontakt", menu_order: 4 },
      ]);
    }
  };

  return (
    <header className="bg-white border-b-2 border-gray-300 sticky top-0 z-40">
      <div className="container">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-[#2a3d32] uppercase tracking-wider">
              {siteName}
            </span>
          </Link>

          {/* Desktop menu */}
          <nav className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <Link
                key={item.slug}
                href={`/${item.slug}`}
                className="text-[#2a3d32] hover:text-[#3d5a43] font-semibold uppercase tracking-wide text-sm transition-colors"
              >
                {item.title}
              </Link>
            ))}
            <Link href="/rezervace">
              <Button className="bg-[#3d5a43] hover:bg-[#4a6850] text-white font-bold uppercase tracking-wider">
                Rezervace
              </Button>
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-[#2a3d32]"
            aria-label="Menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              {menuItems.map((item) => (
                <Link
                  key={item.slug}
                  href={`/${item.slug}`}
                  className="text-[#2a3d32] hover:text-[#3d5a43] font-semibold uppercase tracking-wide text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.title}
                </Link>
              ))}
              <Link href="/rezervace" onClick={() => setIsMenuOpen(false)}>
                <Button className="bg-[#3d5a43] hover:bg-[#4a6850] text-white font-bold uppercase tracking-wider w-full">
                  Rezervace
                </Button>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}