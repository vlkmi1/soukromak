import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from "react";
import { getBrandSettings, applyBrandStyles } from "@/lib/brandService";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Načíst a aplikovat brand nastavení při načtení aplikace
    const loadBrand = async () => {
      try {
        const brand = await getBrandSettings();
        applyBrandStyles(brand);
      } catch (error) {
        console.error("Error loading brand settings:", error);
      }
    };

    loadBrand();
  }, []);

  return (
    <ThemeProvider>
      <Component {...pageProps} />
      <Toaster />
    </ThemeProvider>
  );
}