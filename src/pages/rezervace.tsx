import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { PondMap } from "@/components/PondMap";
import { ReservationForm } from "@/components/ReservationForm";
import { 
  getSpotAvailability, 
  findBestSpotCombination,
  checkAdjacentAvailability,
  findAllPossibleCombinations,
  type ReservationSuggestion,
  type SpotCombination,
} from "@/services/reservationService";
import { supabase } from "@/lib/supabase";
import { Calendar as CalendarIcon, Users, Info, CheckCircle2, MapPin } from "lucide-react";
import { cs } from "date-fns/locale";
import { format, startOfDay, endOfDay, isSameDay } from "date-fns";

interface DayAvailability {
  date: Date;
  availableSpots: number;
  totalSpots: number;
}

export default function ReservationPage() {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [fishermanCount, setFishermanCount] = useState("1");
  const [selectedSpot, setSelectedSpot] = useState<number[]>([]);
  const [manuallySelected, setManuallySelected] = useState(false);
  const [suggestion, setSuggestion] = useState<ReservationSuggestion | null>(null);
  const [allCombinations, setAllCombinations] = useState<SpotCombination[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [dayAvailabilities, setDayAvailabilities] = useState<DayAvailability[]>([]);

  // Načíst dostupnost pro všechny nadcházející dny (30 dní dopředu)
  useEffect(() => {
    loadDayAvailabilities();
  }, []);

  const loadDayAvailabilities = async () => {
    const today = startOfDay(new Date());
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 60); // 60 dní dopředu

    try {
      const { data: reservations, error } = await supabase
        .from("reservations")
        .select("spot_id, position_id, start_date, end_date, status")
        .gte("end_date", today.toISOString())
        .lte("start_date", endDate.toISOString())
        .in("status", ["new", "confirmed", "paid"]);

      if (error) throw error;

      // Vypočítat dostupnost pro každý den
      const availabilities: DayAvailability[] = [];
      const totalSpotsPerDay = 14; // 14 lovných míst

      for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
        const currentDay = new Date(d);
        
        // Spočítat obsazená místa v tento den
        const occupiedPositions = new Set<string>();
        reservations?.forEach((res) => {
          const resStart = startOfDay(new Date(res.start_date));
          const resEnd = startOfDay(new Date(res.end_date));
          
          if (currentDay >= resStart && currentDay <= resEnd) {
            occupiedPositions.add(`${res.spot_id}-${res.position_id}`);
          }
        });

        const occupiedCount = occupiedPositions.size;
        const availableCount = (totalSpotsPerDay * 2) - occupiedCount; // 2 pozice na místo

        availabilities.push({
          date: new Date(currentDay),
          availableSpots: availableCount,
          totalSpots: totalSpotsPerDay * 2,
        });
      }

      setDayAvailabilities(availabilities);
    } catch (error) {
      console.error("Error loading day availabilities:", error);
    }
  };

  const getDayAvailability = (date: Date) => {
    return dayAvailabilities.find((av) => isSameDay(av.date, date));
  };

  const getAvailabilityModifiers = () => {
    const fullyAvailable: Date[] = [];
    const partiallyAvailable: Date[] = [];
    const fullyBooked: Date[] = [];

    dayAvailabilities.forEach((av) => {
      if (av.availableSpots === av.totalSpots) {
        fullyAvailable.push(av.date);
      } else if (av.availableSpots > 0) {
        partiallyAvailable.push(av.date);
      } else {
        fullyBooked.push(av.date);
      }
    });

    return { fullyAvailable, partiallyAvailable, fullyBooked };
  };

  const { fullyAvailable, partiallyAvailable, fullyBooked } = getAvailabilityModifiers();

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    const normalizedDate = startOfDay(date);
    const dateString = normalizedDate.toISOString();
    
    setSelectedDates((prev) => {
      const exists = prev.some(d => startOfDay(d).toISOString() === dateString);
      if (exists) {
        // Odebrat den
        return prev.filter(d => startOfDay(d).toISOString() !== dateString);
      } else {
        // Přidat den
        return [...prev, normalizedDate].sort((a, b) => a.getTime() - b.getTime());
      }
    });
    
    setManuallySelected(false);
    setShowForm(false);
  };

  const getDateRange = () => {
    if (selectedDates.length === 0) return null;
    
    const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
    return {
      from: startOfDay(sortedDates[0]),
      to: endOfDay(sortedDates[sortedDates.length - 1]),
    };
  };

  const handleSpotSelect = (spotNumber: number) => {
    setSelectedSpot([spotNumber]);
    setManuallySelected(true);
    setShowForm(false);
    
    // Zkontrolovat sousední místa pro manuální výběr
    const dateRange = getDateRange();
    if (dateRange) {
      checkManualSelection(spotNumber);
    }
  };

  const checkManualSelection = async (spotNumber: number) => {
    const dateRange = getDateRange();
    if (!dateRange) return;

    const availability = await getSpotAvailability(dateRange.from, dateRange.to);
    const adjacentCheck = checkAdjacentAvailability(spotNumber, parseInt(fishermanCount), availability);
    
    setSuggestion(adjacentCheck);
    setAllCombinations([]);
  };

  const handleAutomaticSearch = async () => {
    const dateRange = getDateRange();
    if (!dateRange) return;

    const availability = await getSpotAvailability(dateRange.from, dateRange.to);
    const bestCombination = findBestSpotCombination(parseInt(fishermanCount), availability);
    const allPossible = findAllPossibleCombinations(parseInt(fishermanCount), availability);
    
    setSuggestion(bestCombination);
    setAllCombinations(allPossible);
    setManuallySelected(false);
    
    if (bestCombination && bestCombination.spots.length > 0) {
      setSelectedSpot(bestCombination.spots);
    }
  };

  const handleCombinationSelect = (spots: number[]) => {
    setSelectedSpot(spots);
    setSuggestion({
      spots: spots,
      isOptimal: true,
      message: `Vybráno: Místa ${spots.join("+")}`,
      type: "adjacent",
    });
    setShowForm(true);
  };

  useEffect(() => {
    const dateRange = getDateRange();
    if (dateRange && !manuallySelected) {
      handleAutomaticSearch();
    }
  }, [selectedDates, fishermanCount]);

  const dateRange = getDateRange();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Rezervace lovných míst</h1>
            <p className="text-muted-foreground text-lg">Vyberte období a počet rybářů pro zobrazení dostupných míst</p>
          </div>

          {/* Mapa rybníku - zmenšená a nahoře */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Mapa rybníku Ostrata</CardTitle>
              <CardDescription>Klikněte na místo pro výběr konkrétního lovného místa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-3xl mx-auto">
                <PondMap
                  selectedSpots={selectedSpot}
                  onSpotSelect={handleSpotSelect}
                  availability={[]}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Kalendář s výběrem dnů */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  Vyberte dny
                </CardTitle>
                <CardDescription>Klikněte na jednotlivé dny pro zaškrtnutí</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDates[0]}
                  onSelect={handleDateSelect}
                  locale={cs}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border"
                  modifiers={{
                    selected: selectedDates,
                    fullyAvailable: fullyAvailable,
                    partiallyAvailable: partiallyAvailable,
                    fullyBooked: fullyBooked,
                  }}
                  modifiersStyles={{
                    selected: {
                      backgroundColor: "hsl(var(--primary))",
                      color: "white",
                      fontWeight: "bold",
                    },
                    fullyAvailable: {
                      backgroundColor: "hsl(142 76% 85%)",
                      color: "hsl(142 76% 20%)",
                    },
                    partiallyAvailable: {
                      backgroundColor: "hsl(38 92% 85%)",
                      color: "hsl(38 92% 25%)",
                    },
                    fullyBooked: {
                      backgroundColor: "hsl(0 84% 85%)",
                      color: "hsl(0 84% 30%)",
                      textDecoration: "line-through",
                    },
                  }}
                />
                
                {/* Legenda barev */}
                <div className="mt-4 p-3 bg-muted/50 rounded-lg space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground mb-2">Dostupnost:</div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(142 76% 85%)" }}></div>
                    <span>Dostatek volných míst</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(38 92% 85%)" }}></div>
                    <span>Částečně obsazeno</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(0 84% 85%)" }}></div>
                    <span>Plně obsazeno</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded bg-primary"></div>
                    <span>Vybrané dny</span>
                  </div>
                </div>
                
                {selectedDates.length > 0 && (
                  <div className="mt-4 p-3 bg-primary/10 border border-primary rounded-lg">
                    <div className="text-sm font-medium mb-2">Vybrané dny ({selectedDates.length}):</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedDates.map((date) => (
                        <Badge key={date.toISOString()} variant="secondary" className="bg-primary/20">
                          {format(date, "d. MMM", { locale: cs })}
                        </Badge>
                      ))}
                    </div>
                    {dateRange && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Období: {format(dateRange.from, "d. MMM", { locale: cs })} - {format(dateRange.to, "d. MMM yyyy", { locale: cs })}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6 space-y-2">
                  <Label htmlFor="fisherman-count">Počet rybářů</Label>
                  <Input
                    id="fisherman-count"
                    type="number"
                    min="1"
                    max="50"
                    value={fishermanCount}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFishermanCount(val);
                      setManuallySelected(false);
                    }}
                    placeholder="Zadejte počet rybářů"
                  />
                  {parseInt(fishermanCount) > 20 && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        Pro více než 20 rybářů doporučujeme kontaktovat nás přímo pro soukromou akci na rybníku.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Výsledky vyhledávání */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Dostupná místa
                </CardTitle>
                <CardDescription>
                  {selectedDates.length === 0
                    ? "Vyberte dny v kalendáři pro zobrazení dostupných míst"
                    : suggestion
                    ? suggestion.message
                    : "Hledám volná místa..."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedDates.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CalendarIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Začněte výběrem dnů v kalendáři vlevo</p>
                  </div>
                ) : suggestion && !manuallySelected && allCombinations.length > 0 ? (
                  <div className="space-y-4">
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        Nalezeno {allCombinations.length} {allCombinations.length === 1 ? "možnost" : allCombinations.length < 5 ? "možnosti" : "možností"} pro {fishermanCount} {parseInt(fishermanCount) === 1 ? "rybáře" : "rybáře"}
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label>Dostupné možnosti ({allCombinations.length})</Label>
                      <div className="grid gap-2">
                        {allCombinations.map((combo, index) => (
                          <button
                            key={index}
                            onClick={() => handleCombinationSelect(combo.spots)}
                            className="flex items-center justify-between p-4 border-2 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left"
                          >
                            <div>
                              <div className="font-semibold text-primary">
                                {combo.spots.length === 1 ? "Místo" : "Místa"} #{combo.spots.join(", #")}
                              </div>
                              <div className="text-sm text-muted-foreground">{combo.description}</div>
                            </div>
                            <Badge variant="secondary" className="bg-primary text-primary-foreground">
                              Vybrat
                            </Badge>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : suggestion && manuallySelected ? (
                  <div>
                    <Alert variant={suggestion.isOptimal ? "default" : "destructive"}>
                      <Info className="h-4 w-4" />
                      <AlertDescription>{suggestion.message}</AlertDescription>
                    </Alert>
                    {suggestion.isOptimal && (
                      <Button onClick={() => setShowForm(true)} className="mt-4 w-full" size="lg">
                        Pokračovat k rezervaci
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Načítám dostupnost...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Rezervační formulář */}
          <div className="max-w-2xl mx-auto">
            {showForm && selectedSpot.length > 0 && dateRange && (
              <ReservationForm
                selectedSpots={selectedSpot}
                selectedDates={selectedDates}
                dateRange={dateRange}
                fishermanCount={parseInt(fishermanCount)}
                onSuccess={() => {
                  setShowForm(false);
                  setSelectedSpot([]);
                  setSelectedDates([]);
                  setManuallySelected(false);
                  handleAutomaticSearch();
                }}
              />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}