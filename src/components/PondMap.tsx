import { useState } from "react";
import { MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FishingSpot {
  id: number;
  name: string;
  x: number;
  y: number;
  availablePositions: number;
  totalPositions: number;
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

export function PondMap() {
  const [selectedSpot, setSelectedSpot] = useState<FishingSpot | null>(null);
  const [hoveredSpot, setHoveredSpot] = useState<number | null>(null);

  const getSpotColor = (spot: FishingSpot): string => {
    if (spot.availablePositions === 0) return "fill-destructive/80 hover:fill-destructive";
    if (spot.availablePositions === 1) return "fill-accent/60 hover:fill-accent/80";
    return "fill-primary/60 hover:fill-primary/80";
  };

  const getSpotStatus = (spot: FishingSpot): string => {
    if (spot.availablePositions === 0) return "Obsazeno";
    if (spot.availablePositions === 1) return "1 místo volné";
    return "Volné";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Mapa rybníku Ostrata
            </CardTitle>
            <CardDescription>
              Klikněte na lovné místo pro zahájení rezervace
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                      r={hoveredSpot === spot.id ? 3.5 : 3}
                      className={`${getSpotColor(spot)} stroke-white cursor-pointer transition-all duration-200`}
                      strokeWidth="0.5"
                      onMouseEnter={() => setHoveredSpot(spot.id)}
                      onMouseLeave={() => setHoveredSpot(null)}
                      onClick={() => setSelectedSpot(spot)}
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
                          {spot.name}
                        </text>
                      </g>
                    )}
                  </g>
                ))}
              </svg>
            </div>

            <div className="flex items-center gap-6 mt-6 flex-wrap">
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
      </div>

      <div className="lg:col-span-1">
        {selectedSpot ? (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="text-primary">{selectedSpot.name}</CardTitle>
              <CardDescription>
                <Badge 
                  variant={selectedSpot.availablePositions === 0 ? "destructive" : "default"}
                  className={selectedSpot.availablePositions === 2 ? "bg-primary" : selectedSpot.availablePositions === 1 ? "bg-accent" : ""}
                >
                  {getSpotStatus(selectedSpot)}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>
                  {selectedSpot.availablePositions} z {selectedSpot.totalPositions} pozic volných
                </span>
              </div>

              {selectedSpot.availablePositions > 0 ? (
                <Button className="w-full" size="lg">
                  Rezervovat místo
                </Button>
              ) : (
                <Button className="w-full" variant="outline" size="lg" disabled>
                  Místo obsazeno
                </Button>
              )}

              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => setSelectedSpot(null)}
              >
                Zrušit výběr
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Vyberte lovné místo</CardTitle>
              <CardDescription>
                Klikněte na zelený nebo modrý bod na mapě pro zobrazení detailů a rezervaci
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm space-y-2">
                  <p className="font-medium">Dostupná místa:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {FISHING_SPOTS.filter(s => s.availablePositions > 0).map(spot => (
                      <Button
                        key={spot.id}
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSpot(spot)}
                        className="justify-start text-xs"
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        {spot.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}