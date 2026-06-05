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
  const [currentAvailability, setCurrentAvailability] = useState<any[]>([]);

  // Načíst dostupnost pro všechny nadcházející dny (30 dní dopředu)
  useEffect(() => {
    loadDayAvailabilities();
  }, []);

  // Načíst dostupnost pro vybrané datum (pro zobrazení na mapě)
  useEffect(() => {
    const dateRange = getDateRange();
    if (dateRange) {
      loadCurrentAvailability(dateRange.from, dateRange.to);
    }
  }, [selectedDates]);

  const loadCurrentAvailability = async (startDate: Date, endDate: Date) => {
    try {
      const availability = await getSpotAvailability(startDate, endDate);
      setCurrentAvailability(availability);
    } catch (error) {
      console.error("Error loading availability:", error);
      setCurrentAvailability([]);
    }
  };

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

  const handleDayClick = (day: Date) => {
    if (!day) return;

    const dayTime = startOfDay(day).getTime();
    const isSelected = selectedDates.some(
      (d) => startOfDay(d).getTime() === dayTime
    );

    if (isSelected) {
      // Pokud je den vybraný, vždy ho odebrat (i když je to nejdřívější/poslední)
      const newDates = selectedDates.filter(
        (d) => startOfDay(d).getTime() !== dayTime
      );
      setSelectedDates(newDates);
      setManuallySelected(true);
      return;
    }

    // Přidat nový den
    const newDates = [...selectedDates, day];
    setSelectedDates(newDates);
    setManuallySelected(true);
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
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 py-12">
        <div className="container max-w-6xl">
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-[#2a3d32] mb-4 uppercase tracking-wide">Rezervace lovných míst</h1>
            <p className="text-lg text-gray-600">Vyberte období a počet rybářů pro zobrazení dostupných míst</p>
          </div>

          {/* Mapa rybníku - jednoduchý box */}
          <div className="mb-12 bg-white border border-gray-300 overflow-hidden">
            <div className="bg-[#f5f5f5] border-b border-gray-300 px-6 py-4">
              <h2 className="text-xl font-bold text-[#2a3d32] uppercase tracking-wide">Mapa rybníku Ostrata</h2>
              <p className="text-sm text-gray-600 mt-1">Klikněte na místo pro výběr konkrétního lovného místa</p>
            </div>
            <div className="p-6">
              <div className="max-w-3xl mx-auto">
                <PondMap
                  selectedSpots={selectedSpot}
                  onSpotSelect={handleSpotSelect}
                  availability={currentAvailability}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Výběr období */}
            <div className="bg-white border border-gray-300 overflow-hidden">
              <div className="bg-[#f5f5f5] border-b border-gray-300 px-6 py-4">
                <h3 className="font-bold text-lg text-[#2a3d32] uppercase tracking-wide">1. Vyberte období</h3>
              </div>
              <div className="p-6">
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
                      backgroundColor: "#3d5a43",
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
                <div className="mt-4 p-3 bg-gray-50 space-y-2">
                  <div className="text-xs font-semibold text-gray-600 mb-2 uppercase">Dostupnost:</div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4" style={{ backgroundColor: "hsl(142 76% 85%)" }}></div>
                    <span>Dostatek volných míst</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4" style={{ backgroundColor: "hsl(38 92% 85%)" }}></div>
                    <span>Částečně obsazeno</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4" style={{ backgroundColor: "hsl(0 84% 85%)" }}></div>
                    <span>Plně obsazeno</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4" style={{ backgroundColor: "#3d5a43" }}></div>
                    <span>Vybrané dny</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Výběr počtu rybářů */}
            <div className="space-y-8">
              <div className="bg-white border border-gray-300 overflow-hidden">
                <div className="bg-[#f5f5f5] border-b border-gray-300 px-6 py-4">
                  <h3 className="font-bold text-lg text-[#2a3d32] uppercase tracking-wide">2. Počet rybářů</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fishermanCount" className="uppercase text-sm tracking-wide">Kolik vás bude?</Label>
                    <Input
                      id="fishermanCount"
                      type="number"
                      min="1"
                      max="6"
                      value={fishermanCount}
                      onChange={(e) => setFishermanCount(e.target.value)}
                      className="text-lg border-gray-300"
                    />
                  </div>
                  <Button
                    onClick={handleAutomaticSearch}
                    disabled={!dateRange || selectedDates.length === 0}
                    className="w-full bg-[#3d5a43] hover:bg-[#4a6850] text-white uppercase tracking-wider font-bold"
                    size="lg"
                  >
                    Najít dostupná místa
                  </Button>
                </div>
              </div>

              {/* Zobrazení výsledků */}
              {(suggestion || allCombinations.length > 0) && (
                <div className="bg-white border border-gray-300 overflow-hidden">
                  <div className="bg-[#f5f5f5] border-b border-gray-300 px-6 py-4">
                    <h3 className="font-bold text-lg text-[#2a3d32] uppercase tracking-wide">3. Dostupná místa</h3>
                  </div>
                  <div className="p-6">
                    {suggestion && (
                      <div className={`p-4 rounded mb-4 ${
                        suggestion.type === "none" 
                          ? "bg-red-50 border border-red-200" 
                          : suggestion.isOptimal 
                            ? "bg-green-50 border border-green-200" 
                            : "bg-amber-50 border border-amber-200"
                      }`}>
                        <p className={`text-sm font-medium ${
                          suggestion.type === "none" 
                            ? "text-red-800" 
                            : suggestion.isOptimal 
                              ? "text-green-800" 
                              : "text-amber-800"
                        }`}>
                          {suggestion.message}
                        </p>
                      </div>
                    )}

                    {allCombinations.length > 0 && (
                      <div className="space-y-2">
                        {allCombinations.map((combo, idx) => {
                          const isSelected = JSON.stringify(combo.spots.sort()) === JSON.stringify(selectedSpot.sort());
                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                setSelectedSpot(combo.spots);
                                setManuallySelected(true);
                                setShowForm(true);
                              }}
                              className={`w-full text-left p-4 border transition-all ${
                                isSelected 
                                  ? "bg-[#3d5a43] text-white border-[#3d5a43]" 
                                  : "bg-white border-gray-300 hover:border-[#4a6850] hover:bg-gray-50"
                              }`}
                            >
                              <div className="font-semibold">
                                {combo.description}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
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