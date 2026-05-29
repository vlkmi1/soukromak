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
  type: "perfect" | "adjacent" | "separated" | "manual_with_adjacent" | "manual_no_adjacent";
}

export interface SpotCombination {
  spots: number[];
  description: string;
  isOptimal: boolean;
}

// Definice sousednosti míst podle mapy (místa vedle sebe, číslované zprava doleva)
const adjacentSpots: Record<number, number[]> = {
  1: [2],      // vpravo nahoře
  2: [1, 3],
  3: [2, 4],
  4: [3, 5],
  5: [4, 6],
  6: [5, 7],
  7: [6, 8],
  8: [7, 9],   // dole uprostřed
  9: [8, 10],
  10: [9, 11],
  11: [10, 12],
  12: [11, 13],
  13: [12, 14],
  14: [13],    // vlevo nahoře
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

    if (spotsError) {
      console.error("Error fetching spots:", spotsError);
      throw spotsError;
    }

    console.log("Loaded spots from database:", spots);

    // Získat všechny rezervace v daném období
    const { data: reservations, error: resError } = await supabase
      .from("reservations")
      .select("*")
      .neq("status", "cancelled")
      .or(`start_date.lte.${endDate.toISOString()},end_date.gte.${startDate.toISOString()}`);

    if (resError) {
      console.error("Error fetching reservations:", resError);
      throw resError;
    }

    console.log("Loaded reservations:", reservations);

    // Spočítat dostupnost pro každé místo
    const availability: SpotAvailability[] = spots?.map((spot: any) => {
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
        spotNumber: spot.number || spot.id, // fallback na id pokud number neexistuje
        available: totalPositions - occupiedPositions,
        total: totalPositions,
        x: parseFloat(spot.x_position || spot.position_x || 0),
        y: parseFloat(spot.y_position || spot.position_y || 0),
      };
    }) || [];

    console.log("Calculated availability:", availability);

    return availability;
  } catch (error) {
    console.error("Error fetching availability:", error);
    return [];
  }
}

/**
 * Zkontroluje dostupnost sousedních míst pro manuálně vybrané místo
 */
export function checkAdjacentAvailability(
  selectedSpot: number,
  fishermanCount: number,
  availability: SpotAvailability[]
): ReservationSuggestion | null {
  const spot = availability.find((s) => s.spotNumber === selectedSpot);
  
  if (!spot) return null;

  // Pro 1-2 rybáře stačí jedno místo
  if (fishermanCount <= 2) {
    if (spot.available >= fishermanCount) {
      return {
        spots: [selectedSpot],
        isOptimal: true,
        message: `Místo ${selectedSpot} je volné pro ${fishermanCount} ${fishermanCount === 1 ? "rybáře" : "rybáře"}`,
        type: "perfect",
      };
    }
    return {
      spots: [selectedSpot],
      isOptimal: false,
      message: `Místo ${selectedSpot} nemá dostatečnou kapacitu (volné: ${spot.available}, potřeba: ${fishermanCount})`,
      type: "manual_no_adjacent",
    };
  }

  // Pro více rybářů - spočítat kolik míst potřebujeme
  const spotsNeeded = Math.ceil(fishermanCount / 2);
  
  if (spot.available < 2) {
    return {
      spots: [selectedSpot],
      isOptimal: false,
      message: `Místo ${selectedSpot} nemá dostatečnou kapacitu (volné pozice: ${spot.available})`,
      type: "manual_no_adjacent",
    };
  }

  // Pro 3+ rybáře - kontrola sousedních míst
  const neighbors = adjacentSpots[selectedSpot] || [];
  const availableNeighbors: number[] = [];

  for (const neighborNum of neighbors) {
    const neighbor = availability.find((s) => s.spotNumber === neighborNum);
    if (neighbor && neighbor.available >= 1) {
      availableNeighbors.push(neighborNum);
    }
  }

  if (availableNeighbors.length > 0) {
    const neighborsList = availableNeighbors.map(n => `#${n}`).join(" nebo ");
    const message = spotsNeeded === 2
      ? `Vybrali jste místo ${selectedSpot} (2 rybáři). Sousední místo ${neighborsList} je také volné pro ${fishermanCount}. rybáře.`
      : `Vybrali jste místo ${selectedSpot} (2 rybáři). Pro ${fishermanCount} rybářů potřebujete celkem ${spotsNeeded} míst. Zkontrolujte dostupnost dalších míst.`;
    
    return {
      spots: [selectedSpot, availableNeighbors[0]],
      isOptimal: spotsNeeded === 2,
      message,
      type: "manual_with_adjacent",
    };
  } else {
    return {
      spots: [selectedSpot],
      isOptimal: false,
      message: `Vybrali jste místo ${selectedSpot} (2 rybáři). Pro ${fishermanCount} rybářů bohužel nejsou dostupná sousední místa.`,
      type: "manual_no_adjacent",
    };
  }
}

