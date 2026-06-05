import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { MessageCircle, X, Send, Calendar as CalendarIcon, Users, MapPin } from "lucide-react";
import { cs } from "date-fns/locale";
import { format, addDays, startOfDay } from "date-fns";
import { useRouter } from "next/router";
import { getSpotAvailability, findBestSpotCombination } from "@/services/reservationService";

type ChatMessage = {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: Date;
};

type ConversationState = "greeting" | "asking_dates" | "asking_count" | "asking_together" | "suggesting" | "completed";

export function Chatbot() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true); // Automaticky rozbaleno při načtení
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [state, setState] = useState<ConversationState>("greeting");
  const [userInput, setUserInput] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [fishermanCount, setFishermanCount] = useState<number>(1);
  const [wantTogether, setWantTogether] = useState<boolean | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addBotMessage("Dobrý den! 👋 Jsem váš asistent pro rezervace na rybníku soukromák. Rád vám pomohu najít volné místo.");
      setTimeout(() => {
        addBotMessage("Kdy byste chtěli přijet rybařit? Klikněte na tlačítko níže pro výběr data.");
        setState("asking_dates");
      }, 1000);
    }
  }, [isOpen]);

  const addBotMessage = (text: string) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      sender: "bot",
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);
  };

  const addUserMessage = (text: string) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);
  };

  const handleDateConfirm = async () => {
    if (selectedDates.length === 0) return;

    const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
    const dateText = sortedDates.length === 1
      ? format(sortedDates[0], "d. MMMM yyyy", { locale: cs })
      : `${format(sortedDates[0], "d. MMM", { locale: cs })} - ${format(sortedDates[sortedDates.length - 1], "d. MMM yyyy", { locale: cs })}`;
    
    addUserMessage(dateText);
    setShowCalendar(false);
    
    setTimeout(() => {
      addBotMessage("Výborně! Kolik vás bude rybařit?");
      setState("asking_count");
    }, 500);
  };

  const handleCountSubmit = (count: number) => {
    setFishermanCount(count);
    addUserMessage(`${count} ${count === 1 ? "rybář" : count < 5 ? "rybáři" : "rybářů"}`);
    
    setTimeout(() => {
      if (count > 1) {
        addBotMessage("Chcete být všichni pohromadě na sousedních místech?");
        setState("asking_together");
      } else {
        setWantTogether(false);
        findAndSuggestSpots();
      }
    }, 500);
  };

  const handleTogetherChoice = (together: boolean) => {
    setWantTogether(together);
    addUserMessage(together ? "Ano, chceme být pohromadě" : "Ne, můžeme být odděleně");
    
    setTimeout(() => {
      findAndSuggestSpots();
    }, 500);
  };

  const findAndSuggestSpots = async () => {
    setState("suggesting");
    addBotMessage("Moment, hledám pro vás nejlepší místa... 🔍");

    try {
      const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
      const startDate = sortedDates[0];
      const endDate = sortedDates[sortedDates.length - 1];

      const availability = await getSpotAvailability(startDate, endDate);
      const suggestion = findBestSpotCombination(fishermanCount, availability);

      setTimeout(() => {
        if (suggestion && suggestion.spots.length > 0) {
          let message = `Skvělé! Našel jsem pro vás ${suggestion.isOptimal ? "ideální" : "dostupná"} místa:\n\n`;
          message += `📍 **Lovná místa: ${suggestion.spots.map(s => `#${s}`).join(" + ")}**\n\n`;
          message += suggestion.message;
          
          addBotMessage(message);
          
          setTimeout(() => {
            addBotMessage("Chcete pokračovat k rezervaci?");
            setState("completed");
          }, 1000);
        } else {
          addBotMessage("Bohužel, pro vybrané období a počet rybářů nemáme k dispozici vhodná místa. Zkuste prosím jiný termín nebo méně rybářů.");
          setTimeout(() => {
            addBotMessage("Chcete zkusit jiný termín?");
            setState("completed");
          }, 1000);
        }
      }, 1500);
    } catch (error) {
      console.error("Error finding spots:", error);
      addBotMessage("Omlouváme se, došlo k chybě při hledání míst. Zkuste to prosím znovu.");
      setState("greeting");
    }
  };

  const handleReservationRedirect = () => {
    const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
    const params = new URLSearchParams({
      dates: sortedDates.map(d => format(d, "yyyy-MM-dd")).join(","),
      count: fishermanCount.toString(),
      together: wantTogether ? "true" : "false",
    });
    
    router.push(`/rezervace?${params.toString()}`);
  };

  const handleRestart = () => {
    setMessages([]);
    setSelectedDates([]);
    setFishermanCount(1);
    setWantTogether(null);
    setState("greeting");
    setShowCalendar(false);
  };

  return (
    <>
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
          <span className="font-semibold">Najdu vám volná másta?</span>
        </button>
      )}

      {/* Chatbot okno */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] bg-white border-2 border-[#3d5a43] rounded-lg shadow-2xl z-50 flex flex-col max-h-[600px]">
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
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.sender === "user"
                      ? "bg-[#3d5a43] text-white"
                      : "bg-white border border-gray-200"
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{msg.text}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {format(msg.timestamp, "HH:mm")}
                  </span>
                </div>
              </div>
            ))}
            
            {/* Kalendář */}
            {state === "asking_dates" && !showCalendar && (
              <div className="flex justify-start">
                <Button
                  onClick={() => setShowCalendar(true)}
                  className="bg-white text-[#3d5a43] border border-[#3d5a43] hover:bg-[#3d5a43] hover:text-white"
                  size="sm"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Vybrat datum
                </Button>
              </div>
            )}
            
            {showCalendar && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <Calendar
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={(dates) => {
                    if (dates) {
                      setSelectedDates(Array.isArray(dates) ? dates : [dates]);
                    }
                  }}
                  locale={cs}
                  disabled={(date) => date < new Date()}
                  className="rounded-md"
                />
                <div className="mt-3 flex gap-2">
                  <Button
                    onClick={handleDateConfirm}
                    disabled={selectedDates.length === 0}
                    className="flex-1 bg-[#3d5a43] hover:bg-[#4a6850]"
                    size="sm"
                  >
                    Potvrdit ({selectedDates.length})
                  </Button>
                  <Button
                    onClick={() => setShowCalendar(false)}
                    variant="outline"
                    size="sm"
                  >
                    Zrušit
                  </Button>
                </div>
              </div>
            )}

            {/* Počet rybářů */}
            {state === "asking_count" && (
              <div className="flex flex-wrap gap-2 justify-start">
                {[1, 2, 3, 4, 5, 6].map((count) => (
                  <Button
                    key={count}
                    onClick={() => handleCountSubmit(count)}
                    className="bg-white text-[#3d5a43] border border-[#3d5a43] hover:bg-[#3d5a43] hover:text-white"
                    size="sm"
                  >
                    <Users className="h-4 w-4 mr-1" />
                    {count}
                  </Button>
                ))}
              </div>
            )}

            {/* Pohromadě? */}
            {state === "asking_together" && (
              <div className="flex gap-2 justify-start">
                <Button
                  onClick={() => handleTogetherChoice(true)}
                  className="bg-white text-[#3d5a43] border border-[#3d5a43] hover:bg-[#3d5a43] hover:text-white"
                  size="sm"
                >
                  Ano, pohromadě
                </Button>
                <Button
                  onClick={() => handleTogetherChoice(false)}
                  className="bg-white text-[#3d5a43] border border-[#3d5a43] hover:bg-[#3d5a43] hover:text-white"
                  size="sm"
                >
                  Ne, můžeme být odděleně
                </Button>
              </div>
            )}

            {/* Pokračovat k rezervaci */}
            {state === "completed" && (
              <div className="flex flex-col gap-2 justify-start">
                <Button
                  onClick={handleReservationRedirect}
                  className="bg-[#3d5a43] hover:bg-[#4a6850] text-white"
                  size="sm"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Pokračovat k rezervaci
                </Button>
                <Button
                  onClick={handleRestart}
                  variant="outline"
                  size="sm"
                >
                  Začít znovu
                </Button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 bg-white rounded-b-lg">
            <p className="text-xs text-gray-500 text-center">
              Rezervační asistent • Online
            </p>
          </div>
        </div>
      )}
    </>
  );
}