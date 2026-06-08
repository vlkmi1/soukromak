import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cs } from "date-fns/locale";
import { MessageCircle, X, Calendar as CalendarIcon, Users, ChevronRight, Send } from "lucide-react";
import { format, addDays } from "date-fns";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabase";
import { findBestSpotCombination } from "@/services/reservationService";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  type: "bot" | "user";
  content: string;
  timestamp: Date;
}

type ConversationState =
  | "greeting"
  | "asking_dates"
  | "asking_count"
  | "asking_together"
  | "searching"
  | "recommending"
  | "asking_action"
  | "asking_name"
  | "asking_phone"
  | "asking_email"
  | "confirming"
  | "done";

interface SpotStats {
  spot_number: number;
  reservation_count: number;
}

export function Chatbot() {
  const router = useRouter();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [state, setState] = useState<ConversationState>("greeting");
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [fishermanCount, setFishermanCount] = useState<number>(1);
  const [wantTogether, setWantTogether] = useState<boolean | null>(null);
  const [recommendedSpots, setRecommendedSpots] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [textInput, setTextInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      addBotMessage(
        "Dobrý den! 👋 Jsem váš rezervační asistent. Pomohu vám najít volné místo na rybníku. Kdy byste chtěli přijet rybařit?"
      );
      setState("asking_dates");
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addBotMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: "bot",
        content,
        timestamp: new Date(),
      },
    ]);
  };

  const addUserMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: "user",
        content,
        timestamp: new Date(),
      },
    ]);
  };

  const handleDateSelect = (dates: Date[] | undefined) => {
    if (!dates || dates.length === 0) return;

    setSelectedDates(dates);
    setShowCalendar(false);

    const dateStrings = dates
      .map((d) => format(d, "d.M.yyyy", { locale: cs }))
      .join(", ");
    addUserMessage(`Vybrané dny: ${dateStrings}`);

    addBotMessage("Výborně! Kolik rybářů bude?");
    setState("asking_count");
  };

  const handleCountSelect = (count: number) => {
    setFishermanCount(count);
    addUserMessage(`${count} ${count === 1 ? "rybář" : count < 5 ? "rybáři" : "rybářů"}`);

    if (count === 1) {
      setWantTogether(false);
      searchSpots(count, false);
    } else {
      addBotMessage("Chtěli byste být všichni rybáři pohromadě na sousedních místech?");
      setState("asking_together");
    }
  };

  const handleTogetherSelect = (together: boolean) => {
    setWantTogether(together);
    addUserMessage(together ? "Ano, chceme být pohromadě" : "Ne, lze i rozptýlit");
    searchSpots(fishermanCount, together);
  };

  const searchSpots = async (count: number, together: boolean) => {
    setState("searching");
    addBotMessage("Hledám nejlepší volná místa... 🔍");

    try {
      // Načíst statistiku nejoblíbenějších míst
      const { data: stats } = await supabase
        .from("reservations")
        .select("spot_number")
        .eq("status", "confirmed")
        .order("spot_number");

      const spotStats: Record<number, number> = {};
      stats?.forEach((r: any) => {
        spotStats[r.spot_number] = (spotStats[r.spot_number] || 0) + 1;
      });

      // Pro každý den najít nejlepší kombinaci
      const allRecommendations = [];
      
      for (const date of selectedDates) {
        const result = await findBestSpotCombination(date, count, together);
        
        if (result.available) {
          // Seřadit podle popularity (nejvíc rezervací = nejoblíbenější)
          const sortedSpots = result.spots.sort((a: number, b: number) => {
            const aCount = spotStats[a] || 0;
            const bCount = spotStats[b] || 0;
            return bCount - aCount; // Sestupně
          });

          allRecommendations.push({
            date,
            spots: sortedSpots,
            popularity: sortedSpots.map((s: number) => spotStats[s] || 0),
          });
        }
      }

      setRecommendedSpots(allRecommendations);

      if (allRecommendations.length > 0) {
        let message = "Skvělé! Našel jsem pro vás volná místa:\n\n";
        
        allRecommendations.forEach((rec: any) => {
          const dateStr = format(rec.date, "d.M.yyyy", { locale: cs });
          const spotsStr = rec.spots.join(", ");
          const popularityInfo = rec.popularity[0] > 0 
            ? ` (⭐ Nejoblíbenější místa podle statistik)`
            : "";
          
          message += `📅 ${dateStr}: Místa ${spotsStr}${popularityInfo}\n`;
        });

        message += "\nCo chcete udělat dál?";
        addBotMessage(message);
        setState("asking_action");
      } else {
        addBotMessage(
          "Bohužel pro váš požadavek nejsou momentálně žádná volná místa. Zkuste prosím jiný termín nebo počet rybářů."
        );
        setState("done");
      }
    } catch (error) {
      console.error("Error searching spots:", error);
      addBotMessage(
        "Omlouváme se, nastala chyba při hledání míst. Zkuste to prosím znovu."
      );
      setState("done");
    }
  };

  const handleActionSelect = (action: "redirect" | "direct") => {
    if (action === "redirect") {
      addUserMessage("Pokračovat k rezervaci");
      const dates = selectedDates.map((d) => format(d, "yyyy-MM-dd")).join(",");
      router.push(`/rezervace?dates=${dates}&count=${fishermanCount}`);
    } else {
      addUserMessage("Odeslat rezervaci rovnou");
      addBotMessage("Výborně! Pro dokončení rezervace potřebuji vaše kontaktní údaje. Jak se jmenujete?");
      setState("asking_name");
    }
  };

  const handleNameSubmit = () => {
    if (textInput.trim()) {
      setCustomerName(textInput.trim());
      addUserMessage(textInput.trim());
      setTextInput("");
      addBotMessage("Jaké je vaše telefonní číslo?");
      setState("asking_phone");
    }
  };

  const handlePhoneSubmit = () => {
    if (textInput.trim()) {
      setCustomerPhone(textInput.trim());
      addUserMessage(textInput.trim());
      setTextInput("");
      addBotMessage("A poslední - váš email pro potvrzení?");
      setState("asking_email");
    }
  };

  const handleEmailSubmit = async () => {
    if (textInput.trim()) {
      setCustomerEmail(textInput.trim());
      addUserMessage(textInput.trim());
      setTextInput("");
      
      setState("confirming");
      addBotMessage("Moment, odesílám vaši rezervaci... ⏳");

      try {
        // Uložit rezervace do databáze
        const reservations = [];
        for (const rec of recommendedSpots) {
          for (const spotNumber of rec.spots) {
            reservations.push({
              date: format(rec.date, "yyyy-MM-dd"),
              spot_number: spotNumber,
              customer_name: customerName,
              customer_email: textInput.trim(),
              customer_phone: customerPhone,
              fisherman_count: fishermanCount,
              status: "new",
              created_at: new Date().toISOString(),
            });
          }
        }

        const { error } = await supabase.from("reservations").insert(reservations);

        if (error) throw error;

        // Odeslat email (TODO: implementovat email service)
        addBotMessage(
          `✅ Hotovo! Vaše rezervace byla úspěšně odeslána.\n\nPotvrzení jsme odeslali na email ${textInput.trim()}.\n\nČekáme na vás u rybníku! 🎣`
        );
        
        toast({
          title: "Rezervace vytvořena",
          description: "Potvrzovací email byl odeslán.",
        });

        setState("done");
      } catch (error) {
        console.error("Error creating reservation:", error);
        addBotMessage(
          "Bohužel nastala chyba při vytváření rezervace. Kontaktujte nás prosím telefonicky nebo zkuste znovu později."
        );
        setState("done");
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (state === "asking_name") {
        handleNameSubmit();
      } else if (state === "asking_phone") {
        handlePhoneSubmit();
      } else if (state === "asking_email") {
        handleEmailSubmit();
      }
    }
  };

  const handleRestart = () => {
    setMessages([]);
    setState("greeting");
    setSelectedDates([]);
    setFishermanCount(1);
    setWantTogether(null);
    setRecommendedSpots([]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setTextInput("");
    setShowCalendar(false);
  };

  return (
    <>
      {/* Chat okno */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] bg-white border-2 border-gray-300 rounded-lg shadow-2xl z-50 flex flex-col max-h-[600px]">
          {/* Header */}
          <div className="bg-[#3d5a43] text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <MessageCircle className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></span>
              </div>
              <div>
                <span className="font-bold block">Rezervační asistent</span>
                <span className="text-xs text-green-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  Online
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-[#4a6850] rounded p-1 transition-colors"
              aria-label="Zavřít"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.type === "user"
                      ? "bg-[#3d5a43] text-white"
                      : "bg-white border border-gray-200 text-gray-800"
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{msg.content}</p>
                </div>
              </div>
            ))}

            {/* Kalendář */}
            {showCalendar && (
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <Calendar
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={handleDateSelect}
                  locale={cs}
                  disabled={(date) => date < new Date()}
                  className="rounded-md"
                />
              </div>
            )}

            {/* Tlačítka pro výběr počtu rybářů */}
            {state === "asking_count" && (
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6].map((count) => (
                  <Button
                    key={count}
                    onClick={() => handleCountSelect(count)}
                    variant="outline"
                    className="flex-1 min-w-[60px]"
                  >
                    {count}
                  </Button>
                ))}
              </div>
            )}

            {/* Tlačítka pro "pohromadě" */}
            {state === "asking_together" && (
              <div className="flex gap-2">
                <Button
                  onClick={() => handleTogetherSelect(true)}
                  className="flex-1 bg-[#3d5a43] hover:bg-[#4a6850]"
                >
                  Ano
                </Button>
                <Button
                  onClick={() => handleTogetherSelect(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Ne
                </Button>
              </div>
            )}

            {/* Tlačítka pro akci */}
            {state === "asking_action" && (
              <div className="space-y-2">
                <Button
                  onClick={() => handleActionSelect("redirect")}
                  className="w-full bg-[#3d5a43] hover:bg-[#4a6850] justify-between"
                >
                  Pokračovat k rezervaci
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => handleActionSelect("direct")}
                  variant="outline"
                  className="w-full justify-between border-[#3d5a43] text-[#3d5a43] hover:bg-[#3d5a43] hover:text-white"
                >
                  Odeslat rezervaci rovnou
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Input pro jméno, telefon, email */}
            {(state === "asking_name" || state === "asking_phone" || state === "asking_email") && (
              <div className="flex gap-2">
                <Input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    state === "asking_name"
                      ? "Vaše jméno..."
                      : state === "asking_phone"
                      ? "+420..."
                      : "email@example.com"
                  }
                  type={state === "asking_email" ? "email" : "text"}
                  className="flex-1"
                />
                <Button
                  onClick={
                    state === "asking_name"
                      ? handleNameSubmit
                      : state === "asking_phone"
                      ? handlePhoneSubmit
                      : handleEmailSubmit
                  }
                  className="bg-[#3d5a43] hover:bg-[#4a6850]"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 bg-white rounded-b-lg">
            {state === "asking_dates" && (
              <Button
                onClick={() => setShowCalendar(true)}
                variant="outline"
                className="w-full border-[#3d5a43] text-[#3d5a43] hover:bg-[#3d5a43] hover:text-white"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Vybrat dny v kalendáři
              </Button>
            )}

            {state === "done" && (
              <Button
                onClick={handleRestart}
                variant="outline"
                className="w-full border-[#3d5a43] text-[#3d5a43] hover:bg-[#3d5a43] hover:text-white"
              >
                Začít znovu
              </Button>
            )}

            <p className="text-xs text-center text-gray-500 mt-2">
              Rezervační asistent • Online
            </p>
          </div>
        </div>
      )}

      {/* Plovoucí tlačítko */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-[#3d5a43] hover:bg-[#4a6850] text-white rounded-full p-4 shadow-lg transition-all z-50 flex items-center gap-2"
          aria-label="Otevřít chatbota"
        >
          <div className="relative">
            <MessageCircle className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></span>
          </div>
          <span className="font-semibold">Potřebujete pomoc?</span>
        </button>
      )}
    </>
  );
}