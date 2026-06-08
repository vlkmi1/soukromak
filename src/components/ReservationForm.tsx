import { useState, useEffect } from "react";
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
import { Users, AlertCircle, CheckCircle2, Calendar, Banknote, AlertTriangle, CheckCircle, MapPin } from "lucide-react";
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
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      calculateReservationPriceAsync();
    }
  }, [dateRange.from, dateRange.to]);

  const calculateReservationPriceAsync = async () => {
    if (!dateRange.from || !dateRange.to) return;

    setIsCalculating(true);
    try {
      const { calculatePrice } = await import("@/lib/pricing");
      const diffTime = Math.abs(dateRange.to.getTime() - dateRange.from.getTime());
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const price = await calculatePrice(days);
      setCalculatedPrice(price * fishermanCount);
    } catch (error) {
      console.error("Error calculating price:", error);
      setCalculatedPrice(500 * fishermanCount); // Fallback cena
    } finally {
      setIsCalculating(false);
    }
  };

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
      <div className="bg-white border border-gray-300 overflow-hidden">
        <div className="bg-[#f5f5f5] border-b border-gray-300 px-6 py-4">
          <h2 className="text-xl font-bold text-[#2a3d32] uppercase tracking-wide">Dokončení rezervace</h2>
          <p className="text-sm text-gray-600 mt-1">Vyplňte kontaktní údaje pro dokončení rezervace</p>
        </div>
        <div className="p-6">
          {submitStatus && (
            <div
              className={`p-4 rounded mb-6 border ${
                submitStatus.type === "success" 
                  ? "bg-green-50 border-green-200" 
                  : "bg-red-50 border-red-200"
              }`}
            >
              {submitStatus.type === "success" ? (
                <CheckCircle className="h-4 w-4 inline mr-2 text-green-700" />
              ) : (
                <AlertTriangle className="h-4 w-4 inline mr-2 text-red-700" />
              )}
              <span className={`text-sm font-medium ${
                submitStatus.type === "success" ? "text-green-800" : "text-red-800"
              }`}>
                {submitStatus.message}
              </span>
            </div>
          )}

          {hasGaps && (
            <div className="p-4 rounded mb-6 border bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 inline mr-2 text-amber-700" />
              <span className="text-sm font-medium text-amber-800">
                <strong>Upozornění:</strong> Vybrali jste dny s mezerami. Chybějící dny:{" "}
                {gapDays.map((d) => format(d, "d. MMM", { locale: cs })).join(", ")}.
                Pokud pokračujete, budou vytvořeny samostatné rezervace.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Souhrn rezervace */}
            {selectedSpots.length > 0 && dateRange.from && dateRange.to && (
              <div className="mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <h3 className="font-bold text-green-800 mb-2 uppercase tracking-wide">
                  Souhrn rezervace
                </h3>
                <div className="space-y-1 text-sm text-green-700">
                  <p>📅 Období: {format(dateRange.from, "d.M.yyyy", { locale: cs })} - {format(dateRange.to, "d.M.yyyy", { locale: cs })}</p>
                  <p>
                    📍 Místa: {selectedSpots.map(s => `#${s}`).join(", ")}
                  </p>
                  <p>👥 Počet rybářů: {fishermanCount}</p>
                  {isCalculating ? (
                    <p className="font-bold">💰 Cena: Počítám...</p>
                  ) : (
                    <p className="font-bold">
                      💰 Cena: {calculatedPrice.toLocaleString("cs-CZ")} Kč
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Kontaktní formulář */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 font-semibold uppercase text-xs tracking-wide">Jméno a příjmení *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Jan Novák"
                  className="border-gray-300 focus:border-[#3d5a43]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-semibold uppercase text-xs tracking-wide">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="jan.novak@email.cz"
                  className="border-gray-300 focus:border-[#3d5a43]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-700 font-semibold uppercase text-xs tracking-wide">Telefon *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="+420 123 456 789"
                  className="border-gray-300 focus:border-[#3d5a43]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-gray-700 font-semibold uppercase text-xs tracking-wide">Poznámka (volitelné)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Další požadavky nebo poznámky..."
                  rows={3}
                  className="border-gray-300 focus:border-[#3d5a43]"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#3d5a43] hover:bg-[#4a6850] text-white font-bold uppercase tracking-wider"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Odesílám..." : "Dokončit rezervaci"}
            </Button>
          </form>
        </div>
      </div>

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
            <AlertDialogAction onClick={handleConfirmWithGaps} className="bg-[#3d5a43] hover:bg-[#4a6850]">
              Ano, pokračovat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}