/**
 * Najde VŠECHNY možné kombinace sousedních míst pro daný počet rybářů
 */
export function findAllPossibleCombinations(
  fishermanCount: number,
  availability: SpotAvailability[]
): SpotCombination[] {
  const combinations: SpotCombination[] = [];

  // Pro 1-2 rybáře: najdi všechna volná místa s dostatečnou kapacitou
  if (fishermanCount <= 2) {
    const suitableSpots = availability.filter(
      (spot) => spot.available >= fishermanCount
    );

    return suitableSpots.map((spot) => ({
      spots: [spot.spotNumber],
      description: `Místo ${spot.spotNumber} (${fishermanCount} ${fishermanCount === 1 ? "rybář" : "rybáři"})`,
      isOptimal: true,
    }));
  }

  // Spočítat kolik míst potřebujeme
  const spotsNeeded = Math.ceil(fishermanCount / 2);

  // Hledáme sousední místa v daném směru (direction: 1 = rostoucí, -1 = klesající)
  const findConsecutiveSpots = (startSpot: number, count: number, direction: 1 | -1): number[] | null => {
    const result: number[] = [startSpot];
    let current = startSpot;
    
    for (let i = 1; i < count; i++) {
      const neighbors = adjacentSpots[current] || [];
      
      // Hledat souseda ve správném směru
      const nextSpot = direction === 1 
        ? neighbors.find(n => n > current)  // rostoucí směr
        : neighbors.find(n => n < current); // klesající směr
      
      if (!nextSpot) return null;
      
      const spotData = availability.find(s => s.spotNumber === nextSpot);
      if (!spotData || spotData.available < 2) return null;
      
      result.push(nextSpot);
      current = nextSpot;
    }
    
    return result;
  };

  // Projít všechna místa a hledat sousední řetězce v OBOU směrech
  for (const spot of availability) {
    if (spot.available < 2) continue;
    
    // Zkusit rostoucí směr (1 → 2 → 3)
    const ascendingSpots = findConsecutiveSpots(spot.spotNumber, spotsNeeded, 1);
    if (ascendingSpots && ascendingSpots.length === spotsNeeded) {
      const sortedSpots = [...ascendingSpots].sort((a, b) => a - b);
      const isDuplicate = combinations.some(c => 
        JSON.stringify([...c.spots].sort((a, b) => a - b)) === JSON.stringify(sortedSpots)
      );
      
      if (!isDuplicate) {
        combinations.push({
          spots: ascendingSpots,
          description: `Místa ${ascendingSpots.join("+")} (${spotsNeeded} míst vedle sebe pro ${fishermanCount} rybářů)`,
          isOptimal: true,
        });
      }
    }
    
    // Zkusit klesající směr (14 → 13 → 12)
    const descendingSpots = findConsecutiveSpots(spot.spotNumber, spotsNeeded, -1);
    if (descendingSpots && descendingSpots.length === spotsNeeded) {
      const sortedSpots = [...descendingSpots].sort((a, b) => a - b);
      const isDuplicate = combinations.some(c => 
        JSON.stringify([...c.spots].sort((a, b) => a - b)) === JSON.stringify(sortedSpots)
      );
      
      if (!isDuplicate) {
        combinations.push({
          spots: descendingSpots,
          description: `Místa ${descendingSpots.join("+")} (${spotsNeeded} míst vedle sebe pro ${fishermanCount} rybářů)`,
          isOptimal: true,
        });
      }
    }
  }

  return combinations;
}

/**
 * Najde nejlepší kombinaci míst pro daný počet rybářů (pro automatický výběr)
 */
export function findBestSpotCombination(
  fishermanCount: number,
  availability: SpotAvailability[]
): ReservationSuggestion | null {
  const allCombinations = findAllPossibleCombinations(fishermanCount, availability);

  if (allCombinations.length === 0) {
    return {
      spots: [],
      isOptimal: false,
      message: "Pro vybraný termín a počet rybářů nejsou dostupná žádná vhodná místa.",
      type: "separated",
    };
  }

  if (allCombinations.length === 1) {
    const combo = allCombinations[0];
    return {
      spots: combo.spots,
      isOptimal: combo.isOptimal,
      message: combo.description,
      type: combo.isOptimal ? "perfect" : "separated",
    };
  }

  // Více možností
  const descriptions = allCombinations
    .slice(0, 5) // max 5 možností pro přehlednost
    .map((c) => c.description)
    .join(", ");

  return {
    spots: allCombinations[0].spots,
    isOptimal: true,
    message: `Nalezeno ${allCombinations.length} možností: ${descriptions}${allCombinations.length > 5 ? " a další..." : ""}`,
    type: "adjacent",
  };
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