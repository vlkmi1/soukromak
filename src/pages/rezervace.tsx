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
import { Calendar as CalendarIcon, Users, Info, CheckCircle2, MapPin } from "lucide-react";
import { cs } from "date-fns/locale";
import { format, startOfDay, endOfDay } from "date-fns";

export default function ReservationPage() {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [fishermanCount, setFishermanCount] = useState("1");
  const [selectedSpot, setSelectedSpot] = useState<number[]>([]);
  const [manuallySelected, setManuallySelected] = useState(false);
  const [suggestion, setSuggestion] = useState<ReservationSuggestion | null>(null);
  const [allCombinations, setAllCombinations] = useState<SpotCombination[]>([]);
  const [showForm, setShowForm] = useState(false);

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
                  }}
                  modifiersStyles={{
                    selected: {
                      backgroundColor: "hsl(var(--primary))",
                      color: "white",
                      fontWeight: "bold",
                    },
                  }}
                />
                
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