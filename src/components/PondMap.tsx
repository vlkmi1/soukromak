import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import type { SpotAvailability } from "@/services/reservationService";
import { supabase } from "@/lib/supabase";

interface PondMapProps {
  selectedSpots: number[];
  onSpotSelect: (spotNumber: number) => void;
  availability: SpotAvailability[];
}

interface SpotPosition {
  number: number;
  x: number;
  y: number;
}

export function PondMap({ selectedSpots, onSpotSelect, availability }: PondMapProps) {
  const [spotPositions, setSpotPositions] = useState<SpotPosition[]>([]);
  const [imageUrl, setImageUrl] = useState<string>("/Mapa-Rybnik-Ostrata-scaled.jpg");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPondSettings();
  }, []);

  const loadPondSettings = async () => {
    try {
      // Načíst nastavení rybníku
      const { data: settings, error: settingsError } = await supabase
        .from("pond_settings")
        .select("*")
        .order("id", { ascending: false })
        .limit(1)
        .single();

      if (settingsError) {
        console.warn("Using default pond settings:", settingsError);
        useDefaultPositions();
        return;
      }

      if (settings) {
        setImageUrl(settings.image_url);

        // Načíst pozice míst
        const { data: positions, error: positionsError } = await supabase
          .from("spot_positions")
          .select("*")
          .eq("pond_settings_id", settings.id)
          .eq("is_active", true)
          .order("spot_number");

        if (positionsError) {
          console.warn("Using default spot positions:", positionsError);
          useDefaultPositions();
          return;
        }

        if (positions && positions.length > 0) {
          setSpotPositions(
            positions.map((p) => ({
              number: p.spot_number,
              x: parseFloat(p.x_position.toString()),
              y: parseFloat(p.y_position.toString()),
            }))
          );
        } else {
          useDefaultPositions();
        }
      }
    } catch (error) {
      console.error("Error loading pond settings:", error);
      useDefaultPositions();
    } finally {
      setIsLoading(false);
    }
  };

  const useDefaultPositions = () => {
    // Defaultní pozice jako záložní řešení
    setSpotPositions([
      { number: 1, x: 82, y: 42 },
      { number: 2, x: 79, y: 48 },
      { number: 3, x: 75, y: 54 },
      { number: 4, x: 71, y: 60 },
      { number: 5, x: 67, y: 65 },
      { number: 6, x: 62, y: 69 },
      { number: 7, x: 57, y: 71 },
      { number: 8, x: 52, y: 72 },
      { number: 9, x: 47, y: 71 },
      { number: 10, x: 42, y: 69 },
      { number: 11, x: 37, y: 65 },
      { number: 12, x: 33, y: 60 },
      { number: 13, x: 29, y: 54 },
      { number: 14, x: 25, y: 47 },
    ]);
  };

  const isSpotSelected = (spotNumber: number) => selectedSpots.includes(spotNumber);

  const getSpotData = (spotNumber: number) => {
    return availability.find(a => a.spotNumber === spotNumber) || {
      spotNumber,
      available: 2,
      total: 2,
      x: 0,
      y: 0,
    };
  };

  const getSpotColor = (spotNumber: number) => {
    if (isSpotSelected(spotNumber)) {
      return "hsl(var(--primary))";
    }
    
    const data = getSpotData(spotNumber);
    if (data.available === 0) return "#ef4444"; // red-500
    if (data.available < data.total) return "#f59e0b"; // amber-500
    return "hsl(var(--accent))";
  };

  if (isLoading) {
    return (
      <div className="relative w-full rounded-lg overflow-hidden border bg-gray-100 flex items-center justify-center" style={{ minHeight: "400px" }}>
        <div className="text-gray-500">Načítám mapu...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-lg overflow-hidden border">
      {/* Pozadí s fotografií rybníku */}
      <img 
        src={imageUrl}
        alt="Mapa rybníku Ostrata" 
        className="w-full h-auto block"
      />
      
      {/* Overlay s lovnými místy */}
      <svg 
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {spotPositions.map((spot) => (
          <g key={spot.number}>
            <circle
              cx={spot.x}
              cy={spot.y}
              r="1.8"
              fill={getSpotColor(spot.number)}
              stroke="white"
              strokeWidth="0.25"
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onSpotSelect(spot.number)}
            />
            <text
              x={spot.x}
              y={spot.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize="1.6"
              fontWeight="bold"
              className="pointer-events-none"
            >
              {spot.number}
            </text>
          </g>
        ))}
      </svg>
      
      {/* Legenda */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-accent border-2 border-white"></div>
            <span>Volné</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber-500 border-2 border-white"></div>
            <span>Částečně</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white"></div>
            <span>Obsazeno</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(var(--primary))" }}></div>
            <span>Vybráno</span>
          </div>
        </div>
      </div>
    </div>
  );
}