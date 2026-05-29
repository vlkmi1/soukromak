import { useState, useEffect } from "react";
import { MapPin, Users, Info, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSpotAvailability, type SpotAvailability } from "@/services/reservationService";
import { DateRange } from "react-day-picker";

interface PondMapProps {
  dateRange: DateRange;
  fishermanCount: number;
  onSpotSelect: (spotNumber: number) => void;
  suggestedSpots?: number[];
}

export function PondMap({ dateRange, fishermanCount, onSpotSelect, suggestedSpots = [] }: PondMapProps) {
  const [spotsData, setSpotsData] = useState<SpotAvailability[]>([]);
  const [hoveredSpot, setHoveredSpot] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Přesné pozice podle skutečné mapy - lovná místa podél jednoho břehu (zleva doprava)
  const spotPositions = [
    { number: 1, x: 11, y: 35 },   // Levý horní roh
    { number: 2, x: 23, y: 30 },   
    { number: 3, x: 25, y: 35 },   
    { number: 4, x: 28, y: 42 },   
    { number: 5, x: 32, y: 50 },   
    { number: 6, x: 38, y: 60 },   
    { number: 7, x: 45, y: 67 },   
    { number: 8, x: 52, y: 72 },   // Spodní střed
    { number: 9, x: 60, y: 73 },   
    { number: 10, x: 68, y: 68 },  
    { number: 11, x: 74, y: 60 },  
    { number: 12, x: 78, y: 48 },  
    { number: 13, x: 79, y: 38 },  // Pravý horní
  ];

  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      setIsLoading(true);
      getSpotAvailability(dateRange.from, dateRange.to)
        .then((availability) => {
          setSpotsData(availability);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // Fallback - zobrazit všechna místa jako volná
      const mockData: SpotAvailability[] = spotPositions.map((pos) => ({
        spotNumber: pos.number,
        available: 2,
        total: 2,
        x: pos.x,
        y: pos.y,
      }));
      setSpotsData(mockData);
    }
  }, [dateRange]);

  const getSpotColor = (available: number, total: number, spotNumber: number) => {
    const isSuggested = suggestedSpots.includes(spotNumber);
    
    if (isSuggested) {
      return "bg-accent border-accent ring-4 ring-accent/30";
    }
    
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
          {dateRange.from && dateRange.to
            ? "Klikněte na volné místo pro rezervaci"
            : "Vyberte období pro zobrazení dostupnosti"}
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
          
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          
          {/* Overlay s lovnými místy */}
          <div className="absolute inset-0">
            {spotsData.map((spot) => {
              const isHovered = hoveredSpot === spot.spotNumber;
              const canSelect = spot.available > 0;
              const isSuggested = suggestedSpots.includes(spot.spotNumber);
              
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
                      ${getSpotColor(spot.available, spot.total, spot.spotNumber)}
                      ${canSelect ? 'cursor-pointer hover:scale-125' : 'cursor-not-allowed opacity-75'}
                      ${isHovered ? 'scale-125 ring-4 ring-white/50' : 'scale-100'}
                      ${isSuggested ? 'animate-pulse' : ''}
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
                          {isSuggested && (
                            <span className="ml-2 text-xs text-accent">★ Doporučeno</span>
                          )}
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
        <div className="mt-4 flex items-center justify-center gap-6 text-sm flex-wrap">
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
          {suggestedSpots.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-accent border-2 border-accent animate-pulse"></div>
              <span className="text-sm">Doporučeno</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}