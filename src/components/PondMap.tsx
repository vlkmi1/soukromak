import { useState, useEffect } from "react";
import { MapPin, Users, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface FishingSpot {
  id: number;
  name: string;
  x: number;
  y: number;
  availablePositions: number;
  totalPositions: number;
}

interface PondMapProps {
  onSpotSelect?: (spotId: number, spotName: string) => void;
  selectedSpotId?: number;
  numberOfAnglers?: number;
}

const FISHING_SPOTS: FishingSpot[] = [
  { id: 1, name: "Místo 1", x: 15, y: 20, availablePositions: 2, totalPositions: 2 },
  { id: 2, name: "Místo 2", x: 30, y: 25, availablePositions: 1, totalPositions: 2 },
  { id: 3, name: "Místo 3", x: 45, y: 22, availablePositions: 2, totalPositions: 2 },
  { id: 4, name: "Místo 4", x: 60, y: 28, availablePositions: 0, totalPositions: 2 },
  { id: 5, name: "Místo 5", x: 75, y: 25, availablePositions: 2, totalPositions: 2 },
  { id: 6, name: "Místo 6", x: 85, y: 35, availablePositions: 1, totalPositions: 2 },
  { id: 7, name: "Místo 7", x: 82, y: 50, availablePositions: 2, totalPositions: 2 },
  { id: 8, name: "Místo 8", x: 70, y: 60, availablePositions: 2, totalPositions: 2 },
  { id: 9, name: "Místo 9", x: 55, y: 65, availablePositions: 1, totalPositions: 2 },
  { id: 10, name: "Místo 10", x: 40, y: 62, availablePositions: 2, totalPositions: 2 },
  { id: 11, name: "Místo 11", x: 25, y: 58, availablePositions: 0, totalPositions: 2 },
  { id: 12, name: "Místo 12", x: 15, y: 45, availablePositions: 2, totalPositions: 2 },
  { id: 13, name: "Místo 13", x: 10, y: 35, availablePositions: 2, totalPositions: 2 },
];

const areAdjacent = (spot1: number, spot2: number): boolean => {
  const adjacencyMap: Record<number, number[]> = {
    1: [2, 13],
    2: [1, 3],
    3: [2, 4],
    4: [3, 5],
    5: [4, 6],
    6: [5, 7],
    7: [6, 8],
    8: [7, 9],
    9: [8, 10],
    10: [9, 11],
    11: [10, 12],
    12: [11, 13],
    13: [12, 1],
  };
  return adjacencyMap[spot1]?.includes(spot2) || false;
};

const findBestSpots = (numberOfAnglers: number, spots: FishingSpot[]): { recommended: number[]; alternatives: number[][] } => {
  if (numberOfAnglers === 1) {
    const fullSpot = spots.find(s => s.availablePositions === 2);
    if (fullSpot) {
      return { recommended: [fullSpot.id], alternatives: [] };
    }
    const partialSpot = spots.find(s => s.availablePositions === 1);
    if (partialSpot) {
      return { recommended: [partialSpot.id], alternatives: [] };
    }
  }

  if (numberOfAnglers === 2) {
    const fullSpot = spots.find(s => s.availablePositions === 2);
    if (fullSpot) {
      return { recommended: [fullSpot.id], alternatives: [] };
    }
    const partialSpots = spots.filter(s => s.availablePositions === 1);
    if (partialSpots.length >= 2) {
      return { 
        recommended: [partialSpots[0].id, partialSpots[1].id],
        alternatives: []
      };
    }
  }

  if (numberOfAnglers === 3) {
    for (const spot of spots) {
      if (spot.availablePositions === 2) {
        const adjacent = spots.find(s => 
          areAdjacent(spot.id, s.id) && s.availablePositions >= 1
        );
        if (adjacent) {
          return { 
            recommended: [spot.id, adjacent.id],
            alternatives: []
          };
        }
      }
    }

    const fullSpots = spots.filter(s => s.availablePositions === 2);
    if (fullSpots.length >= 2) {
      const closest = fullSpots.slice(0, 2);
      return { 
        recommended: [closest[0].id, closest[1].id],
        alternatives: []
      };
    }
  }

  return { recommended: [], alternatives: [] };
};

export function PondMap({ onSpotSelect, selectedSpotId, numberOfAnglers = 1 }: PondMapProps) {
  const [hoveredSpot, setHoveredSpot] = useState<number | null>(null);
  const [recommendedSpots, setRecommendedSpots] = useState<number[]>([]);

  useEffect(() => {
    if (numberOfAnglers > 1) {
      const { recommended } = findBestSpots(numberOfAnglers, FISHING_SPOTS);
      setRecommendedSpots(recommended);
    } else {
      setRecommendedSpots([]);
    }
  }, [numberOfAnglers]);

  const getSpotColor = (spot: FishingSpot): string => {
    if (selectedSpotId === spot.id) return "fill-primary stroke-primary";
    if (recommendedSpots.includes(spot.id)) return "fill-accent/80 hover:fill-accent";
    if (spot.availablePositions === 0) return "fill-destructive/80 hover:fill-destructive";
    if (spot.availablePositions === 1) return "fill-accent/60 hover:fill-accent/80";
    return "fill-primary/60 hover:fill-primary/80";
  };

  const getSpotStatus = (spot: FishingSpot): string => {
    if (spot.availablePositions === 0) return "Obsazeno";
    if (spot.availablePositions === 1) return "1 místo volné";
    return "Volné";
  };

  const handleSpotClick = (spot: FishingSpot) => {
    if (spot.availablePositions > 0 && onSpotSelect) {
      onSpotSelect(spot.id, spot.name);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Mapa rybníku Ostrata
        </CardTitle>
        <CardDescription>
          Klikněte na lovné místo pro rezervaci
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {numberOfAnglers > 1 && recommendedSpots.length > 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Doporučená místa</AlertTitle>
            <AlertDescription>
              Pro {numberOfAnglers} rybáře doporučujeme místa:{" "}
              {recommendedSpots.map(id => FISHING_SPOTS.find(s => s.id === id)?.name).join(", ")}
            </AlertDescription>
          </Alert>
        )}

        <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-accent/10 to-primary/10 rounded-lg overflow-hidden">
          <div 
            className="absolute inset-0 opacity-20 bg-cover bg-center"
            style={{ backgroundImage: "url('/generated/pond-aerial.png')" }}
          />
          
          <svg
            viewBox="0 0 100 80"
            className="w-full h-full"
            style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}
          >
            <ellipse
              cx="50"
              cy="40"
              rx="45"
              ry="35"
              className="fill-accent/20 stroke-accent/40"
              strokeWidth="0.5"
            />

            {FISHING_SPOTS.map((spot) => (
              <g key={spot.id}>
                <circle
                  cx={spot.x}
                  cy={spot.y}
                  r={hoveredSpot === spot.id || selectedSpotId === spot.id ? 3.5 : 3}
                  className={`${getSpotColor(spot)} stroke-white cursor-pointer transition-all duration-200`}
                  strokeWidth={selectedSpotId === spot.id ? "1" : "0.5"}
                  onMouseEnter={() => setHoveredSpot(spot.id)}
                  onMouseLeave={() => setHoveredSpot(null)}
                  onClick={() => handleSpotClick(spot)}
                />
                
                <text
                  x={spot.x}
                  y={spot.y - 5}
                  textAnchor="middle"
                  className="fill-foreground text-[3px] font-bold pointer-events-none"
                  style={{ userSelect: "none" }}
                >
                  {spot.id}
                </text>

                {hoveredSpot === spot.id && (
                  <g>
                    <rect
                      x={spot.x - 12}
                      y={spot.y + 4}
                      width="24"
                      height="8"
                      rx="1"
                      className="fill-white/95 stroke-border"
                      strokeWidth="0.3"
                    />
                    <text
                      x={spot.x}
                      y={spot.y + 9}
                      textAnchor="middle"
                      className="fill-foreground text-[2.5px] font-medium pointer-events-none"
                    >
                      {spot.name} - {getSpotStatus(spot)}
                    </text>
                  </g>
                )}
              </g>
            ))}
          </svg>
        </div>

        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-primary/60" />
            <span className="text-sm">Volné (2 pozice)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-accent/60" />
            <span className="text-sm">Částečně obsazeno (1 pozice)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-destructive/80" />
            <span className="text-sm">Obsazeno</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}