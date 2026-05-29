import { supabase } from "@/lib/supabase";

export interface SpotAvailability {
  spotNumber: number;
  available: number;
  total: number;
  x: number;
  y: number;
}

export interface ReservationSuggestion {
  spots: number[];
  isOptimal: boolean;
  message: string;
  type: "perfect" | "adjacent" | "separated";
}

// Definice sousednosti míst podle mapy (místa vedle sebe)
const adjacentSpots: Record<number, number[]> = {
  1: [2, 13],
  2: [1, 3],
  3: [2, 4],
  4: [3, 5],
  5: [4, 6],
  6: [5, 7],
  7: [6, 8],
  8: [7, 9],
  9: [8, 10],
  10: [9, 11],
  11: [10, 12],
  12: [11, 13],
  13: [12, 1],
};

/**
 * Získá dostupnost všech míst pro dané období
 */
export async function getSpotAvailability(
  startDate: Date,
  endDate: Date
): Promise<SpotAvailability[]> {
  try {
    // Získat všechna místa a jejich pozice
    const { data: spots, error: spotsError } = await supabase
      .from("fishing_spots")
      .select("*, spot_positions(*)");

    if (spotsError) throw spotsError;

    // Získat všechny rezervace v daném období
    const { data: reservations, error: resError } = await supabase
      .from("reservations")
      .select("*")
      .neq("status", "cancelled")
      .or(`start_date.lte.${endDate.toISOString()},end_date.gte.${startDate.toISOString()}`);

    if (resError) throw resError;

    // Spočítat dostupnost pro každé místo
    const availability: SpotAvailability[] = spots?.map((spot) => {
      const positions = spot.spot_positions || [];
      const totalPositions = positions.length;

      // Najít všechny rezervace pro toto místo v daném období
      const spotReservations = reservations?.filter(
        (res) => res.spot_id === spot.id
      ) || [];

      // Spočítat kolik pozic je obsazených
      const occupiedPositions = new Set(
        spotReservations.map((res) => res.position_id)
      ).size;

      return {
        spotNumber: spot.number,
        available: totalPositions - occupiedPositions,
        total: totalPositions,
        x: spot.x_position || 0,
        y: spot.y_position || 0,
      };
    }) || [];

    return availability;
  } catch (error) {
    console.error("Error fetching availability:", error);
    return [];
  }
}

/**
 * Najde nejlepší kombinaci míst pro daný počet rybářů
 */
export function findBestSpotCombination(
  fishermanCount: number,
  availability: SpotAvailability[]
): ReservationSuggestion | null {
  // Pro 1-2 rybáře: najdi jedno místo s dostatečnou kapacitou
  if (fishermanCount <= 2) {
    const suitableSpot = availability.find(
      (spot) => spot.available >= fishermanCount
    );

    if (suitableSpot) {
      return {
        spots: [suitableSpot.spotNumber],
        isOptimal: true,
        message: `Místo ${suitableSpot.spotNumber} je volné pro ${fishermanCount} rybáře`,
        type: "perfect",
      };
    }

    return null;
  }

  // Pro 3 rybáře: hledáme ideálně místo pro 2 + sousední místo pro 1
  if (fishermanCount === 3) {
    // Hledáme místo s 2 volnými pozicemi
    const spotsWithTwo = availability.filter((spot) => spot.available === 2);

    for (const spot of spotsWithTwo) {
      // Kontrola sousedních míst
      const neighbors = adjacentSpots[spot.spotNumber] || [];
      const adjacentSpot = neighbors.find((neighborNum) => {
        const neighbor = availability.find((s) => s.spotNumber === neighborNum);
        return neighbor && neighbor.available >= 1;
      });

      if (adjacentSpot) {
        return {
          spots: [spot.spotNumber, adjacentSpot],
          isOptimal: true,
          message: `Místo ${spot.spotNumber} (2 rybáři) a sousední místo ${adjacentSpot} (1 rybář)`,
          type: "adjacent",
        };
      }
    }

    // Pokud nemáme sousední, nabídneme nejbližší dostupné
    const spotWith2 = availability.find((spot) => spot.available === 2);
    const spotWith1 = availability.find(
      (spot) => spot.available >= 1 && spot.spotNumber !== spotWith2?.spotNumber
    );

    if (spotWith2 && spotWith1) {
      return {
        spots: [spotWith2.spotNumber, spotWith1.spotNumber],
        isOptimal: false,
        message: `Místo ${spotWith2.spotNumber} (2 rybáři) a místo ${spotWith1.spotNumber} (1 rybář) - nejsou hned vedle sebe`,
        type: "separated",
      };
    }
  }

  return null;
}

/**
 * Vytvoří novou rezervaci
 */
export async function createReservation(
  spotNumbers: number[],
  fishermanCount: number,
  startDate: Date,
  endDate: Date,
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    notes?: string;
  }
) {
  try {
    // Pro každé místo vytvoříme rezervaci
    const reservations = [];

    for (const spotNumber of spotNumbers) {
      // Najít spot_id podle čísla
      const { data: spot } = await supabase
        .from("fishing_spots")
        .select("id, spot_positions(*)")
        .eq("number", spotNumber)
        .single();

      if (!spot) continue;

      // Určit kolik rybářů bude na tomto místě
      const fishermenOnThisSpot =
        spotNumbers.length === 1
          ? fishermanCount
          : spotNumber === spotNumbers[0]
          ? Math.min(fishermanCount, 2)
          : fishermanCount - 2;

      // Najít volné pozice
      const positions = spot.spot_positions.slice(0, fishermenOnThisSpot);

      for (const position of positions) {
        const { data, error } = await supabase
          .from("reservations")
          .insert({
            spot_id: spot.id,
            position_id: position.id,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            customer_name: customerInfo.name,
            customer_email: customerInfo.email,
            customer_phone: customerInfo.phone,
            notes: customerInfo.notes,
            status: "new",
          })
          .select()
          .single();

        if (error) throw error;
        reservations.push(data);
      }
    }

    return { success: true, reservations };
  } catch (error) {
    console.error("Error creating reservation:", error);
    return { success: false, error };
  }
}