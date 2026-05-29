import { useState, useEffect } from "react";
import { MapPin, Users, Info, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSpotAvailability, type SpotAvailability } from "@/services/reservationService";
import { DateRange } from "react-day-picker";

interface PondMapProps {
  selectedSpots: number[];
  onSpotSelect: (spotNumber: number) => void;
  availability: SpotAvailability[];
}

export function PondMap({ selectedSpots, onSpotSelect, availability }: PondMapProps) {
  const isSpotSelected = (spotNumber: number) => selectedSpots.includes(spotNumber);

  const [spotsData, setSpotsData] = useState<SpotAvailability[]>([]);
  const [hoveredSpot, setHoveredSpot] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Přesné pozice podle mapy - 14 míst číslovaných zprava doleva
  const spotPositions = [
    { number: 1, x: 89, y: 40 },   // 1 - vpravo nahoře
    { number: 2, x: 86, y: 47 },   // 2
    { number: 3, x: 82, y: 54 },   // 3
    { number: 4, x: 76, y: 60 },   // 4
    { number: 5, x: 69, y: 66 },   // 5
    { number: 6, x: 62, y: 70 },   // 6
    { number: 7, x: 54, y: 73 },   // 7
    { number: 8, x: 46, y: 74 },   // 8 - dole uprostřed
    { number: 9, x: 38, y: 72 },   // 9
    { number: 10, x: 31, y: 68 },  // 10
    { number: 11, x: 25, y: 62 },  // 11
    { number: 12, x: 20, y: 54 },  // 12
    { number: 13, x: 16, y: 45 },  // 13
    { number: 14, x: 13, y: 35 },  // 14 - vlevo nahoře
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
          {/* Pozadí s čistou fotografií rybníku */}
          <img 
            src="/Mapa-Rybnik-Ostrata-scaled.jpg" 
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
            <circle
                key={spot.number}
                cx={spot.x}
                cy={spot.y}
                r="20"
                fill={isSpotSelected(spot.number) ? "hsl(var(--primary))" : "hsl(var(--accent))"}
                stroke="white"
                strokeWidth="2"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => onSpotSelect(spot.number)}
              />
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