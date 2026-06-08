import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Save, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ADMIN_PIN = "1234";

interface PricingRule {
  id?: number;
  name: string;
  days: number;
  price_per_day: number;
  is_active: boolean;
}

export default function PricingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const authStatus = sessionStorage.getItem("adminAuthenticated");
      if (authStatus === "true") {
        setIsAuthenticated(true);
        loadPricing();
      } else {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem("adminAuthenticated", "true");
      setIsAuthenticated(true);
      setPinError(false);
      loadPricing();
    } else {
      setPinError(true);
      setPin("");
    }
  };

  const loadPricing = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Loading pricing from database...");
      
      const { data, error } = await supabase
        .from("pricing")
        .select("*")
        .order("days", { ascending: true });

      console.log("Pricing query result:", { data, error });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn("No pricing data found in database");
        setError("V databázi nejsou žádné cenové balíčky. Klikněte na 'Načíst výchozí ceny' pro vytvoření.");
        setPricingRules([]);
        return;
      }

      console.log("Loaded pricing packages:", data);
      setPricingRules(data);
    } catch (err: any) {
      console.error("Error loading pricing:", err);
      setError(`Nepodařilo se načíst ceník: ${err.message || "Neznámá chyba"}`);
      setPricingRules([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (id: number | undefined, field: keyof PricingRule, value: any) => {
    setPricingRules(prev => 
      prev.map(rule => 
        rule.id === id ? { ...rule, [field]: value } : rule
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Aktualizovat existující pravidla
      for (const rule of pricingRules) {
        if (rule.id) {
          const { error } = await supabase
            .from("pricing")
            .update({
              name: rule.name,
              price_per_day: rule.price_per_day,
              is_active: rule.is_active,
            })
            .eq("id", rule.id);

          if (error) throw error;
        }
      }

      toast({
        title: "Uloženo",
        description: "Ceník byl úspěšně aktualizován.",
      });

      loadPricing();
    } catch (error: any) {
      console.error("Error saving pricing:", error);
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se uložit ceník.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLoadDefaults = async () => {
    setSaving(true);
    setError(null);
    
    try {
      const defaultPricing = [
        { days: 1, name: "1denní balíček", price_per_day: 500, is_active: true },
        { days: 2, name: "2denní balíček", price_per_day: 450, is_active: true },
        { days: 3, name: "3denní balíček", price_per_day: 400, is_active: true },
        { days: 4, name: "4denní balíček", price_per_day: 375, is_active: true },
        { days: 5, name: "5denní balíček", price_per_day: 350, is_active: true },
        { days: 6, name: "6denní balíček", price_per_day: 333, is_active: true },
        { days: 7, name: "7denní týdenní balíček", price_per_day: 314, is_active: true },
      ];

      const { error } = await supabase
        .from("pricing")
        .insert(defaultPricing);

      if (error) throw error;

      toast({
        title: "Hotovo",
        description: "Výchozí ceník byl úspěšně načten.",
      });

      // Clear cache in pricing.ts
      const { clearPricingCache } = await import("@/lib/pricing");
      clearPricingCache();

      loadPricing();
    } catch (error: any) {
      console.error("Error loading defaults:", error);
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se načíst výchozí ceny.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center p-8">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Admin přístup</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePinSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="pin">Zadejte PIN</Label>
                  <Input
                    id="pin"
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="****"
                    autoFocus
                  />
                </div>
                {pinError && (
                  <Alert variant="destructive">
                    <AlertDescription>Nesprávný PIN</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full">
                  Přihlásit
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Button
                variant="ghost"
                onClick={() => router.push("/admin")}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zpět na admin
              </Button>
              <h1 className="text-4xl font-bold text-[#2a3d32] uppercase tracking-wide">
                Správa ceníku
              </h1>
              <p className="text-gray-600 mt-2">
                Nastavte ceny pro jednotlivé balíčky podle počtu dnů
              </p>
            </div>
            <DollarSign className="h-16 w-16 text-[#3d5a43]" />
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Načítám ceník...</p>
            </div>
          ) : error ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="text-center">
                <Button
                  onClick={handleLoadDefaults}
                  disabled={saving}
                  className="bg-[#3d5a43] hover:bg-[#4a6850]"
                >
                  {saving ? "Načítám..." : "Načíst výchozí ceny"}
                </Button>
              </div>
            </div>
          ) : pricingRules.length === 0 ? (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>V databázi nejsou žádné cenové balíčky.</AlertDescription>
              </Alert>
              <div className="text-center">
                <Button
                  onClick={handleLoadDefaults}
                  disabled={saving}
                  className="bg-[#3d5a43] hover:bg-[#4a6850]"
                >
                  {saving ? "Načítám..." : "Načíst výchozí ceny"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Cenové balíčky</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pricingRules.map((rule) => (
                    <div key={rule.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Label htmlFor={`name-${rule.id}`}>Název balíčku</Label>
                          <Input
                            id={`name-${rule.id}`}
                            value={rule.name}
                            onChange={(e) => handlePriceChange(rule.id, "name", e.target.value)}
                            placeholder="Např. 1denní balíček"
                          />
                        </div>
                        <div className="w-32">
                          <Label htmlFor={`days-${rule.id}`}>Počet dnů</Label>
                          <Input
                            id={`days-${rule.id}`}
                            type="number"
                            value={rule.days}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Label htmlFor={`price-${rule.id}`}>Cena za den (Kč)</Label>
                          <Input
                            id={`price-${rule.id}`}
                            type="number"
                            value={rule.price_per_day}
                            onChange={(e) => handlePriceChange(rule.id, "price_per_day", parseFloat(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                        <div className="flex-1">
                          <Label>Celková cena</Label>
                          <div className="h-10 px-3 py-2 border border-gray-200 rounded-md bg-gray-50 flex items-center">
                            <span className="font-bold text-[#3d5a43]">
                              {(rule.days * rule.price_per_day).toLocaleString("cs-CZ")} Kč
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`active-${rule.id}`}
                          checked={rule.is_active}
                          onChange={(e) => handlePriceChange(rule.id, "is_active", e.target.checked)}
                          className="w-4 h-4 text-[#3d5a43] border-gray-300 rounded"
                        />
                        <Label htmlFor={`active-${rule.id}`} className="cursor-pointer">
                          Aktivní balíček
                        </Label>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push("/admin")}
                >
                  Zrušit
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#3d5a43] hover:bg-[#4a6850]"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Ukládám..." : "Uložit ceník"}
                </Button>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>💡 Tip:</strong> Ceník se automaticky použije při vytváření nových rezervací. 
                  Existující rezervace zůstanou zachovány s původními cenami.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}