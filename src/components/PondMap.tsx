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