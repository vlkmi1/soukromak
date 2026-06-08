import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Eye, DollarSign, XCircle, CheckCircle, Clock, Palette, Lock, ChevronLeft, ChevronRight, Users, Phone } from "lucide-react";
import { FileEdit, Image as ImageIcon } from "lucide-react";
import { format, addDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { cs } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/pricing";

type ReservationStatus = "new" | "confirmed" | "paid" | "cancelled";

interface Reservation {
  id: number;
  spot_id: number;
  position_id: number;
  start_date: string;
  end_date: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes: string | null;
  status: ReservationStatus;
  price: number | null;
  created_at: string;
  fishing_spots?: {
    number: number;
  };
}

interface GroupedReservation {
  groupId: string;
  ids: number[];
  spotNumbers: number[];
  start_date: string;
  end_date: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes: string | null;
  status: ReservationStatus;
  price: number | null;
  created_at: string;
  anglerCount: number;
}

interface OccupancySpot {
  spotNumber: number;
  anglerCount: number;
  customer_name: string;
  customer_phone: string;
}

const STATUS_CONFIG = {
  new: { label: "Nová", icon: Clock, color: "bg-blue-500" },
  confirmed: { label: "Potvrzená", icon: CheckCircle, color: "bg-green-500" },
  paid: { label: "Zaplacená", icon: DollarSign, color: "bg-emerald-600" },
  cancelled: { label: "Stornovaná", icon: XCircle, color: "bg-red-500" },
};

const ADMIN_PIN = "1234"; // V produkci by bylo v .env

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [reservations, setReservations] = useState<any[]>([]);
  const [groupedReservations, setGroupedReservations] = useState<GroupedReservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<ReservationStatus | "all">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [occupancyDate, setOccupancyDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [spotAvailability, setSpotAvailability] = useState<any[]>([]);
  const [spotPositions, setSpotPositions] = useState<any[]>([]);
  const [mapImageUrl, setMapImageUrl] = useState<string>("/Mapa-Rybnik-Ostrata-scaled.jpg");
  const [siteName, setSiteName] = useState("Rybník Ostrata");
  const { toast } = useToast();

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      setIsAuthenticated(true);
      setPinError(false);
      fetchReservations();
      loadBrandSettings();
    } else {
      setPinError(true);
      setPinInput("");
    }
  };

  const loadBrandSettings = async () => {
    try {
      const { getBrandSettings } = await import("@/lib/brandService");
      const settings = await getBrandSettings();
      if (settings.site_name) {
        setSiteName(settings.site_name);
      }
    } catch (error) {
      console.error("Error loading brand settings:", error);
    }
  };

  // Seskupit rezervace podle zákazníka + období
  const groupReservations = (reservations: Reservation[]): GroupedReservation[] => {
    const groups = new Map<string, Reservation[]>();

    reservations.forEach((reservation) => {
      const key = `${reservation.customer_email}_${reservation.start_date}_${reservation.end_date}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(reservation);
    });

    return Array.from(groups.entries()).map(([groupId, items]) => {
      const first = items[0];
      const spotNumbers = Array.from(
        new Set(items.map((r) => r.fishing_spots?.number || r.spot_id))
      ).sort((a, b) => a - b);

      return {
        groupId,
        ids: items.map((r) => r.id),
        spotNumbers,
        start_date: first.start_date,
        end_date: first.end_date,
        customer_name: first.customer_name,
        customer_email: first.customer_email,
        customer_phone: first.customer_phone,
        notes: first.notes,
        status: first.status,
        price: first.price,
        created_at: first.created_at,
        anglerCount: items.length,
      };
    }).sort((a, b) => {
      return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
    });
  };

  const getOccupancyForDate = (targetDate: Date): OccupancySpot[] => {
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);

    const occupiedSpots = new Map<number, { anglerCount: number; customer: string; phone: string }>();

    reservations
      .filter((r) => r.status !== "cancelled")
      .forEach((reservation) => {
        const resStart = new Date(reservation.start_date);
        const resEnd = new Date(reservation.end_date);

        if (
          isWithinInterval(dayStart, { start: resStart, end: resEnd }) ||
          isWithinInterval(dayEnd, { start: resStart, end: resEnd }) ||
          (resStart <= dayStart && resEnd >= dayEnd)
        ) {
          const spotNum = reservation.fishing_spots?.number || reservation.spot_id;
          const existing = occupiedSpots.get(spotNum);

          if (existing) {
            occupiedSpots.set(spotNum, {
              anglerCount: existing.anglerCount + 1,
              customer: existing.customer,
              phone: existing.phone,
            });
          } else {
            occupiedSpots.set(spotNum, {
              anglerCount: 1,
              customer: reservation.customer_name,
              phone: reservation.customer_phone,
            });
          }
        }
      });

    return Array.from(occupiedSpots.entries())
      .map(([spotNumber, data]) => ({
        spotNumber,
        anglerCount: data.anglerCount,
        customer_name: data.customer,
        customer_phone: data.phone,
      }))
      .sort((a, b) => a.spotNumber - b.spotNumber);
  };

  const fetchReservations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select("*, fishing_spots(number)")
        .order("start_date", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReservations(data || []);
      
      const grouped = groupReservations(data || []);
      setGroupedReservations(grouped);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      toast({
        title: "Chyba při načítání",
        description: "Nepodařilo se načíst rezervace",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
    loadSpotPositions();
  }, []);

  const loadSpotPositions = async () => {
    try {
      // Načíst URL obrázku
      const { data: mapData, error: mapError } = await supabase
        .from("map_image")
        .select("*")
        .order("id", { ascending: false })
        .limit(1)
        .single();

      if (!mapError && mapData) {
        setMapImageUrl(mapData.image_url);
      }

      // Načíst pozice míst z fishing_spots
      const { data: spots, error: spotsError } = await supabase
        .from("fishing_spots")
        .select("*")
        .order("number");

      if (spotsError || !spots || spots.length === 0) {
        setDefaultSpotPositions();
        return;
      }

      setSpotPositions(spots.map(s => ({
        spot_number: s.number,
        x_position: s.x_position,
        y_position: s.y_position,
      })));
    } catch (error) {
      console.error("Error loading spot positions:", error);
      setDefaultSpotPositions();
    }
  };

  const setDefaultSpotPositions = () => {
    const defaultPositions = [];
    for (let i = 1; i <= 14; i++) {
      defaultPositions.push({
        spot_number: i,
        x_position: 50 + (i - 7.5) * 3,
        y_position: 50,
      });
    }
    setSpotPositions(defaultPositions);
  };

  useEffect(() => {
    if (activeFilter === "all") {
      setFilteredReservations(groupedReservations.filter((reservation) => {
        return reservation.status !== "cancelled";
      }));
    } else {
      setFilteredReservations(groupedReservations.filter((r) => r.status === activeFilter));
    }
  }, [activeFilter, groupedReservations]);

  const updateReservationStatus = async (ids: number[], newStatus: ReservationStatus) => {
    try {
      const { error } = await supabase
        .from("reservations")
        .update({ status: newStatus })
        .in("id", ids);

      if (error) throw error;

      setReservations((prev) =>
        prev.map((r) => (ids.includes(r.id) ? { ...r, status: newStatus } : r))
      );

      toast({
        title: "Stav aktualizován",
        description: `Rezervace byla změněna na "${STATUS_CONFIG[newStatus].label}"`,
      });

      fetchReservations();
    } catch (error) {
      console.error("Error updating reservation:", error);
      toast({
        title: "Chyba při aktualizaci",
        description: "Nepodařilo se změnit stav rezervace",
        variant: "destructive",
      });
    }
  };

  const getStats = () => {
    return {
      total: groupedReservations.length,
      new: groupedReservations.filter((r) => r.status === "new").length,
      confirmed: groupedReservations.filter((r) => r.status === "confirmed").length,
      paid: groupedReservations.filter((r) => r.status === "paid").length,
      cancelled: groupedReservations.filter((r) => r.status === "cancelled").length,
    };
  };

  const stats = getStats();
  const occupancy = getOccupancyForDate(occupancyDate);
  const isToday = format(occupancyDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
  const isTomorrow = format(occupancyDate, "yyyy-MM-dd") === format(addDays(new Date(), 1), "yyyy-MM-dd");

  useEffect(() => {
    calculateSpotAvailability();
  }, [selectedDate, reservations]);

  const calculateSpotAvailability = () => {
    const start = startOfDay(selectedDate);
    const end = endOfDay(selectedDate);

    const availability: any[] = [];
    
    for (let spotNum = 1; spotNum <= 14; spotNum++) {
      const occupiedPositions = new Set<number>();
      
      reservations.forEach((res) => {
        if (res.spot_id === spotNum && ["new", "confirmed", "paid"].includes(res.status)) {
          const resStart = startOfDay(new Date(res.start_date));
          const resEnd = startOfDay(new Date(res.end_date));
          
          if (resStart <= end && resEnd >= start) {
            occupiedPositions.add(res.position_id);
          }
        }
      });

      const availableCount = 2 - occupiedPositions.size;
      availability.push({
        spotNumber: spotNum,
        available: availableCount,
        occupied: occupiedPositions.size,
      });
    }

    setSpotAvailability(availability);
  };

  // PIN přihlášení
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Admin přístup</CardTitle>
              <CardDescription>Zadejte PIN pro přístup k administraci</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePinSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pin">PIN kód</Label>
                  <Input
                    id="pin"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value.replace(/\D/g, ""));
                      setPinError(false);
                    }}
                    placeholder="••••"
                    className={pinError ? "border-red-500" : ""}
                    autoFocus
                  />
                  {pinError && (
                    <p className="text-sm text-red-500">Nesprávný PIN kód</p>
                  )}
                </div>
                <Button type="submit" className="w-full" size="lg">
                  Přihlásit se
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8">
        <div className="container">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Admin panel</h1>
              <p className="text-muted-foreground text-lg">Správa rezervací {siteName}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Celkem</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>

              <button
                onClick={() => router.push("/admin/nastaveni-mist")}
                className="p-6 border-2 bg-white border-gray-300 hover:border-[#3d5a43] text-left transition-all"
              >
                <MapPin className="h-12 w-12 mb-4 text-[#2a3d32]" />
                <h2 className="text-xl font-bold uppercase tracking-wide text-[#2a3d32]">
                  Nastavení míst
                </h2>
                <p className="text-sm mt-2 text-gray-600">Editor pozic lovných míst</p>
              </button>

              <button
                onClick={() => router.push("/admin/nastaveni-brandu")}
                className="p-6 border-2 bg-white border-gray-300 hover:border-[#3d5a43] text-left transition-all"
              >
                <Palette className="h-12 w-12 mb-4 text-[#2a3d32]" />
                <h2 className="text-xl font-bold uppercase tracking-wide text-[#2a3d32]">
                  Nastavení brandu
                </h2>
                <p className="text-sm mt-2 text-gray-600">Barvy, fonty, kontakt</p>
              </button>

              <button
                onClick={() => router.push("/admin/editor")}
                className="p-6 border-2 bg-white border-gray-300 hover:border-[#3d5a43] text-left transition-all"
              >
                <FileEdit className="h-12 w-12 mb-4 text-[#2a3d32]" />
                <h2 className="text-xl font-bold uppercase tracking-wide text-[#2a3d32]">
                  Editor stránek
                </h2>
                <p className="text-sm mt-2 text-gray-600">Správa článků a obsahu</p>
              </button>

              <button
                onClick={() => router.push("/admin/galerie")}
                className="p-6 border-2 bg-white border-gray-300 hover:border-[#3d5a43] text-left transition-all"
              >
                <ImageIcon className="h-12 w-12 mb-4 text-[#2a3d32]" />
                <h2 className="text-xl font-bold uppercase tracking-wide text-[#2a3d32]">
                  Fotogalerie
                </h2>
                <p className="text-sm mt-2 text-gray-600">Upload a správa fotek</p>
              </button>

              <button
                onClick={() => router.push("/admin/cenik")}
                className="p-6 border-2 bg-white border-gray-300 hover:border-[#3d5a43] text-left transition-all"
              >
                <DollarSign className="h-12 w-12 mb-4 text-[#2a3d32]" />
                <h2 className="text-xl font-bold uppercase tracking-wide text-[#2a3d32]">
                  Ceník
                </h2>
                <p className="text-sm mt-2 text-gray-600">Správa cen balíčků</p>
              </button>
            </div>
          </div>

          {/* Přehled obsazenosti rybníku */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Obsazenost rybníku
                  </CardTitle>
                  <CardDescription>
                    {isToday ? "Dnes" : isTomorrow ? "Zítra" : format(occupancyDate, "d. MMMM yyyy", { locale: cs })}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOccupancyDate((prev) => addDays(prev, -1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOccupancyDate(new Date())}
                    disabled={isToday}
                  >
                    Dnes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOccupancyDate((prev) => addDays(prev, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {occupancy.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="mx-auto h-12 w-12 mb-3 opacity-30" />
                  <p>Rybník je volný - žádná obsazená místa</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {occupancy.map((spot) => (
                    <div
                      key={spot.spotNumber}
                      className="flex items-center justify-between p-4 border rounded-lg bg-accent/5 hover:bg-accent/10 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-lg text-white font-bold text-lg">
                          {spot.spotNumber}
                        </div>
                        <div>
                          <div className="font-semibold text-lg">{spot.customer_name}</div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              <span>{spot.anglerCount} {spot.anglerCount === 1 ? "rybář" : "rybáři"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5" />
                              <span>{spot.customer_phone}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-500/10 text-green-700 border-green-500/20">
                        Obsazeno
                      </Badge>
                    </div>
                  ))}
                  <div className="pt-2 text-sm text-muted-foreground text-center">
                    {occupancy.length} {occupancy.length === 1 ? "místo obsazeno" : occupancy.length < 5 ? "místa obsazena" : "míst obsazeno"} z 14
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mini náhled mapy s obsazeností */}
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Mapa obsazenosti - {format(selectedDate, "d. MMMM yyyy", { locale: cs })}
                </CardTitle>
                <CardDescription>
                  Zobrazení dostupnosti lovných míst pro vybraný den
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Výběr data */}
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-center font-semibold min-w-[200px]">
                      {format(selectedDate, "EEEE, d. MMMM yyyy", { locale: cs })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate(new Date())}
                    >
                      Dnes
                    </Button>
                  </div>

                  {/* Mini mapa */}
                  <div className="relative w-full max-w-2xl mx-auto rounded-lg overflow-hidden border">
                    <img 
                      src={mapImageUrl}
                      alt="Mapa rybníku" 
                      className="w-full h-auto block"
                    />
                    
                    {/* SVG overlay s puntíky */}
                    <svg 
                      className="absolute inset-0 w-full h-full"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                    >
                      {spotPositions.map((position) => {
                        const availData = spotAvailability.find(a => a.spotNumber === position.spot_number);
                        const available = availData?.available ?? 2;
                        
                        let color = "#10b981"; // green-500 - volné
                        if (available === 0) color = "#ef4444"; // red-500 - obsazeno
                        else if (available === 1) color = "#f59e0b"; // amber-500 - částečně

                        return (
                          <g key={position.spot_number}>
                            <circle
                              cx={position.x_position}
                              cy={position.y_position}
                              r="2.5"
                              fill={color}
                              stroke="white"
                              strokeWidth="0.3"
                            />
                            <text
                              x={position.x_position}
                              y={position.y_position}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="white"
                              fontSize="2"
                              fontWeight="bold"
                              className="pointer-events-none"
                            >
                              {position.spot_number}
                            </text>
                          </g>
                        );
                      })}
                    </svg>

                    {/* Legenda */}
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-lg">
                      <div className="flex flex-col gap-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span>Volné (2 pozice)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                          <span>Částečně (1 pozice)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <span>Obsazeno (0 pozic)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Souhrn dostupnosti */}
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-700">
                        {spotAvailability.filter(s => s.available === 2).length}
                      </div>
                      <div className="text-xs text-green-600">Volná místa</div>
                    </div>
                    <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="text-2xl font-bold text-amber-700">
                        {spotAvailability.filter(s => s.available === 1).length}
                      </div>
                      <div className="text-xs text-amber-600">Částečně obsazená</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-2xl font-bold text-red-700">
                        {spotAvailability.filter(s => s.available === 0).length}
                      </div>
                      <div className="text-xs text-red-600">Plně obsazená</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistiky */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Celkem</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  Nové
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.new}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Potvrzené
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.confirmed}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-600" />
                  Zaplacené
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.paid}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  Stornované
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.cancelled}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Rezervace</CardTitle>
              <CardDescription>Přehled všech rezervací s možností změny stavu</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as typeof activeFilter)}>
                <TabsList className="mb-6">
                  <TabsTrigger value="all">Vše ({stats.total - stats.cancelled})</TabsTrigger>
                  <TabsTrigger value="new">Nové ({stats.new})</TabsTrigger>
                  <TabsTrigger value="confirmed">Potvrzené ({stats.confirmed})</TabsTrigger>
                  <TabsTrigger value="paid">Zaplacené ({stats.paid})</TabsTrigger>
                  <TabsTrigger value="cancelled">Stornované ({stats.cancelled})</TabsTrigger>
                </TabsList>

                <TabsContent value={activeFilter} className="mt-0">
                  {isLoading ? (
                    <div className="text-center py-12 text-muted-foreground">Načítám rezervace...</div>
                  ) : filteredReservations.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      Žádné rezervace nenalezeny
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Období</TableHead>
                            <TableHead>Místo</TableHead>
                            <TableHead>Zákazník</TableHead>
                            <TableHead>Kontakt</TableHead>
                            <TableHead>Cena</TableHead>
                            <TableHead>Stav</TableHead>
                            <TableHead>Akce</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredReservations.map((reservation) => {
                            const StatusIcon = STATUS_CONFIG[reservation.status].icon;
                            
                            return (
                              <TableRow key={reservation.groupId}>
                                <TableCell className="font-mono text-sm">
                                  #{reservation.ids[0]}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <div className="text-sm">
                                      <div>
                                        {format(new Date(reservation.start_date), "d. MMM", { locale: cs })} - {format(new Date(reservation.end_date), "d. MMM yyyy", { locale: cs })}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                  {reservation.spotNumbers.length === 1 ? (
                                    `Místo #${reservation.spotNumbers[0]}`
                                  ) : (
                                    `Místa #${reservation.spotNumbers.join(", #")}`
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{reservation.customer_name}</div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                      <Users className="h-3 w-3" />
                                      <span>{reservation.anglerCount} {reservation.anglerCount === 1 ? "rybář" : "rybáři"}</span>
                                    </div>
                                    {reservation.notes && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {reservation.notes}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <div>{reservation.customer_email}</div>
                                    <div className="text-muted-foreground">
                                      {reservation.customer_phone}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {reservation.price ? (
                                    <div className="font-medium">{formatPrice(reservation.price)}</div>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">—</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="secondary"
                                    className={`${STATUS_CONFIG[reservation.status].color} text-white`}
                                  >
                                    <StatusIcon className="mr-1 h-3 w-3" />
                                    {STATUS_CONFIG[reservation.status].label}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={reservation.status}
                                    onValueChange={(value) =>
                                      updateReservationStatus(reservation.ids, value as ReservationStatus)
                                    }
                                  >
                                    <SelectTrigger className="w-40">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="new">Nová</SelectItem>
                                      <SelectItem value="confirmed">Potvrzená</SelectItem>
                                      <SelectItem value="paid">Zaplacená</SelectItem>
                                      <SelectItem value="cancelled">Stornovaná</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}