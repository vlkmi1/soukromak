import { useState, useEffect } from "react";
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
import { Calendar, CheckCircle, XCircle, Clock, DollarSign, Users, RefreshCw, ChevronLeft, ChevronRight, Lock, MapPin, Phone } from "lucide-react";
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [groupedReservations, setGroupedReservations] = useState<GroupedReservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<GroupedReservation[]>([]);
  const [activeFilter, setActiveFilter] = useState<ReservationStatus | "all">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [occupancyDate, setOccupancyDate] = useState(new Date());
  const { toast } = useToast();

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      setIsAuthenticated(true);
      setPinError(false);
      fetchReservations();
    } else {
      setPinError(true);
      setPinInput("");
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
              <p className="text-muted-foreground text-lg">Správa rezervací rybníku Ostrata</p>
            </div>
            <Button onClick={fetchReservations} variant="outline" size="lg">
              <RefreshCw className="mr-2 h-4 w-4" />
              Obnovit
            </Button>
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

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
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