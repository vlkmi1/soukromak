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
import { Users, AlertCircle, CheckCircle2, Calendar, Banknote, AlertTriangle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { createReservation } from "@/services/reservationService";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DateRange } from "react-day-picker";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getPricingPackageName, formatPrice, calculateReservationPrice } from "@/lib/pricing";

interface ReservationFormProps {
  selectedSpots: number[];
  selectedDates: Date[];
  dateRange: DateRange;
  fishermanCount: number;
  onSuccess?: () => void;
}

export function ReservationForm({ selectedSpots, selectedDates, dateRange, fishermanCount, onSuccess }: ReservationFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGapWarning, setShowGapWarning] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Detekce mezer v období (nesouvislé dny)
  const detectDateGaps = () => {
    if (selectedDates.length < 2) return { hasGaps: false, gapDays: [] };

    const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
    const gaps: Date[] = [];
    
    for (let i = 0; i < sortedDates.length - 1; i++) {
      const currentDate = sortedDates[i];
      const nextDate = sortedDates[i + 1];
      const dayDiff = Math.round((nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Pokud je rozdíl větší než 1 den, máme mezeru
      if (dayDiff > 1) {
        // Přidat všechny chybějící dny
        for (let d = 1; d < dayDiff; d++) {
          const gapDate = new Date(currentDate);
          gapDate.setDate(currentDate.getDate() + d);
          gaps.push(gapDate);
        }
      }
    }
    
    return { hasGaps: gaps.length > 0, gapDays: gaps };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dateRange.from || !dateRange.to) {
      setSubmitStatus({
        type: "error",
        message: "Vyberte prosím období rezervace",
      });
      return;
    }

    // Kontrola mezer v datech
    const { hasGaps } = detectDateGaps();
    if (hasGaps && !pendingSubmit) {
      setShowGapWarning(true);
      return;
    }

    await processReservation();
  };

  const processReservation = async () => {
    setIsSubmitting(true);
    setSubmitStatus(null);
    setShowGapWarning(false);

    try {
      const price = calculateReservationPrice(dateRange.from!, dateRange.to!, fishermanCount);
      
      const result = await createReservation(
        selectedSpots,
        fishermanCount,
        dateRange.from!,
        dateRange.to!,
        { name, email, phone, notes },
        price
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
        setPendingSubmit(false);
        
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
      setPendingSubmit(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmWithGaps = () => {
    setPendingSubmit(true);
    setShowGapWarning(false);
    processReservation();
  };

  const { hasGaps, gapDays } = detectDateGaps();

  const getDayCount = () => {
    if (!dateRange.from || !dateRange.to) return 0;
    const diffTime = Math.abs(dateRange.to.getTime() - dateRange.from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const basePrice = dateRange.from && dateRange.to 
    ? calculateReservationPrice(dateRange.from, dateRange.to, 1)
    : 0;

  const totalPrice = dateRange.from && dateRange.to 
    ? calculateReservationPrice(dateRange.from, dateRange.to, fishermanCount)
    : 0;

  const packageName = dateRange.from && dateRange.to
    ? getPricingPackageName(dateRange.from, dateRange.to)
    : "";

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Dokončení rezervace</CardTitle>
          <CardDescription>
            Vyplňte kontaktní údaje pro dokončení rezervace
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitStatus && (
            <Alert
              variant={submitStatus.type === "success" ? "default" : "destructive"}
              className="mb-6"
            >
              {submitStatus.type === "success" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertDescription>{submitStatus.message}</AlertDescription>
            </Alert>
          )}

          {hasGaps && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Upozornění:</strong> Vybrali jste dny s mezerami. Chybějící dny:{" "}
                {gapDays.map((d) => format(d, "d. MMM", { locale: cs })).join(", ")}.
                Pokud pokračujete, budou vytvořeny samostatné rezervace.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Souhrn rezervace */}
            <div className="bg-primary/10 border border-primary rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  {dateRange.from && dateRange.to && (
                    <>
                      {format(dateRange.from, "d. MMM", { locale: cs })} - {format(dateRange.to, "d. MMM yyyy", { locale: cs })}
                      {" "}({selectedDates.length} {selectedDates.length === 1 ? "den" : selectedDates.length < 5 ? "dny" : "dní"})
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-medium">{fishermanCount} {fishermanCount === 1 ? "rybář" : "rybáři"}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">
                  {selectedSpots.length === 1 ? "Místo: " : "Místa: "}
                </span>
                <span className="text-primary font-bold">
                  {selectedSpots.map(s => `#${s}`).join(" + ")}
                </span>
              </div>
              <div className="pt-2 border-t border-primary/20 text-lg font-bold text-primary">
                Celková cena: {formatPrice(calculateReservationPrice(dateRange.from!, dateRange.to!, fishermanCount))}
              </div>
            </div>

            {/* Kontaktní formulář */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Jméno a příjmení *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Jan Novák"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="jan.novak@email.cz"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="+420 123 456 789"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Poznámka (volitelné)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Další požadavky nebo poznámky..."
                  rows={3}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Odesílám..." : "Dokončit rezervaci"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Dialog s upozorněním na mezery v datech */}
      <AlertDialog open={showGapWarning} onOpenChange={setShowGapWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Upozornění na mezery v datech
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Vybrali jste dny s mezerami. Chybějící dny v období:
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="font-semibold text-amber-900">
                  {gapDays.map((d) => format(d, "d. MMMM yyyy", { locale: cs })).join(", ")}
                </p>
              </div>
              <p>
                Pokud pokračujete, bude vytvořeno více samostatných rezervací pro každé souvislé období. 
                Je to v pořádku?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingSubmit(false)}>
              Zrušit a upravit dny
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmWithGaps} className="bg-primary">
              Ano, pokračovat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}