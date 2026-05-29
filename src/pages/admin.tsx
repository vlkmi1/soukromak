import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, CheckCircle, XCircle, Clock, DollarSign, Users, RefreshCw } from "lucide-react";
import { format } from "date-fns";
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

const STATUS_CONFIG = {
  new: { label: "Nová", icon: Clock, color: "bg-blue-500" },
  confirmed: { label: "Potvrzená", icon: CheckCircle, color: "bg-green-500" },
  paid: { label: "Zaplacená", icon: DollarSign, color: "bg-emerald-600" },
  cancelled: { label: "Stornovaná", icon: XCircle, color: "bg-red-500" },
};

export default function AdminPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [groupedReservations, setGroupedReservations] = useState<GroupedReservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<GroupedReservation[]>([]);
  const [activeFilter, setActiveFilter] = useState<ReservationStatus | "all">("all");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Seskupit rezervace podle zákazníka + období
  const groupReservations = (reservations: Reservation[]): GroupedReservation[] => {
    const groups = new Map<string, Reservation[]>();

    // Seskupit podle zákazníka + start_date + end_date
    reservations.forEach((reservation) => {
      const key = `${reservation.customer_email}_${reservation.start_date}_${reservation.end_date}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(reservation);
    });

    // Převést skupiny na GroupedReservation objekty
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
      // Řadit podle data začátku (nejnovější první)
      return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
    });
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
  }, []);

  useEffect(() => {
    if (activeFilter === "all") {
      setFilteredReservations(groupedReservations.filter((reservation) => {
        // "Vše" zobrazuje všechny KROMĚ stornovaných
        return reservation.status !== "cancelled";
      }));
    } else {
      setFilteredReservations(groupedReservations.filter((r) => r.status === activeFilter));
    }
  }, [activeFilter, groupedReservations]);

  const updateReservationStatus = async (ids: number[], newStatus: ReservationStatus) => {
    try {
      // Aktualizovat všechny záznamy ve skupině
      const { error } = await supabase
        .from("reservations")
        .update({ status: newStatus })
        .in("id", ids);

      if (error) throw error;

      // Aktualizovat lokální stav
      setReservations((prev) =>
        prev.map((r) => (ids.includes(r.id) ? { ...r, status: newStatus } : r))
      );

      toast({
        title: "Stav aktualizován",
        description: `Rezervace byla změněna na "${STATUS_CONFIG[newStatus].label}"`,
      });

      // Znovu načíst rezervace pro aktualizaci seskupení
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