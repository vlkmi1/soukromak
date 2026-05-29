import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PondMap } from "@/components/PondMap";
import { ReservationForm } from "@/components/ReservationForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Calendar } from "lucide-react";

export default function ReservationPage() {
  const [selectedSpotId, setSelectedSpotId] = useState<number | undefined>();
  const [selectedSpotName, setSelectedSpotName] = useState<string | undefined>();

  const handleSpotSelect = (spotId: number, spotName: string) => {
    setSelectedSpotId(spotId);
    setSelectedSpotName(spotName);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Rezervace lovného místa</h1>
            <p className="text-muted-foreground text-lg">
              Vyberte si volné místo na mapě rybníku a dokončete rezervaci
            </p>
          </div>

          <Tabs defaultValue="map" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="map" className="gap-2">
                <MapPin className="h-4 w-4" />
                Mapa míst
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <Calendar className="h-4 w-4" />
                Kalendář
              </TabsTrigger>
            </TabsList>

            <TabsContent value="map" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <PondMap onSpotSelect={handleSpotSelect} selectedSpotId={selectedSpotId} />
                </div>
                <div className="lg:col-span-1">
                  <ReservationForm 
                    selectedSpotId={selectedSpotId} 
                    selectedSpotName={selectedSpotName} 
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="calendar" className="mt-6">
              <div className="text-center py-12 text-muted-foreground">
                Kalendářový přehled bude dostupný brzy
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}