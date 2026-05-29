import { supabase } from "@/lib/supabase";
import { startOfDay } from "date-fns";

export interface SpotAvailability {
  spotNumber: number;
  available: number;
  total: number;
  occupied: number;
  x: number;
  y: number;
}

export interface ReservationSuggestion {
  spots: number[];
  isOptimal: boolean;
  message: string;
  type: "single" | "adjacent" | "separated" | "none";
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
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);

  try {
    const { data: reservations, error } = await supabase
      .from("reservations")
      .select("spot_id, position_id, start_date, end_date, status")
      .lte("start_date", end.toISOString())
      .gte("end_date", start.toISOString())
      .in("status", ["new", "confirmed", "paid"]);

    if (error) throw error;

    // Inicializace dostupnosti všech 14 míst (2 pozice na místo)
    const totalSpots = 14;
    const availability: SpotAvailability[] = [];

    for (let spotNum = 1; spotNum <= totalSpots; spotNum++) {
      // Spočítat kolik pozic na tomto místě je obsazeno
      const occupiedPositions = new Set<number>();
      
      reservations?.forEach((res) => {
        if (res.spot_id === spotNum) {
          const resStart = startOfDay(new Date(res.start_date));
          const resEnd = startOfDay(new Date(res.end_date));
          
          // Zkontrolovat překryv dat
          if (resStart <= end && resEnd >= start) {
            occupiedPositions.add(res.position_id);
          }
        }
      });

      const availablePositions = 2 - occupiedPositions.size;

      availability.push({
        spotNumber: spotNum,
        available: availablePositions,
        total: 2,
        occupied: occupiedPositions.size,
        x: 0,
        y: 0,
      });
    }

    return availability;
  } catch (error) {
    console.error("Error getting spot availability:", error);
    throw error;
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
        type: "single",
      };
    }
    return {
      spots: [selectedSpot],
      isOptimal: false,
      message: `Místo ${selectedSpot} nemá dostatečnou kapacitu (volné: ${spot.available}, potřeba: ${fishermanCount})`,
      type: "separated",
    };
  }

  // Pro více rybářů - spočítat kolik míst potřebujeme
  const spotsNeeded = Math.ceil(fishermanCount / 2);
  
  if (spot.available < 2) {
    return {
      spots: [selectedSpot],
      isOptimal: false,
      message: `Místo ${selectedSpot} nemá dostatečnou kapacitu (volné pozice: ${spot.available})`,
      type: "separated",
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
      type: "adjacent",
    };
  } else {
    return {
      spots: [selectedSpot],
      isOptimal: false,
      message: `Vybrali jste místo ${selectedSpot} (2 rybáři). Pro ${fishermanCount} rybářů bohužel nejsou dostupná sousední místa.`,
      type: "separated",
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
  const totalSpots = availability.length;
  const requiredSpots = Math.ceil(fishermanCount / 2);

  // Pro 1 rybáře - všechna volná místa
  if (fishermanCount === 1) {
    for (const spot of availability) {
      if (spot.available >= 1) {
        combinations.push({
          spots: [spot.spotNumber],
          description: `Místo ${spot.spotNumber} (${spot.available} ${spot.available === 1 ? "pozice" : "pozice"})`,
          isOptimal: true,
        });
      }
    }
    return combinations;
  }

  // Pro 2 rybáře
  if (fishermanCount === 2) {
    // Plně volná jednotlivá místa
    for (const spot of availability) {
      if (spot.available === 2) {
        combinations.push({
          spots: [spot.spotNumber],
          description: `Místo ${spot.spotNumber} (2 rybáři)`,
          isOptimal: true,
        });
      }
    }

    // Sousední místa s alespoň 1 pozicí
    for (let i = 0; i < totalSpots - 1; i++) {
      const spot1 = availability[i];
      const spot2 = availability[i + 1];

      if (
        Math.abs(spot1.spotNumber - spot2.spotNumber) === 1 &&
        spot1.available >= 1 &&
        spot2.available >= 1
      ) {
        combinations.push({
          spots: [spot1.spotNumber, spot2.spotNumber],
          description: `Místa ${spot1.spotNumber}+${spot2.spotNumber} (sousední)`,
          isOptimal: true,
        });
      }
    }

    // Pokud nejsou žádné sousední kombinace, přidat nesousední
    if (combinations.length === 0) {
      const availableSpots = availability.filter(s => s.available >= 1);
      for (let i = 0; i < availableSpots.length - 1; i++) {
        for (let j = i + 1; j < availableSpots.length; j++) {
          const spot1 = availableSpots[i];
          const spot2 = availableSpots[j];
          
          combinations.push({
            spots: [spot1.spotNumber, spot2.spotNumber],
            description: `Místa ${spot1.spotNumber}+${spot2.spotNumber} (s odstupem)`,
            isOptimal: false,
          });
        }
      }
    }

    return combinations;
  }

  // Pro 3+ rybářů
  // Nejdřív hledat sousední kombinace
  for (let i = 0; i <= totalSpots - requiredSpots; i++) {
    const spots: number[] = [];
    let totalCapacity = 0;
    let allAdjacent = true;

    for (let j = 0; j < requiredSpots; j++) {
      const spot = availability[i + j];
      if (spot.available === 0) {
        allAdjacent = false;
        break;
      }

      if (j > 0 && Math.abs(spot.spotNumber - spots[spots.length - 1]) !== 1) {
        allAdjacent = false;
        break;
      }

      spots.push(spot.spotNumber);
      totalCapacity += spot.available;
    }

    if (allAdjacent && totalCapacity >= fishermanCount) {
      combinations.push({
        spots,
        description: `${spots.length === 1 ? "Místo" : "Místa"} ${spots.join("+")} (${totalCapacity} pozic, souvislé)`,
        isOptimal: true,
      });
    }
  }

  // Pokud nejsou sousední kombinace, najít nesousední
  if (combinations.length === 0) {
    const availableSpots = availability
      .filter((s) => s.available > 0)
      .sort((a, b) => b.available - a.available);

    // Vygenerovat možné kombinace míst
    const generateCombinations = (
      spots: SpotAvailability[],
      needed: number,
      start: number = 0,
      current: number[] = []
    ): number[][] => {
      if (needed <= 0) return [current];
      if (start >= spots.length) return [];

      const results: number[][] = [];
      for (let i = start; i < spots.length; i++) {
        const spot = spots[i];
        const newCurrent = [...current, spot.spotNumber];
        const newNeeded = needed - spot.available;

        if (newNeeded <= 0) {
          results.push(newCurrent);
        } else {
          results.push(...generateCombinations(spots, newNeeded, i + 1, newCurrent));
        }
      }
      return results;
    };

    const possibleCombinations = generateCombinations(availableSpots, fishermanCount);

    // Omezit na první 10 kombinací
    for (const combo of possibleCombinations.slice(0, 10)) {
      const totalCap = combo.reduce((sum, spotNum) => {
        const spot = availability.find(s => s.spotNumber === spotNum);
        return sum + (spot?.available || 0);
      }, 0);

      combinations.push({
        spots: combo.sort((a, b) => a - b),
        description: `Místa ${combo.sort((a, b) => a - b).join("+")} (${totalCap} pozic, s odstupem)`,
        isOptimal: false,
      });
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
  const totalSpots = availability.length;
  
  // Pro 1 rybáře - najít první volné místo
  if (fishermanCount === 1) {
    for (const spot of availability) {
      if (spot.available >= 1) {
        return {
          spots: [spot.spotNumber],
          isOptimal: true,
          message: `Nalezeno volné místo #${spot.spotNumber}`,
          type: "single",
        };
      }
    }
    return {
      spots: [],
      isOptimal: false,
      message: "Pro vybraný termín a počet rybářů nejsou dostupná žádná volná místa.",
      type: "none",
    };
  }

  // Pro 2 rybáře - preferovat jedno plné místo
  if (fishermanCount === 2) {
    // Nejdřív hledat jedno místo s 2 volnými pozicemi
    for (const spot of availability) {
      if (spot.available === 2) {
        return {
          spots: [spot.spotNumber],
          isOptimal: true,
          message: `Nalezeno plně volné místo #${spot.spotNumber} pro 2 rybáře`,
          type: "single",
        };
      }
    }

    // Pokud není, najít 2 sousední místa s alespoň 1 volnou pozicí
    for (let i = 0; i < totalSpots - 1; i++) {
      const spot1 = availability[i];
      const spot2 = availability[i + 1];

      if (
        Math.abs(spot1.spotNumber - spot2.spotNumber) === 1 &&
        spot1.available >= 1 &&
        spot2.available >= 1
      ) {
        return {
          spots: [spot1.spotNumber, spot2.spotNumber],
          isOptimal: true,
          message: `Nalezena 2 sousední místa #${spot1.spotNumber} a #${spot2.spotNumber}`,
          type: "adjacent",
        };
      }
    }

    // Pokud nejsou sousední, nabídnout libovolná 2 volná místa
    const availableSpots = availability.filter(s => s.available >= 1);
    if (availableSpots.length >= 2) {
      return {
        spots: availableSpots.slice(0, 2).map(s => s.spotNumber),
        isOptimal: false,
        message: `Máme volná místa, ale bohužel nebudete v těsné blízkosti. Máme pro vás místa #${availableSpots[0].spotNumber} a #${availableSpots[1].spotNumber}`,
        type: "separated",
      };
    }

    return {
      spots: [],
      isOptimal: false,
      message: "Pro vybraný termín a počet rybářů nejsou dostupná žádná volná místa.",
      type: "none",
    };
  }

  // Pro 3+ rybářů - hledat kombinace
  const requiredSpots = Math.ceil(fishermanCount / 2);

  // Nejdřív zkusit najít souvislé sousední místa
  for (let i = 0; i <= totalSpots - requiredSpots; i++) {
    const spots: number[] = [];
    let totalCapacity = 0;
    let allAdjacent = true;

    for (let j = 0; j < requiredSpots; j++) {
      const spot = availability[i + j];
      if (spot.available === 0) {
        allAdjacent = false;
        break;
      }

      // Zkontrolovat, zda jsou místa skutečně sousední
      if (j > 0 && Math.abs(spot.spotNumber - spots[spots.length - 1]) !== 1) {
        allAdjacent = false;
        break;
      }

      spots.push(spot.spotNumber);
      totalCapacity += spot.available;
    }

    if (allAdjacent && totalCapacity >= fishermanCount) {
      return {
        spots,
        isOptimal: true,
        message: `Nalezeno ${spots.length} souvislých sousedních míst #${spots.join(", #")}`,
        type: "adjacent",
      };
    }
  }

  // Pokud nejsou sousední místa, najít libovolnou kombinaci
  const availableSpots = availability
    .filter((s) => s.available > 0)
    .sort((a, b) => b.available - a.available);

  if (availableSpots.length > 0) {
    const spots: number[] = [];
    let totalCapacity = 0;

    for (const spot of availableSpots) {
      if (totalCapacity >= fishermanCount) break;
      spots.push(spot.spotNumber);
      totalCapacity += spot.available;
    }

    if (totalCapacity >= fishermanCount) {
      return {
        spots: spots.sort((a, b) => a - b),
        isOptimal: false,
        message: `Máme volná místa, ale bohužel nebudete v těsné blízkosti. Máme pro vás místa #${spots.sort((a, b) => a - b).join(", #")}`,
        type: "separated",
      };
    }
  }

  return {
    spots: [],
    isOptimal: false,
    message: "Pro vybraný termín a počet rybářů nejsou dostupná žádná volná místa.",
    type: "none",
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
  },
  price: number
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
            price: price,
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