import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PondMap } from "@/components/PondMap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Calendar } from "lucide-react";

export default function ReservationPage() {
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
              <PondMap />
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