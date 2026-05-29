import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PondMap } from "@/components/PondMap";
import { ReservationForm } from "@/components/ReservationForm";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Users, Info, CheckCircle2, AlertCircle, Lightbulb } from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  getSpotAvailability, 
  findBestSpotCombination, 
  checkAdjacentAvailability,
  findAllPossibleCombinations,
  type ReservationSuggestion,
  type SpotCombination
} from "@/services/reservationService";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DateRange } from "react-day-picker";

export default function ReservationPage() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const [fishermanCount, setFishermanCount] = useState("1");
  const [selectedSpot, setSelectedSpot] = useState<number | null>(null);
  const [manuallySelected, setManuallySelected] = useState(false);
  const [suggestion, setSuggestion] = useState<ReservationSuggestion | null>(null);
  const [allCombinations, setAllCombinations] = useState<SpotCombination[]>([]);
  const [showForm, setShowForm] = useState(false);

  const handleSpotSelect = (spotNumber: number) => {
    setSelectedSpot(spotNumber);
    setManuallySelected(true);
    setShowForm(false);
    
    // Zkontrolovat sousední místa pro manuální výběr
    if (dateRange.from && dateRange.to) {
      checkManualSelection(spotNumber);
    }
  };

  const checkManualSelection = async (spotNumber: number) => {
    if (!dateRange.from || !dateRange.to) return;

    const availability = await getSpotAvailability(dateRange.from, dateRange.to);
    const adjacentCheck = checkAdjacentAvailability(spotNumber, parseInt(fishermanCount), availability);
    
    setSuggestion(adjacentCheck);
    setAllCombinations([]);
  };

  const handleAutomaticSearch = async () => {
    if (!dateRange.from || !dateRange.to) return;

    const availability = await getSpotAvailability(dateRange.from, dateRange.to);
    const bestCombination = findBestSpotCombination(parseInt(fishermanCount), availability);
    const allPossible = findAllPossibleCombinations(parseInt(fishermanCount), availability);
    
    setSuggestion(bestCombination);
    setAllCombinations(allPossible);
    setManuallySelected(false);
    
    if (bestCombination && bestCombination.spots.length > 0) {
      setSelectedSpot(bestCombination.spots[0]);
    }
  };

  const handleCombinationSelect = (spots: number[]) => {
    setSelectedSpot(spots[0]);
    setSuggestion({
      spots: spots,
      isOptimal: true,
      message: `Vybráno: Místa ${spots.join("+")}`,
      type: "adjacent",
    });
    setShowForm(true);
  };

  useEffect(() => {
    if (dateRange.from && dateRange.to && !manuallySelected) {
      handleAutomaticSearch();
    }
  }, [dateRange, fishermanCount]);

  const getDayCount = () => {
    if (!dateRange.from || !dateRange.to) return 0;
    const diffTime = Math.abs(dateRange.to.getTime() - dateRange.from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Rezervace lovného místa</h1>
            <p className="text-muted-foreground text-lg">
              Vyberte období a počet rybářů - systém najde nejlepší dostupná místa
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Levý panel - Výběr parametrů */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    Parametry rezervace
                  </CardTitle>
                  <CardDescription>
                    Vyberte datum a počet rybářů
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Období rezervace</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateRange.from && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "d. MMM", { locale: cs })} -{" "}
                                {format(dateRange.to, "d. MMM yyyy", { locale: cs })}
                              </>
                            ) : (
                              format(dateRange.from, "d. MMMM yyyy", { locale: cs })
                            )
                          ) : (
                            "Vyberte datum od - do"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          selected={dateRange}
                          onSelect={(range) => {
                            setDateRange(range || { from: undefined, to: undefined });
                            setManuallySelected(false);
                          }}
                          numberOfMonths={2}
                          locale={cs}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        />
                      </PopoverContent>
                    </Popover>
                    {dateRange.from && dateRange.to && (
                      <p className="text-xs text-muted-foreground">
                        {getDayCount()} {getDayCount() === 1 ? "den" : getDayCount() < 5 ? "dny" : "dní"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fisherman-count">Počet rybářů</Label>
                    <Select 
                      value={fishermanCount} 
                      onValueChange={(val) => {
                        setFishermanCount(val);
                        setManuallySelected(false);
                      }}
                    >
                      <SelectTrigger id="fisherman-count">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 rybář</SelectItem>
                        <SelectItem value="2">2 rybáři</SelectItem>
                        <SelectItem value="3">3 rybáři</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {suggestion && (
                    <Alert variant={suggestion.isOptimal ? "default" : "destructive"}>
                      {suggestion.isOptimal ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <AlertDescription className="text-sm">
                        {suggestion.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Zobrazení všech možných kombinací */}
                  {!manuallySelected && allCombinations.length > 1 && (
                    <Card className="border-accent">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-accent" />
                          Dostupné možnosti ({allCombinations.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {allCombinations.slice(0, 10).map((combo, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleCombinationSelect(combo.spots)}
                            className="w-full text-left p-3 rounded-lg border border-border hover:border-accent hover:bg-accent/10 transition-colors"
                          >
                            <div className="font-medium text-sm">{combo.description}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Klikněte pro rezervaci
                            </div>
                          </button>
                        ))}
                        {allCombinations.length > 10 && (
                          <p className="text-xs text-muted-foreground text-center pt-2">
                            ... a dalších {allCombinations.length - 10} možností
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {!dateRange.from && (
                    <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground">
                      <Info className="h-4 w-4 inline mr-2" />
                      Vyberte období pro zobrazení dostupnosti
                    </div>
                  )}
                </CardContent>
              </Card>

              {showForm && selectedSpot && dateRange.from && dateRange.to && (
                <ReservationForm
                  selectedSpot={selectedSpot}
                  dateRange={dateRange}
                  fishermanCount={parseInt(fishermanCount)}
                  onSuccess={() => {
                    setShowForm(false);
                    setSelectedSpot(null);
                    setManuallySelected(false);
                    handleAutomaticSearch();
                  }}
                />
              )}
            </div>

            {/* Pravý panel - Mapa */}
            <div className="lg:col-span-2">
              <PondMap
                dateRange={dateRange}
                fishermanCount={parseInt(fishermanCount)}
                onSpotSelect={handleSpotSelect}
                suggestedSpots={suggestion?.spots || []}
              />
              
              {manuallySelected && suggestion?.isOptimal && (
                <div className="mt-4">
                  <Button 
                    onClick={() => setShowForm(true)}
                    size="lg"
                    className="w-full"
                  >
                    Pokračovat k rezervaci
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}