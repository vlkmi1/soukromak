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

type ReservationStatus = "new" | "confirmed" | "paid" | "cancelled";

interface Reservation {
  id: number;
  fishing_spot_id: number;
  reservation_date: string;
  number_of_anglers: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes: string | null;
  status: ReservationStatus;
  created_at: string;
}

const STATUS_CONFIG = {
  new: { label: "Nová", icon: Clock, color: "bg-blue-500" },
  confirmed: { label: "Potvrzená", icon: CheckCircle, color: "bg-green-500" },
  paid: { label: "Zaplacená", icon: DollarSign, color: "bg-emerald-600" },
  cancelled: { label: "Stornovaná", icon: XCircle, color: "bg-red-500" },
};

export default function AdminPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [activeFilter, setActiveFilter] = useState<ReservationStatus | "all">("all");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchReservations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .order("reservation_date", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReservations(data || []);
      setFilteredReservations(data || []);
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
      setFilteredReservations(reservations);
    } else {
      setFilteredReservations(reservations.filter((r) => r.status === activeFilter));
    }
  }, [activeFilter, reservations]);

  const updateReservationStatus = async (id: number, newStatus: ReservationStatus) => {
    try {
      const { error } = await supabase
        .from("reservations")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );

      toast({
        title: "Stav aktualizován",
        description: `Rezervace byla změněna na "${STATUS_CONFIG[newStatus].label}"`,
      });
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
      total: reservations.length,
      new: reservations.filter((r) => r.status === "new").length,
      confirmed: reservations.filter((r) => r.status === "confirmed").length,
      paid: reservations.filter((r) => r.status === "paid").length,
      cancelled: reservations.filter((r) => r.status === "cancelled").length,
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
                  <TabsTrigger value="all">Vše ({stats.total})</TabsTrigger>
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
                            <TableHead>Datum</TableHead>
                            <TableHead>Místo</TableHead>
                            <TableHead>Zákazník</TableHead>
                            <TableHead>Kontakt</TableHead>
                            <TableHead>Rybáři</TableHead>
                            <TableHead>Stav</TableHead>
                            <TableHead>Akce</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredReservations.map((reservation) => {
                            const StatusIcon = STATUS_CONFIG[reservation.status].icon;
                            return (
                              <TableRow key={reservation.id}>
                                <TableCell className="font-mono text-sm">
                                  #{reservation.id}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    {format(new Date(reservation.reservation_date), "d. MMM yyyy", {
                                      locale: cs,
                                    })}
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                  Místo {reservation.fishing_spot_id}
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{reservation.customer_name}</div>
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
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    {reservation.number_of_anglers}
                                  </div>
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
                                      updateReservationStatus(reservation.id, value as ReservationStatus)
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