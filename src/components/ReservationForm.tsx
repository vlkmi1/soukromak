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
import { Checkbox } from "@/components/ui/checkbox";
import { Users, AlertCircle, CheckCircle2, Calendar, Banknote, AlertTriangle, CheckCircle, MapPin, Package } from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { createReservation } from "@/services/reservationService";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DateRange } from "react-day-picker";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getPricingPackageName, formatPrice, calculateReservationPrice } from "@/lib/pricing";
import { supabase } from "@/lib/supabase";

interface Addon {
  id: number;
  name: string;
  description?: string;
  image_url?: string;
  price_per_day: number;
  is_active: boolean;
}

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
  const [availableAddons, setAvailableAddons] = useState<Addon[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<number[]>([]);
  const [loadingAddons, setLoadingAddons] = useState(false);

  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      calculateReservationPriceAsync();
    }
  }, [dateRange.from, dateRange.to, selectedAddons]);

  useEffect(() => {
    if (selectedSpots.length > 0) {
      loadAvailableAddons();
    } else {
      setAvailableAddons([]);
      setSelectedAddons([]);
    }
  }, [selectedSpots]);

  const loadAvailableAddons = async () => {
    setLoadingAddons(true);
    try {
      // Načíst ID vybraných míst z fishing_spots
      const { data: spotsData, error: spotsError } = await supabase
        .from("fishing_spots")
        .select("id")
        .in("number", selectedSpots);

      if (spotsError) throw spotsError;

      const spotIds = spotsData?.map((s) => s.id) || [];

      if (spotIds.length === 0) {
        setAvailableAddons([]);
        return;
      }

      // Načíst dostupné doplňky pro vybraná místa
      const { data: availabilityData, error: availabilityError } = await supabase
        .from("addon_availability")
        .select("addon_id")
        .in("spot_id", spotIds);

      if (availabilityError) throw availabilityError;

      const addonIds = Array.from(new Set(availabilityData?.map((a) => a.addon_id) || []));

      if (addonIds.length === 0) {
        setAvailableAddons([]);
        return;
      }

      // Načíst detail doplňků
      const { data: addonsData, error: addonsError } = await supabase
        .from("addons")
        .select("*")
        .in("id", addonIds)
        .eq("is_active", true)
        .order("name");

      if (addonsError) throw addonsError;

      setAvailableAddons(addonsData || []);
    } catch (error) {
      console.error("Error loading addons:", error);
      setAvailableAddons([]);
    } finally {
      setLoadingAddons(false);
    }
  };

  const calculateReservationPriceAsync = async () => {
    if (!dateRange.from || !dateRange.to) return;

    setIsCalculating(true);
    try {
      const { calculatePrice } = await import("@/lib/pricing");
      const diffTime = Math.abs(dateRange.to.getTime() - dateRange.from.getTime());
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const basePrice = await calculatePrice(days);
      
      // Přičíst ceny doplňků
      let addonsPrice = 0;
      selectedAddons.forEach((addonId) => {
        const addon = availableAddons.find((a) => a.id === addonId);
        if (addon) {
          addonsPrice += addon.price_per_day * days;
        }
      });

      setCalculatedPrice((basePrice * fishermanCount) + addonsPrice);
    } catch (error) {
      console.error("Error calculating price:", error);
      setCalculatedPrice(500 * fishermanCount); // Fallback cena
    } finally {
      setIsCalculating(false);
    }
  };

  const toggleAddon = (addonId: number) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId)
        ? prev.filter((id) => id !== addonId)
        : [...prev, addonId]
    );
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

      if (result.success && result.reservations) {
        // Uložit vybrané doplňky
        if (selectedAddons.length > 0 && result.reservations.length > 0) {
          const days = Math.ceil(Math.abs(dateRange.to!.getTime() - dateRange.from!.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          
          const addonRecords = [];
          for (const reservation of result.reservations) {
            for (const addonId of selectedAddons) {
              const addon = availableAddons.find((a) => a.id === addonId);
              if (addon) {
                addonRecords.push({
                  reservation_id: reservation.id,
                  addon_id: addonId,
                  quantity: 1,
                  price_per_day: addon.price_per_day,
                  total_price: addon.price_per_day * days,
                });
              }
            }
          }

          if (addonRecords.length > 0) {
            const { error: addonsError } = await supabase
              .from("reservation_addons")
              .insert(addonRecords);

            if (addonsError) {
              console.error("Error saving addons:", addonsError);
            }
          }
        }

        setSubmitStatus({
          type: "success",
          message: "Rezervace byla úspěšně odeslána! Brzy vás budeme kontaktovat.",
        });
        
        // Reset formuláře
        setName("");
        setEmail("");
        setPhone("");
        setNotes("");
        setSelectedAddons([]);
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

            {/* Doplňkové položky */}
            {availableAddons.length > 0 && (
              <div className="border-2 border-[#3d5a43] rounded-lg overflow-hidden">
                <div className="bg-[#3d5a43] text-white px-4 py-3">
                  <h3 className="font-bold uppercase tracking-wide flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Doplňkové služby (volitelné)
                  </h3>
                  <p className="text-sm text-white/90 mt-1">
                    Vyberte si placené doplňky pro větší pohodlí
                  </p>
                </div>
                <div className="p-4 space-y-3">
                  {loadingAddons ? (
                    <p className="text-sm text-gray-500 text-center py-4">Načítám dostupné doplňky...</p>
                  ) : (
                    availableAddons.map((addon) => {
                      const isSelected = selectedAddons.includes(addon.id);
                      const days = dateRange.from && dateRange.to 
                        ? Math.ceil(Math.abs(dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1
                        : 1;
                      const addonTotal = addon.price_per_day * days;

                      return (
                        <div
                          key={addon.id}
                          className={`border-2 rounded-lg p-3 transition-all cursor-pointer ${
                            isSelected
                              ? "border-[#3d5a43] bg-green-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => toggleAddon(addon.id)}
                        >
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 pt-1">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleAddon(addon.id)}
                                className="mt-1"
                              />
                            </div>
                            {addon.image_url && (
                              <div className="w-16 h-16 flex-shrink-0">
                                <img
                                  src={addon.image_url}
                                  alt={addon.name}
                                  className="w-full h-full object-cover rounded"
                                />
                              </div>
                            )}
                            <div className="flex-1">
                              <h4 className="font-bold text-[#2a3d32]">{addon.name}</h4>
                              {addon.description && (
                                <p className="text-sm text-gray-600 mt-1">{addon.description}</p>
                              )}
                              <div className="mt-2 flex items-center gap-3 text-sm">
                                <span className="font-semibold text-[#3d5a43]">
                                  {addon.price_per_day.toLocaleString("cs-CZ")} Kč/den
                                </span>
                                {days > 1 && (
                                  <span className="text-gray-600">
                                    • Celkem: {addonTotal.toLocaleString("cs-CZ")} Kč ({days} {days === 1 ? "den" : days < 5 ? "dny" : "dní"})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
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