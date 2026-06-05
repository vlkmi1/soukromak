import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { Upload, Plus, Trash2, Save, X, Move } from "lucide-react";

interface SpotPosition {
  id?: number;
  spot_number: number;
  x_position: number;
  y_position: number;
  is_active: boolean;
}

interface PondSettings {
  id: number;
  image_url: string;
}

export default function MapSettingsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPinPrompt, setShowPinPrompt] = useState(true);
  const [pin, setPin] = useState("");
  
  const [spots, setSpots] = useState<SpotPosition[]>([]);
  const [pondSettings, setPondSettings] = useState<PondSettings | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draggedSpot, setDraggedSpot] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const adminAuth = sessionStorage.getItem("adminAuth");
    if (adminAuth === "1234") {
      setIsAuthenticated(true);
      setShowPinPrompt(false);
      loadSettings();
    }
  }, []);

  const handlePinSubmit = () => {
    if (pin === "1234") {
      sessionStorage.setItem("adminAuth", "1234");
      setIsAuthenticated(true);
      setShowPinPrompt(false);
      loadSettings();
    } else {
      alert("Nesprávný PIN");
    }
  };

  const loadSettings = async () => {
    try {
      // Načíst nastavení rybníku
      const { data: settings, error: settingsError } = await supabase
        .from("pond_settings")
        .select("*")
        .order("id", { ascending: false })
        .limit(1)
        .single();

      if (settingsError) throw settingsError;

      setPondSettings(settings);
      setImageUrl(settings.image_url);

      // Načíst pozice míst
      const { data: positions, error: positionsError } = await supabase
        .from("spot_positions")
        .select("*")
        .eq("pond_settings_id", settings.id)
        .order("spot_number");

      if (positionsError) throw positionsError;

      setSpots(positions || []);
    } catch (error) {
      console.error("Error loading settings:", error);
      setMessage({ type: "error", text: "Chyba při načítání nastavení" });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Vytvořit data URL pro okamžitý náhled
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setImageUrl(dataUrl);
        setMessage({ type: "success", text: "Obrázek byl načten. Nezapomeňte uložit nastavení!" });
      };
      reader.readAsDataURL(file);
      
      // Pro produkci by se obrázek nahrál na server/CDN
      // Nyní ukládáme jako data URL přímo do databáze
    } catch (error) {
      console.error("Error uploading image:", error);
      setMessage({ type: "error", text: "Chyba při načítání obrázku" });
    } finally {
      setUploading(false);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const nextSpotNumber = spots.length > 0 
      ? Math.max(...spots.map(s => s.spot_number)) + 1 
      : 1;

    setSpots([...spots, {
      spot_number: nextSpotNumber,
      x_position: Math.round(x * 100) / 100,
      y_position: Math.round(y * 100) / 100,
      is_active: true,
    }]);
  };

  const handleSpotDrag = (e: React.MouseEvent, spotNumber: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      const x = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      const y = ((moveEvent.clientY - rect.top) / rect.height) * 100;

      setSpots(prev => prev.map(spot => 
        spot.spot_number === spotNumber
          ? { ...spot, x_position: Math.round(x * 100) / 100, y_position: Math.round(y * 100) / 100 }
          : spot
      ));
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      setDraggedSpot(null);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    setDraggedSpot(spotNumber);
  };

  const handleDeleteSpot = (spotNumber: number) => {
    setSpots(prev => prev.filter(s => s.spot_number !== spotNumber));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Uložit nebo aktualizovat pond_settings
      let settingsId = pondSettings?.id;
      
      if (pondSettings) {
        // Update existující
        const { error } = await supabase
          .from("pond_settings")
          .update({ image_url: imageUrl, updated_at: new Date().toISOString() })
          .eq("id", pondSettings.id);
        
        if (error) throw error;
      } else {
        // Insert nový
        const { data, error } = await supabase
          .from("pond_settings")
          .insert({ image_url: imageUrl })
          .select()
          .single();
        
        if (error) throw error;
        settingsId = data.id;
        setPondSettings(data);
      }

      // Smazat staré pozice a vložit nové
      if (settingsId) {
        await supabase
          .from("spot_positions")
          .delete()
          .eq("pond_settings_id", settingsId);

        const positions = spots.map(spot => ({
          pond_settings_id: settingsId,
          spot_number: spot.spot_number,
          x_position: spot.x_position,
          y_position: spot.y_position,
          is_active: spot.is_active,
        }));

        const { error } = await supabase
          .from("spot_positions")
          .insert(positions);

        if (error) throw error;
      }

      setMessage({ type: "success", text: "Nastavení bylo úspěšně uloženo" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: "Chyba při ukládání nastavení" });
    } finally {
      setSaving(false);
    }
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

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container max-w-6xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#2a3d32] mb-2 uppercase tracking-wide">
              Nastavení lovných míst
            </h1>
            <p className="text-gray-600">
              Nahrajte mapu rybníku a nastavte pozice lovných míst kliknutím do obrázku
            </p>
          </div>

          {message && (
            <Alert variant={message.type === "error" ? "destructive" : "default"} className="mb-6">
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Editor */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-300 overflow-hidden">
                <div className="bg-[#f5f5f5] border-b border-gray-300 px-6 py-4">
                  <h2 className="text-lg font-bold text-[#2a3d32] uppercase tracking-wide">Editor mapy</h2>
                </div>
                <div className="p-6">
                  {/* Upload obrázku */}
                  <div className="mb-6">
                    <Label htmlFor="image-upload" className="uppercase text-sm tracking-wide mb-2 block">
                      Nahrát mapu rybníku
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                      <Button disabled={uploading} variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading ? "Nahrávám..." : "Nahrát"}
                      </Button>
                    </div>
                  </div>

                  {/* Interaktivní mapa */}
                  {imageUrl && (
                    <div 
                      ref={containerRef}
                      className="relative w-full border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-crosshair"
                      style={{ paddingBottom: "75%" }}
                      onClick={handleImageClick}
                    >
                      <img
                        ref={imageRef}
                        src={imageUrl}
                        alt="Mapa rybníku"
                        className="absolute inset-0 w-full h-full object-cover"
                        draggable={false}
                      />
                      
                      {/* Puntíky lovných míst */}
                      {spots.map((spot) => (
                        <div
                          key={spot.spot_number}
                          className={`absolute cursor-move transform -translate-x-1/2 -translate-y-1/2 ${
                            draggedSpot === spot.spot_number ? "z-50" : "z-10"
                          }`}
                          style={{
                            left: `${spot.x_position}%`,
                            top: `${spot.y_position}%`,
                          }}
                          onMouseDown={(e) => handleSpotDrag(e, spot.spot_number)}
                        >
                          <div className="relative group">
                            <div className={`w-8 h-8 rounded-full border-3 border-white shadow-lg flex items-center justify-center text-xs font-bold text-white transition-all ${
                              draggedSpot === spot.spot_number 
                                ? "bg-blue-600 scale-125" 
                                : "bg-[#3d5a43] hover:scale-110"
                            }`}>
                              {spot.spot_number}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSpot(spot.spot_number);
                              }}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            >
                              <X className="h-3 w-3 text-white" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-sm text-gray-500 mt-4">
                    💡 Klikněte do mapy pro přidání nového místa, táhněte puntíky pro přesunutí
                  </p>
                </div>
              </div>
            </div>

            {/* Sidebar s ovládáním */}
            <div className="space-y-6">
              {/* Seznam míst */}
              <div className="bg-white border border-gray-300 overflow-hidden">
                <div className="bg-[#f5f5f5] border-b border-gray-300 px-6 py-4">
                  <h3 className="text-lg font-bold text-[#2a3d32] uppercase tracking-wide">
                    Lovná místa ({spots.length})
                  </h3>
                </div>
                <div className="p-4 max-h-96 overflow-y-auto">
                  {spots.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8">
                      Zatím nejsou přidána žádná místa.
                      Klikněte do mapy pro přidání.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {spots.sort((a, b) => a.spot_number - b.spot_number).map((spot) => (
                        <div
                          key={spot.spot_number}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
                        >
                          <div>
                            <span className="font-bold text-[#2a3d32]">Místo #{spot.spot_number}</span>
                            <div className="text-xs text-gray-500">
                              X: {spot.x_position.toFixed(1)}%, Y: {spot.y_position.toFixed(1)}%
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteSpot(spot.spot_number)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Akce */}
              <div className="space-y-3">
                <Button
                  onClick={handleSave}
                  disabled={saving || spots.length === 0}
                  className="w-full bg-[#3d5a43] hover:bg-[#4a6850] uppercase tracking-wider"
                  size="lg"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Ukládám..." : "Uložit nastavení"}
                </Button>
                
                <Button
                  onClick={() => router.push("/admin")}
                  variant="outline"
                  className="w-full uppercase tracking-wider"
                >
                  Zpět na admin
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}