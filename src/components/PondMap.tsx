import { useState, useEffect } from "react";
import { MapPin, Users, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SpotAvailability {
  spotNumber: number;
  available: number;
  total: number;
  x: number;
  y: number;
}

interface PondMapProps {
  selectedDate: Date | undefined;
  fishermanCount: number;
  onSpotSelect: (spotNumber: number) => void;
}

export function PondMap({ selectedDate, fishermanCount, onSpotSelect }: PondMapProps) {
  const [spotsData, setSpotsData] = useState<SpotAvailability[]>([]);
  const [hoveredSpot, setHoveredSpot] = useState<number | null>(null);

  // Přesné pozice podle skutečné mapy rybníku (percentage based on image)
  const spotPositions = [
    { number: 1, x: 12, y: 35 },   // 1
    { number: 2, x: 26, y: 17 },   // 2
    { number: 3, x: 41, y: 12 },   // 3
    { number: 4, x: 56, y: 14 },   // 4
    { number: 5, x: 69, y: 21 },   // 5
    { number: 6, x: 77, y: 36 },   // 6
    { number: 7, x: 79, y: 55 },   // 7
    { number: 8, x: 72, y: 74 },   // 8
    { number: 9, x: 57, y: 86 },   // 9
    { number: 10, x: 42, y: 90 },  // 10
    { number: 11, x: 28, y: 87 },  // 11
    { number: 12, x: 15, y: 77 },  // 12
    { number: 13, x: 9, y: 55 },   // 13
  ];

  useEffect(() => {
    // Mock data - v produkci by se načítala ze Supabase
    const mockData: SpotAvailability[] = spotPositions.map((pos, idx) => ({
      spotNumber: pos.number,
      available: idx === 3 ? 0 : idx % 3 === 0 ? 1 : 2,
      total: 2,
      x: pos.x,
      y: pos.y,
    }));
    setSpotsData(mockData);
  }, [selectedDate]);

  const getSpotColor = (available: number, total: number) => {
    if (available === 0) return "bg-red-500 border-red-600";
    if (available < total) return "bg-amber-500 border-amber-600";
    return "bg-primary border-primary";
  };

  const getSpotStatus = (available: number, total: number) => {
    if (available === 0) return "Obsazeno";
    if (available < total) return `${available} místo volné`;
    return "Volné";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Mapa rybníku Ostrata
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Klikněte na lovné místo pro rezervaci
        </p>
      </CardHeader>
      <CardContent>
        <div className="relative w-full rounded-lg overflow-hidden border">
          {/* Pozadí s fotografií rybníku */}
          <img 
            src="/pond-map.jpg" 
            alt="Mapa rybníku Ostrata" 
            className="w-full h-auto block"
          />
          
          {/* Overlay s lovnými místy */}
          <div className="absolute inset-0">
            {spotsData.map((spot) => {
              const isHovered = hoveredSpot === spot.spotNumber;
              const canSelect = spot.available > 0;
              
              return (
                <button
                  key={spot.spotNumber}
                  onClick={() => canSelect && onSpotSelect(spot.spotNumber)}
                  onMouseEnter={() => setHoveredSpot(spot.spotNumber)}
                  onMouseLeave={() => setHoveredSpot(null)}
                  disabled={!canSelect}
                  className="absolute group"
                  style={{
                    left: `${spot.x}%`,
                    top: `${spot.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {/* Kruh s číslem místa */}
                  <div
                    className={`
                      w-12 h-12 rounded-full border-4 flex items-center justify-center
                      font-bold text-white text-lg shadow-lg
                      transition-all duration-200
                      ${getSpotColor(spot.available, spot.total)}
                      ${canSelect ? 'cursor-pointer hover:scale-125' : 'cursor-not-allowed opacity-75'}
                      ${isHovered ? 'scale-125 ring-4 ring-white/50' : 'scale-100'}
                    `}
                  >
                    {spot.spotNumber}
                  </div>

                  {/* Tooltip při hoveru */}
                  {isHovered && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-10">
                      <div className="bg-white border-2 border-primary rounded-lg shadow-xl p-3 min-w-[140px]">
                        <div className="text-sm font-semibold text-foreground mb-1">
                          Místo {spot.spotNumber}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getSpotStatus(spot.available, spot.total)}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {spot.available}/{spot.total} pozic
                        </div>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legenda */}
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-primary border-2 border-primary"></div>
            <span className="text-sm">Volné</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-amber-600"></div>
            <span className="text-sm">Částečně</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-red-600"></div>
            <span className="text-sm">Obsazeno</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}