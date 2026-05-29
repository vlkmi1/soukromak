import { MapPin } from "lucide-react";
import type { SpotAvailability } from "@/services/reservationService";

interface PondMapProps {
  selectedSpots: number[];
  onSpotSelect: (spotNumber: number) => void;
  availability: SpotAvailability[];
}

export function PondMap({ selectedSpots, onSpotSelect, availability }: PondMapProps) {
  const isSpotSelected = (spotNumber: number) => selectedSpots.includes(spotNumber);

  // Přesné pozice podle mapy - 14 míst číslovaných zprava doleva
  // Upraveno: místa blíž ke břehu, na vodě
  const spotPositions = [
    { number: 1, x: 82, y: 42 },   // 1 - vpravo nahoře (blíž k vodě)
    { number: 2, x: 79, y: 48 },   // 2 (blíž k vodě)
    { number: 3, x: 75, y: 54 },   // 3
    { number: 4, x: 70, y: 59 },   // 4
    { number: 5, x: 64, y: 64 },   // 5
    { number: 6, x: 57, y: 68 },   // 6
    { number: 7, x: 52, y: 66 },   // 7 - nahoru a doprava
    { number: 8, x: 46, y: 67 },   // 8 - nahoru a doprava
    { number: 9, x: 40, y: 66 },   // 9 - nahoru a doprava
    { number: 10, x: 34, y: 63 },  // 10 - nahoru a doprava
    { number: 11, x: 29, y: 58 },  // 11 - nahoru a doprava
    { number: 12, x: 25, y: 52 },  // 12 - nahoru a doprava
    { number: 13, x: 22, y: 45 },  // 13 - nahoru a doprava
    { number: 14, x: 16, y: 40 },  // 14 - vlevo nahoře
  ];

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

  return (
    <div className="relative w-full rounded-lg overflow-hidden border">
      {/* Pozadí s čistou fotografií rybníku */}
      <img 
        src="/Mapa-Rybnik-Ostrata-scaled.jpg" 
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
      
      {/* Legenda - blíž ke břehu (nahoru) */}
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