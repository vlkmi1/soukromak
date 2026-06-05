import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getBrandSettings, updateBrandSettings, clearBrandCache, type BrandSettings } from "@/lib/brandService";
import { Save, Palette, Type, Phone, Share2, Image as ImageIcon } from "lucide-react";

const POPULAR_FONTS = [
  "Roboto Condensed",
  "Inter",
  "Poppins",
  "Montserrat",
  "Open Sans",
  "Lato",
  "Raleway",
  "Oswald",
  "Source Sans Pro",
  "Playfair Display",
  "Merriweather",
  "PT Sans",
  "Noto Sans",
  "Ubuntu",
];

export default function BrandSettingsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPinPrompt, setShowPinPrompt] = useState(true);
  const [pin, setPin] = useState("");
  
  const [brand, setBrand] = useState<BrandSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const adminAuth = sessionStorage.getItem("adminAuth");
    if (adminAuth === "1234") {
      setIsAuthenticated(true);
      setShowPinPrompt(false);
      loadBrandSettings();
    }
  }, []);

  const handlePinSubmit = () => {
    if (pin === "1234") {
      sessionStorage.setItem("adminAuth", "1234");
      setIsAuthenticated(true);
      setShowPinPrompt(false);
      loadBrandSettings();
    } else {
      alert("Nesprávný PIN");
    }
  };

  const loadBrandSettings = async () => {
    try {
      const settings = await getBrandSettings();
      setBrand(settings);
    } catch (error) {
      console.error("Error loading brand settings:", error);
      setMessage({ type: "error", text: "Chyba při načítání nastavení" });
    }
  };

  const handleSave = async () => {
    if (!brand) return;

    setSaving(true);
    try {
      await updateBrandSettings(brand);
      clearBrandCache();
      setMessage({ type: "success", text: "Brand nastavení bylo úspěšně uloženo. Obnovte stránku pro zobrazení změn." });
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error("Error saving brand settings:", error);
      setMessage({ type: "error", text: "Chyba při ukládání nastavení" });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof BrandSettings, value: string) => {
    if (!brand) return;
    setBrand({ ...brand, [field]: value });
  };

  if (showPinPrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg border border-gray-300 w-full max-w-md">
          <h2 className="text-2xl font-bold text-[#2a3d32] mb-4 uppercase tracking-wide">Admin přístup</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="pin">Zadejte PIN</Label>
              <Input
                id="pin"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
                placeholder="****"
                className="mt-1"
              />
            </div>
            <Button onClick={handlePinSubmit} className="w-full bg-[#3d5a43] hover:bg-[#4a6850]">
              Přihlásit
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !brand) return null;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container max-w-5xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-[#2a3d32] mb-2 uppercase tracking-wide">
                Nastavení brandu
              </h1>
              <p className="text-gray-600">
                Upravte vzhled a identitu webu
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} className="bg-[#3d5a43] hover:bg-[#4a6850]">
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Ukládám..." : "Uložit změny"}
              </Button>
              <Button onClick={() => router.push("/admin")} variant="outline">
                Zpět na admin
              </Button>
            </div>
          </div>

          {message && (
            <Alert variant={message.type === "error" ? "destructive" : "default"} className="mb-6">
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Základní</span>
              </TabsTrigger>
              <TabsTrigger value="colors" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Barvy</span>
              </TabsTrigger>
              <TabsTrigger value="fonts" className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                <span className="hidden sm:inline">Fonty</span>
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span className="hidden sm:inline">Kontakt</span>
              </TabsTrigger>
              <TabsTrigger value="social" className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Sociální sítě</span>
              </TabsTrigger>
            </TabsList>

            {/* Základní nastavení */}
            <TabsContent value="basic" className="space-y-6">
              <div className="bg-white border border-gray-300 overflow-hidden">
                <div className="bg-[#f5f5f5] border-b border-gray-300 px-6 py-4">
                  <h2 className="text-lg font-bold text-[#2a3d32] uppercase tracking-wide">Základní informace</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="site_name" className="uppercase text-sm tracking-wide">Název webu</Label>
                    <Input
                      id="site_name"
                      value={brand.site_name}
                      onChange={(e) => updateField("site_name", e.target.value)}
                      placeholder="Rybník Ostrata"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="site_tagline" className="uppercase text-sm tracking-wide">Popisek</Label>
                    <Input
                      id="site_tagline"
                      value={brand.site_tagline}
                      onChange={(e) => updateField("site_tagline", e.target.value)}
                      placeholder="Kaprový rybník v Novém Veselí"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logo_url" className="uppercase text-sm tracking-wide">Logo URL</Label>
                    <Input
                      id="logo_url"
                      value={brand.logo_url || ""}
                      onChange={(e) => updateField("logo_url", e.target.value)}
                      placeholder="/logo.png"
                    />
                    <p className="text-xs text-gray-500">
                      Nahrajte logo do public/ složky a zde zadejte cestu (např. /logo.png)
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Barvy */}
            <TabsContent value="colors" className="space-y-6">
              <div className="bg-white border border-gray-300 overflow-hidden">
                <div className="bg-[#f5f5f5] border-b border-gray-300 px-6 py-4">
                  <h2 className="text-lg font-bold text-[#2a3d32] uppercase tracking-wide">Barevné schéma</h2>
                  <p className="text-sm text-gray-600 mt-1">Formát: H S% L% (např. "142 70% 25%")</p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="color_primary" className="uppercase text-sm tracking-wide">Primární barva</Label>
                      <div className="flex gap-2">
                        <Input
                          id="color_primary"
                          value={brand.color_primary}
                          onChange={(e) => updateField("color_primary", e.target.value)}
                          placeholder="142 70% 25%"
                        />
                        <div 
                          className="w-12 h-10 rounded border border-gray-300"
                          style={{ backgroundColor: `hsl(${brand.color_primary})` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="color_secondary" className="uppercase text-sm tracking-wide">Sekundární barva</Label>
                      <div className="flex gap-2">
                        <Input
                          id="color_secondary"
                          value={brand.color_secondary}
                          onChange={(e) => updateField("color_secondary", e.target.value)}
                          placeholder="142 60% 35%"
                        />
                        <div 
                          className="w-12 h-10 rounded border border-gray-300"
                          style={{ backgroundColor: `hsl(${brand.color_secondary})` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="color_accent" className="uppercase text-sm tracking-wide">Akcentová barva</Label>
                      <div className="flex gap-2">
                        <Input
                          id="color_accent"
                          value={brand.color_accent}
                          onChange={(e) => updateField("color_accent", e.target.value)}
                          placeholder="142 65% 45%"
                        />
                        <div 
                          className="w-12 h-10 rounded border border-gray-300"
                          style={{ backgroundColor: `hsl(${brand.color_accent})` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="color_background" className="uppercase text-sm tracking-wide">Barva pozadí</Label>
                      <div className="flex gap-2">
                        <Input
                          id="color_background"
                          value={brand.color_background}
                          onChange={(e) => updateField("color_background", e.target.value)}
                          placeholder="0 0% 100%"
                        />
                        <div 
                          className="w-12 h-10 rounded border border-gray-300"
                          style={{ backgroundColor: `hsl(${brand.color_background})` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="color_foreground" className="uppercase text-sm tracking-wide">Barva textu</Label>
                      <div className="flex gap-2">
                        <Input
                          id="color_foreground"
                          value={brand.color_foreground}
                          onChange={(e) => updateField("color_foreground", e.target.value)}
                          placeholder="0 0% 20%"
                        />
                        <div 
                          className="w-12 h-10 rounded border border-gray-300"
                          style={{ backgroundColor: `hsl(${brand.color_foreground})` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Fonty */}
            <TabsContent value="fonts" className="space-y-6">
              <div className="bg-white border border-gray-300 overflow-hidden">
                <div className="bg-[#f5f5f5] border-b border-gray-300 px-6 py-4">
                  <h2 className="text-lg font-bold text-[#2a3d32] uppercase tracking-wide">Typografie</h2>
                  <p className="text-sm text-gray-600 mt-1">Vyberte fonty z Google Fonts</p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="font_heading" className="uppercase text-sm tracking-wide">Font pro nadpisy</Label>
                    <select
                      id="font_heading"
                      value={brand.font_heading}
                      onChange={(e) => updateField("font_heading", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      {POPULAR_FONTS.map((font) => (
                        <option key={font} value={font} style={{ fontFamily: font }}>
                          {font}
                        </option>
                      ))}
                    </select>
                    <p className="text-sm" style={{ fontFamily: brand.font_heading, fontSize: "1.5rem", fontWeight: 700 }}>
                      Ukázka nadpisu
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="font_body" className="uppercase text-sm tracking-wide">Font pro text</Label>
                    <select
                      id="font_body"
                      value={brand.font_body}
                      onChange={(e) => updateField("font_body", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      {POPULAR_FONTS.map((font) => (
                        <option key={font} value={font} style={{ fontFamily: font }}>
                          {font}
                        </option>
                      ))}
                    </select>
                    <p className="text-sm" style={{ fontFamily: brand.font_body }}>
                      Ukázka běžného textu. Rybník Ostrata je kaprový rybník v Novém Veselí.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Kontakt */}
            <TabsContent value="contact" className="space-y-6">
              <div className="bg-white border border-gray-300 overflow-hidden">
                <div className="bg-[#f5f5f5] border-b border-gray-300 px-6 py-4">
                  <h2 className="text-lg font-bold text-[#2a3d32] uppercase tracking-wide">Kontaktní informace</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone" className="uppercase text-sm tracking-wide">Telefon</Label>
                    <Input
                      id="contact_phone"
                      value={brand.contact_phone}
                      onChange={(e) => updateField("contact_phone", e.target.value)}
                      placeholder="+420 123 456 789"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_email" className="uppercase text-sm tracking-wide">Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={brand.contact_email}
                      onChange={(e) => updateField("contact_email", e.target.value)}
                      placeholder="info@rybnikostrata.cz"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_address" className="uppercase text-sm tracking-wide">Adresa</Label>
                    <Textarea
                      id="contact_address"
                      value={brand.contact_address}
                      onChange={(e) => updateField("contact_address", e.target.value)}
                      placeholder="Nové Veselí"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Sociální sítě */}
            <TabsContent value="social" className="space-y-6">
              <div className="bg-white border border-gray-300 overflow-hidden">
                <div className="bg-[#f5f5f5] border-b border-gray-300 px-6 py-4">
                  <h2 className="text-lg font-bold text-[#2a3d32] uppercase tracking-wide">Sociální sítě</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="social_facebook" className="uppercase text-sm tracking-wide">Facebook</Label>
                    <Input
                      id="social_facebook"
                      value={brand.social_facebook || ""}
                      onChange={(e) => updateField("social_facebook", e.target.value)}
                      placeholder="https://www.facebook.com/rybnikostrata"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="social_instagram" className="uppercase text-sm tracking-wide">Instagram</Label>
                    <Input
                      id="social_instagram"
                      value={brand.social_instagram || ""}
                      onChange={(e) => updateField("social_instagram", e.target.value)}
                      placeholder="https://www.instagram.com/rybnikostrata"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}