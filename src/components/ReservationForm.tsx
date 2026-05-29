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
import { Users, AlertCircle, CheckCircle2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { createReservation } from "@/services/reservationService";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface ReservationFormProps {
  selectedSpot: number;
  dateRange: DateRange;
  fishermanCount: number;
  onSuccess?: () => void;
}

export function ReservationForm({ selectedSpot, dateRange, fishermanCount, onSuccess }: ReservationFormProps) {
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

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const result = await createReservation(
        [selectedSpot],
        fishermanCount,
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
        setName("");
        setEmail("");
        setPhone("");
        setNotes("");
        
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
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
          Dokončení rezervace
        </CardTitle>
        <CardDescription>
          Vyplňte své kontaktní údaje
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* Souhrn rezervace */}
          <div className="bg-primary/10 border border-primary rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-medium">
                {dateRange.from && dateRange.to && (
                  <>
                    {format(dateRange.from, "d. MMM", { locale: cs })} - {format(dateRange.to, "d. MMM yyyy", { locale: cs })}
                    {" "}({getDayCount()} {getDayCount() === 1 ? "den" : getDayCount() < 5 ? "dny" : "dní"})
                  </>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-medium">{fishermanCount} {fishermanCount === 1 ? "rybář" : "rybáři"}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium">Místo: </span>
              <span className="text-primary font-bold">#{selectedSpot}</span>
            </div>
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
            disabled={isSubmitting}
          >
            {isSubmitting ? "Odesílám..." : "Odeslat rezervaci"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            * Rezervace bude potvrzena po kontrole správcem
          </p>
        </form>
      </CardContent>
    </Card>
  );
}