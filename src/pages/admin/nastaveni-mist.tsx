import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { Upload, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SpotPosition {
  id?: number;
  number: number;
  x_position: number;
  y_position: number;
}

interface SpotAvailability {
  spotNumber: number;
  occupied: number;
  total: number;
}

export default function MapSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPinPrompt, setShowPinPrompt] = useState(true);
  const [pin, setPin] = useState("");
  
  const [spots, setSpots] = useState<SpotPosition[]>([]);
  const [spotAvailability, setSpotAvailability] = useState<SpotAvailability[]>([]);
  const [mapImageId, setMapImageId] = useState<number | null>(null);
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
      // Načíst URL obrázku
      const { data: mapData, error: mapError } = await supabase
        .from("map_image")
        .select("*")
        .order("id", { ascending: false })
        .limit(1)
        .single();

      if (!mapError && mapData) {
        setMapImageId(mapData.id);
        setImageUrl(mapData.image_url);
      }

      // Načíst pozice míst z fishing_spots
      const { data: spotsData, error: spotsError } = await supabase
        .from("fishing_spots")
        .select("*")
        .order("number");

      if (spotsError) throw spotsError;

      setSpots(spotsData || []);

      // Načíst aktuální rezervace pro zobrazení obsazenosti
      await loadSpotAvailability();
    } catch (error) {
      console.error("Error loading settings:", error);
      setMessage({ type: "error", text: "Chyba při načítání nastavení" });
    }
  };

  const loadSpotAvailability = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];

      // Načíst všechny aktivní rezervace pro dnešek a budoucnost
      const { data: reservations, error } = await supabase
        .from("reservations")
        .select("spot_id, position_id, start_date, end_date, status")
        .gte("end_date", today)
        .in("status", ["new", "confirmed", "paid"]);

      if (error) throw error;

      // Načíst všechna fishing_spots s jejich ID
      const { data: fishingSpots } = await supabase
        .from("fishing_spots")
        .select("id, number");

      if (!fishingSpots) return;

      // Spočítat obsazenost pro každé místo
      const availability: SpotAvailability[] = fishingSpots.map((spot) => {
        // Spočítat unikátní pozice obsazené na tomto místě
        const occupiedPositions = new Set<number>();
        
        reservations?.forEach((res) => {
          if (res.spot_id === spot.id) {
            const resStart = new Date(res.start_date);
            const resEnd = new Date(res.end_date);
            const now = new Date(today);
            
            // Zkontrolovat překryv s dneškem nebo budoucností
            if (resEnd >= now) {
              occupiedPositions.add(res.position_id);
            }
          }
        });

        return {
          spotNumber: spot.number,
          occupied: occupiedPositions.size,
          total: 2,
        };
      });

      setSpotAvailability(availability);
    } catch (error) {
      console.error("Error loading spot availability:", error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setImageUrl(dataUrl);
        setMessage({ type: "success", text: "Obrázek byl načten. Nezapomeňte uložit nastavení!" });
      };
      reader.readAsDataURL(file);
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

    const nextNumber = spots.length > 0 
      ? Math.max(...spots.map(s => s.number)) + 1 
      : 1;

    setSpots([...spots, {
      number: nextNumber,
      x_position: Math.round(x * 100) / 100,
      y_position: Math.round(y * 100) / 100,
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
        spot.number === spotNumber
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

  const handleDeleteSpot = async (spotId: number) => {
    if (!confirm("Opravdu chcete smazat toto místo?")) return;

    try {
      // Nejdřív smazat pozice
      const { error: positionsError } = await supabase
        .from("spot_positions")
        .delete()
        .eq("spot_id", spotId);

      if (positionsError) {
        console.error("Error deleting positions:", positionsError);
      }

      // Pak smazat místo
      const { error: spotError } = await supabase
        .from("fishing_spots")
        .delete()
        .eq("id", spotId);

      if (spotError) throw spotError;

      toast({
        title: "Místo smazáno",
        description: "Lovné místo bylo úspěšně odstraněno.",
      });

      loadSettings();
    } catch (error: any) {
      console.error("Error deleting spot:", error);
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se smazat místo.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Uložit URL obrázku
      if (mapImageId) {
        await supabase
          .from("map_image")
          .update({ image_url: imageUrl, updated_at: new Date().toISOString() })
          .eq("id", mapImageId);
      } else {
        const { data, error } = await supabase
          .from("map_image")
          .insert({ image_url: imageUrl })
          .select()
          .single();
        
        if (!error && data) {
          setMapImageId(data.id);
        }
      }

      // Smazat všechna stará místa
      await supabase.from("fishing_spots").delete().neq("id", 0);

      // Vložit nová místa
      const spotsToInsert = spots.map(spot => ({
        number: spot.number,
        x_position: spot.x_position,
        y_position: spot.y_position,
      }));

      const { error: insertError } = await supabase
        .from("fishing_spots")
        .insert(spotsToInsert);

      if (insertError) throw insertError;

      // Pro každé místo vytvořit 2 pozice (pro 2 rybáře)
      await supabase.from("spot_positions").delete().neq("id", 0);
      
      const positionsToInsert: any[] = [];
      for (const spot of spots) {
        const { data: spotData } = await supabase
          .from("fishing_spots")
          .select("id")
          .eq("number", spot.number)
          .single();
        
        if (spotData) {
          positionsToInsert.push(
            { spot_id: spotData.id, position_number: 1 },
            { spot_id: spotData.id, position_number: 2 }
          );
        }
      }

      if (positionsToInsert.length > 0) {
        await supabase.from("spot_positions").insert(positionsToInsert);
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

  const getSpotColor = (spotNumber: number): string => {
    const availability = spotAvailability.find(a => a.spotNumber === spotNumber);
    if (!availability) return "#3d5a43"; // default green

    if (availability.occupied === 0) return "#22c55e"; // green - plně volné
    if (availability.occupied === 1) return "#eab308"; // yellow - částečně obsazené
    return "#ef4444"; // red - plně obsazené
  };

  const getSpotAvailabilityText = (spotNumber: number): string => {
    const availability = spotAvailability.find(a => a.spotNumber === spotNumber);
    if (!availability) return "?";
    
    const free = availability.total - availability.occupied;
    return `${free}/${availability.total}`;
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

                  {imageUrl && (
                    <>
                      <div 
                        ref={containerRef}
                        className="relative w-full border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-crosshair"
                        onClick={handleImageClick}
                      >
                        <img
                          ref={imageRef}
                          src={imageUrl}
                          alt="Mapa rybníku"
                          className="w-full h-auto block"
                          draggable={false}
                        />
                        
                        {/* SVG overlay s puntíky - barevně podle obsazenosti */}
                        <svg 
                          className="absolute inset-0 w-full h-full pointer-events-none"
                          viewBox="0 0 100 100"
                          preserveAspectRatio="none"
                        >
                          {spots.map((spot) => (
                            <g key={spot.number} className="pointer-events-auto">
                              {/* Puntík s barvou podle obsazenosti */}
                              <circle
                                cx={spot.x_position}
                                cy={spot.y_position}
                                r="2.5"
                                fill={draggedSpot === spot.number ? "#2563eb" : getSpotColor(spot.number)}
                                stroke="white"
                                strokeWidth="0.3"
                                className="cursor-move transition-colors"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  handleSpotDrag(e as any, spot.number);
                                }}
                              />
                              {/* Číslo místa */}
                              <text
                                x={spot.x_position}
                                y={spot.y_position - 0.3}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="white"
                                fontSize="1.8"
                                fontWeight="bold"
                                className="pointer-events-none"
                              >
                                {spot.number}
                              </text>
                              {/* Dostupnost pod číslem */}
                              <text
                                x={spot.x_position}
                                y={spot.y_position + 1.2}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="white"
                                fontSize="1.2"
                                fontWeight="bold"
                                className="pointer-events-none"
                              >
                                {getSpotAvailabilityText(spot.number)}
                              </text>
                              {/* Tlačítko X pro smazání */}
                              <g 
                                className="pointer-events-auto cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (spot.id) handleDeleteSpot(spot.id);
                                }}
                              >
                                <circle
                                  cx={spot.x_position + 3.5}
                                  cy={spot.y_position - 3.5}
                                  r="1.5"
                                  fill="#ef4444"
                                />
                                <text
                                  x={spot.x_position + 3.5}
                                  y={spot.y_position - 3.5}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  fill="white"
                                  fontSize="1.5"
                                  fontWeight="bold"
                                >
                                  ×
                                </text>
                              </g>
                            </g>
                          ))}
                        </svg>
                      </div>

                      {/* Legenda barev */}
                      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded">
                        <h4 className="font-bold text-sm text-[#2a3d32] mb-3 uppercase tracking-wide">
                          Legenda obsazenosti
                        </h4>
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-[#22c55e] border border-white"></div>
                            <span className="text-gray-700">Plně volné (0/2)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-[#eab308] border border-white"></div>
                            <span className="text-gray-700">Částečně (1/2)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-[#ef4444] border border-white"></div>
                            <span className="text-gray-700">Obsazené (2/2)</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                          Číslo pod značkou ukazuje volné/celkem pozice (např. 1/2 = 1 volná pozice ze 2)
                        </p>
                      </div>
                    </>
                  )}

                  <p className="text-sm text-gray-500 mt-4">
                    💡 Klikněte do mapy pro přidání nového místa, táhněte puntíky pro přesunutí
                  </p>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
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
                      {spots.sort((a, b) => a.number - b.number).map((spot) => {
                        const availability = spotAvailability.find(a => a.spotNumber === spot.number);
                        const free = availability ? availability.total - availability.occupied : 2;
                        const colorClass = 
                          !availability || availability.occupied === 0 ? "bg-green-50 border-green-200" :
                          availability.occupied === 1 ? "bg-yellow-50 border-yellow-200" :
                          "bg-red-50 border-red-200";
                        
                        return (
                          <div
                            key={spot.number}
                            className={`flex items-center justify-between p-3 rounded border ${colorClass}`}
                          >
                            <div>
                              <span className="font-bold text-[#2a3d32]">Místo #{spot.number}</span>
                              <div className="text-xs text-gray-600 mt-1">
                                Pozice: X: {spot.x_position.toFixed(1)}%, Y: {spot.y_position.toFixed(1)}%
                              </div>
                              {availability && (
                                <div className="text-xs font-semibold mt-1">
                                  {free === 2 ? "🟢" : free === 1 ? "🟡" : "🔴"} 
                                  {" "}{free === 0 ? "Plně obsazeno" : `${free} ${free === 1 ? "volná pozice" : "volné pozice"}`}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => spot.id && handleDeleteSpot(spot.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

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