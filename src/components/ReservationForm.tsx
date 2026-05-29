import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Users, Mail, Phone, User, Send } from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface ReservationFormProps {
  selectedSpotId?: number;
  selectedSpotName?: string;
}

export function ReservationForm({ selectedSpotId, selectedSpotName }: ReservationFormProps) {
  const [date, setDate] = useState<Date>();
  const [numberOfAnglers, setNumberOfAnglers] = useState<string>("1");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSpotId || !date) {
      toast({
        title: "Chyba",
        description: "Vyberte prosím lovné místo a datum",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("reservations")
        .insert({
          fishing_spot_id: selectedSpotId,
          reservation_date: format(date, "yyyy-MM-dd"),
          number_of_anglers: parseInt(numberOfAnglers),
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          notes: formData.notes || null,
          status: "new",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Rezervace odeslána",
        description: "Vaše rezervace byla úspěšně odeslána. Brzy obdržíte potvrzovací email.",
      });

      setFormData({ name: "", email: "", phone: "", notes: "" });
      setDate(undefined);
      setNumberOfAnglers("1");
    } catch (error) {
      console.error("Error creating reservation:", error);
      toast({
        title: "Chyba při vytváření rezervace",
        description: "Nepodařilo se odeslat rezervaci. Zkuste to prosím znovu.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rezervační formulář</CardTitle>
        <CardDescription>
          {selectedSpotName ? `Rezervace pro ${selectedSpotName}` : "Vyberte lovné místo na mapě"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="date">Datum rezervace</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                  disabled={!selectedSpotId}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "d. MMMM yyyy", { locale: cs }) : "Vyberte datum"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  locale={cs}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="anglers">Počet rybářů</Label>
            <Select value={numberOfAnglers} onValueChange={setNumberOfAnglers} disabled={!selectedSpotId}>
              <SelectTrigger id="anglers">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    1 rybář
                  </div>
                </SelectItem>
                <SelectItem value="2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    2 rybáři
                  </div>
                </SelectItem>
                <SelectItem value="3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    3 rybáři
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-t pt-6 space-y-4">
            <h3 className="font-semibold text-sm">Kontaktní údaje</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Jméno a příjmení</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="Jan Novák"
                  className="pl-9"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={!selectedSpotId}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="jan.novak@email.cz"
                  className="pl-9"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={!selectedSpotId}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+420 123 456 789"
                  className="pl-9"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  disabled={!selectedSpotId}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Poznámka (volitelné)</Label>
              <Textarea
                id="notes"
                placeholder="Máte nějaké speciální požadavky?"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                disabled={!selectedSpotId}
                rows={3}
              />
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">Shrnutí rezervace</p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Místo: {selectedSpotName || "Nevybráno"}</p>
              <p>Datum: {date ? format(date, "d. MMMM yyyy", { locale: cs }) : "Nevybráno"}</p>
              <p>Počet rybářů: {numberOfAnglers}</p>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={!date || !selectedSpotId || isSubmitting}
          >
            <Send className="mr-2 h-4 w-4" />
            {isSubmitting ? "Odesílám..." : "Odeslat rezervaci"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Po odeslání obdržíte potvrzovací email. Rezervace bude platná po potvrzení správcem.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}