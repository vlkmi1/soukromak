import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Users, AlertCircle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { createReservation } from "@/services/reservationService";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface ReservationFormProps {
  selectedSpot?: number;
  onSuccess?: () => void;
}

export function ReservationForm({ selectedSpot, onSuccess }: ReservationFormProps) {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const [fishermanCount, setFishermanCount] = useState("1");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dateRange.from || !dateRange.to) {
      setSubmitStatus({
        type: "error",
        message: "Vyberte prosím období rezervace",
      });
      return;
    }

    if (!selectedSpot) {
      setSubmitStatus({
        type: "error",
        message: "Vyberte prosím lovné místo na mapě",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const result = await createReservation(
        [selectedSpot],
        parseInt(fishermanCount),
        dateRange.from,
        dateRange.to,
        { name, email, phone, notes }
      );

      if (result.success) {
        setSubmitStatus({
          type: "success",
          message: "Rezervace byla úspěšně odeslána! Brzy vás budeme kontaktovat.",
        });
        
        // Reset formuláře
        setDateRange({ from: undefined, to: undefined });
        setFishermanCount("1");
        setName("");
        setEmail("");
        setPhone("");
        setNotes("");
        
        onSuccess?.();
      } else {
        throw new Error("Nepodařilo se vytvořit rezervaci");
      }
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message: "Při vytváření rezervace došlo k chybě. Zkuste to prosím znovu.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDayCount = () => {
    if (!dateRange.from || !dateRange.to) return 0;
    const diffTime = Math.abs(dateRange.to.getTime() - dateRange.from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Rezervační formulář
        </CardTitle>
        <CardDescription>
          Vyplňte své údaje a odešlete rezervaci
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {submitStatus && (
            <Alert variant={submitStatus.type === "error" ? "destructive" : "default"}>
              {submitStatus.type === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{submitStatus.message}</AlertDescription>
            </Alert>
          )}

          {selectedSpot && (
            <div className="bg-primary/10 border border-primary rounded-lg p-4">
              <p className="text-sm font-medium">
                Vybrané místo: <span className="text-primary font-bold">#{selectedSpot}</span>
              </p>
            </div>
          )}

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
                        {format(dateRange.from, "d. MMM yyyy", { locale: cs })} -{" "}
                        {format(dateRange.to, "d. MMM yyyy", { locale: cs })}
                        <span className="ml-2 text-muted-foreground">
                          ({getDayCount()} {getDayCount() === 1 ? "den" : getDayCount() < 5 ? "dny" : "dní"})
                        </span>
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
                  onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
                  numberOfMonths={2}
                  locale={cs}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Systém zkontroluje dostupnost místa na všechny dny v období
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fisherman-count">Počet rybářů</Label>
            <Select value={fishermanCount} onValueChange={setFishermanCount}>
              <SelectTrigger id="fisherman-count">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 rybář</SelectItem>
                <SelectItem value="2">2 rybáři</SelectItem>
                <SelectItem value="3">3 rybáři</SelectItem>
              </SelectContent>
            </Select>
            {parseInt(fishermanCount) === 3 && (
              <p className="text-xs text-muted-foreground">
                Pro 3 rybáře systém preferuje sousední místa
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Jméno a příjmení *</Label>
            <Input
              id="name"
              type="text"
              placeholder="Jan Novák"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="jan.novak@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefon *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+420 123 456 789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Poznámka (volitelné)</Label>
            <Textarea
              id="notes"
              placeholder="Zde můžete uvést další informace..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting || !dateRange.from || !dateRange.to || !selectedSpot}
          >
            {isSubmitting ? "Odesílám..." : "Odeslat rezervaci"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            * Rezervace bude potvrzena po kontrole správcem.
            <br />
            Budeme vás kontaktovat emailem nebo telefonicky.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}