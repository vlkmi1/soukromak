import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Save, Plus, Trash2, Package, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

const ADMIN_PIN = "1234";

interface Addon {
  id?: number;
  name: string;
  description?: string;
  image_url?: string;
  price_per_day: number;
  is_active: boolean;
  available_spots?: number[];
}

interface FishingSpot {
  id: number;
  number: number;
}

export default function AddonsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  
  const [addons, setAddons] = useState<Addon[]>([]);
  const [fishingSpots, setFishingSpots] = useState<FishingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteAddonId, setDeleteAddonId] = useState<number | null>(null);

  /**
   * Optimalizovat obrázek před uploadem
   * - Resize na max 800px šířku
   * - Komprese kvalita 85%
   */
  const optimizeImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      img.onload = () => {
        // Výpočet nových rozměrů (max šířka 800px)
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = (height * MAX_WIDTH) / width;
          width = MAX_WIDTH;
        }

        // Nastavit canvas rozměry
        canvas.width = width;
        canvas.height = height;

        // Vykreslit obrázek
        ctx?.drawImage(img, 0, 0, width, height);

        // Konvertovat na blob s kompresí
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Nepodařilo se optimalizovat obrázek"));
              return;
            }

            // Vytvořit nový File objekt
            const optimizedFile = new File(
              [blob],
              file.name.replace(/\.[^.]+$/, ".jpg"), // Změnit příponu na .jpg
              { type: "image/jpeg" }
            );

            resolve(optimizedFile);
          },
          "image/jpeg",
          0.85 // Kvalita 85%
        );
      };

      img.onerror = () => {
        reject(new Error("Nepodařilo se načíst obrázek"));
      };

      img.src = URL.createObjectURL(file);
    });
  };

  useEffect(() => {
    const checkAuth = () => {
      const authStatus = sessionStorage.getItem("adminAuthenticated");
      if (authStatus === "true") {
        setIsAuthenticated(true);
        loadData();
      } else {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem("adminAuthenticated", "true");
      setIsAuthenticated(true);
      setPinError(false);
      loadData();
    } else {
      setPinError(true);
      setPin("");
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Načíst doplňky
      const { data: addonsData, error: addonsError } = await supabase
        .from("addons")
        .select("*")
        .order("name");

      if (addonsError) throw addonsError;

      // Načíst vazby doplňků na místa
      const { data: availabilityData, error: availabilityError } = await supabase
        .from("addon_availability")
        .select("addon_id, spot_id");

      if (availabilityError) throw availabilityError;

      // Načíst lovná místa
      const { data: spotsData, error: spotsError } = await supabase
        .from("fishing_spots")
        .select("id, number")
        .order("number");

      if (spotsError) throw spotsError;

      // Spojit data - přidat available_spots k doplňkům
      const addonsWithSpots = (addonsData || []).map((addon) => ({
        ...addon,
        available_spots: (availabilityData || [])
          .filter((av) => av.addon_id === addon.id)
          .map((av) => av.spot_id),
      }));

      setAddons(addonsWithSpots);
      setFishingSpots(spotsData || []);
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se načíst data: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (addon?: Addon) => {
    setEditingAddon(
      addon || {
        name: "",
        description: "",
        image_url: "",
        price_per_day: 0,
        is_active: true,
        available_spots: [],
      }
    );
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validace typu souboru
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Chyba",
        description: "Vyberte prosím obrázek (PNG, JPG, WebP)",
        variant: "destructive",
      });
      return;
    }

    // Validace velikosti (max 5MB před optimalizací)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Chyba",
        description: "Obrázek je příliš velký (max 5MB)",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);
    try {
      // Optimalizovat obrázek
      toast({
        title: "Zpracovávám",
        description: "Optimalizuji obrázek...",
      });

      const optimizedFile = await optimizeImage(file);

      console.log("Original size:", file.size, "Optimized size:", optimizedFile.size);

      // Upload do Supabase Storage
      const fileExt = "jpg"; // Vždy jpg po optimalizaci
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `addons/${fileName}`;

      // Nejdřív zkontrolovat jestli bucket existuje, pokud ne, vytvořit
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some((b) => b.name === "addon-images");

      if (!bucketExists) {
        const { error: bucketError } = await supabase.storage.createBucket("addon-images", {
          public: true,
          fileSizeLimit: 2097152, // 2MB po optimalizaci
        });

        if (bucketError) {
          console.error("Error creating bucket:", bucketError);
          throw new Error("Nepodařilo se vytvořit úložiště pro obrázky");
        }
      }

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("addon-images")
        .upload(filePath, optimizedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      // Získat veřejnou URL
      const { data: urlData } = supabase.storage
        .from("addon-images")
        .getPublicUrl(filePath);

      setFormData((prev) => ({
        ...prev,
        image_url: urlData.publicUrl,
      }));

      toast({
        title: "Úspěch",
        description: "Obrázek byl úspěšně nahrán a optimalizován",
      });
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast({
        title: "Chyba při nahrávání",
        description: error.message || "Nepodařilo se nahrát obrázek",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveAddon = async () => {
    if (!editingAddon) return;

    setSaving(true);
    try {
      let addonId = editingAddon.id;

      if (addonId) {
        // Aktualizovat existující
        const { error } = await supabase
          .from("addons")
          .update({
            name: editingAddon.name,
            description: editingAddon.description,
            image_url: editingAddon.image_url,
            price_per_day: editingAddon.price_per_day,
            is_active: editingAddon.is_active,
          })
          .eq("id", addonId);

        if (error) throw error;
      } else {
        // Vytvořit nový
        const { data, error } = await supabase
          .from("addons")
          .insert({
            name: editingAddon.name,
            description: editingAddon.description,
            image_url: editingAddon.image_url,
            price_per_day: editingAddon.price_per_day,
            is_active: editingAddon.is_active,
          })
          .select()
          .single();

        if (error) throw error;
        addonId = data.id;
      }

      // Aktualizovat dostupnost na místech
      // Smazat staré vazby
      await supabase
        .from("addon_availability")
        .delete()
        .eq("addon_id", addonId);

      // Vložit nové vazby
      if (editingAddon.available_spots && editingAddon.available_spots.length > 0) {
        const availabilityRecords = editingAddon.available_spots.map((spotId) => ({
          addon_id: addonId,
          spot_id: spotId,
        }));

        const { error: availabilityError } = await supabase
          .from("addon_availability")
          .insert(availabilityRecords);

        if (availabilityError) throw availabilityError;
      }

      toast({
        title: "Uloženo",
        description: "Doplněk byl úspěšně uložen.",
      });

      setIsModalOpen(false);
      setEditingAddon(null);
      loadData();
    } catch (error: any) {
      console.error("Error saving addon:", error);
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se uložit doplněk.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddon = async (id: number) => {
    if (!confirm("Opravdu chcete smazat tento doplněk?")) return;

    try {
      const { error } = await supabase
        .from("addons")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Smazáno",
        description: "Doplněk byl odstraněn.",
      });

      loadData();
    } catch (error: any) {
      console.error("Error deleting addon:", error);
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se smazat doplněk.",
        variant: "destructive",
      });
    }
  };

  const toggleSpotAvailability = (spotId: number) => {
    setEditingAddon((prev) => {
      if (!prev) return null;
      const spots = prev.available_spots || [];
      const isSelected = spots.includes(spotId);
      return {
        ...prev,
        available_spots: isSelected
          ? spots.filter((id) => id !== spotId)
          : [...spots, spotId],
      };
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center p-8">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Admin přístup</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePinSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="pin">Zadejte PIN</Label>
                  <Input
                    id="pin"
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="****"
                    autoFocus
                  />
                </div>
                {pinError && (
                  <Alert variant="destructive">
                    <AlertDescription>Nesprávný PIN</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full">
                  Přihlásit
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 py-12">
        <div className="container max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Button
                variant="ghost"
                onClick={() => router.push("/admin")}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zpět na admin
              </Button>
              <h1 className="text-4xl font-bold text-[#2a3d32] uppercase tracking-wide">
                Správa doplňků
              </h1>
              <p className="text-gray-600 mt-2">
                Doplňkové placené položky nabízené při rezervaci
              </p>
            </div>
            <Package className="h-16 w-16 text-[#3d5a43]" />
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Načítám doplňky...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-end">
                <Button
                  onClick={() => handleOpenModal()}
                  className="bg-[#3d5a43] hover:bg-[#4a6850]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Přidat doplněk
                </Button>
              </div>

              {addons.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    Zatím nejsou přidány žádné doplňky. Klikněte na tlačítko výše pro přidání prvního doplňku.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {addons.map((addon) => (
                    <Card key={addon.id}>
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          {addon.image_url ? (
                            <div className="w-24 h-24 flex-shrink-0">
                              <img
                                src={addon.image_url}
                                alt={addon.name}
                                className="w-full h-full object-cover rounded"
                              />
                            </div>
                          ) : (
                            <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded flex items-center justify-center">
                              <Package className="h-8 w-8 text-gray-400" />
                            </div>
                          )}

                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-[#2a3d32]">
                              {addon.name}
                              {!addon.is_active && (
                                <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                                  Neaktivní
                                </span>
                              )}
                            </h3>
                            {addon.description && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {addon.description}
                              </p>
                            )}
                            <p className="text-lg font-bold text-[#3d5a43] mt-2">
                              {addon.price_per_day.toLocaleString("cs-CZ")} Kč/den
                            </p>
                            {addon.available_spots && addon.available_spots.length > 0 ? (
                              <p className="text-xs text-gray-500 mt-1">
                                Dostupné na místech: {fishingSpots
                                  .filter((s) => addon.available_spots!.includes(s.id))
                                  .map((s) => `#${s.number}`)
                                  .join(", ")}
                              </p>
                            ) : (
                              <p className="text-xs text-amber-600 mt-1">
                                ⚠️ Není přiřazeno k žádnému místu
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenModal(addon)}
                            className="flex-1"
                          >
                            Upravit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addon.id && handleDeleteAddon(addon.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Modal pro úpravu/přidání doplňku */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAddon?.id ? "Upravit doplněk" : "Přidat nový doplněk"}
            </DialogTitle>
          </DialogHeader>

          {editingAddon && (
            <div className="space-y-4 py-4">
              {/* Obrázek */}
              <div>
                <Label>Obrázek (volitelné)</Label>
                {editingAddon.image_url ? (
                  <div className="mt-2 relative">
                    <img
                      src={editingAddon.image_url}
                      alt="Náhled"
                      className="w-full h-48 object-cover rounded"
                    />
                    <button
                      onClick={() => setEditingAddon({ ...editingAddon, image_url: "" })}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="mt-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                    {uploadingImage && (
                      <p className="text-sm text-gray-500 mt-1">Nahrávám...</p>
                    )}
                  </div>
                )}
              </div>

              {/* Název */}
              <div>
                <Label htmlFor="addon-name">Název *</Label>
                <Input
                  id="addon-name"
                  value={editingAddon.name}
                  onChange={(e) =>
                    setEditingAddon({ ...editingAddon, name: e.target.value })
                  }
                  placeholder="Např. Loďka, Přístřešek, Gril..."
                  required
                />
              </div>

              {/* Popis */}
              <div>
                <Label htmlFor="addon-description">Popis (volitelné)</Label>
                <Textarea
                  id="addon-description"
                  value={editingAddon.description || ""}
                  onChange={(e) =>
                    setEditingAddon({ ...editingAddon, description: e.target.value })
                  }
                  placeholder="Krátký popis doplňku..."
                  rows={3}
                />
              </div>

              {/* Cena */}
              <div>
                <Label htmlFor="addon-price">Cena za den (Kč) *</Label>
                <Input
                  id="addon-price"
                  type="number"
                  step="0.01"
                  value={editingAddon.price_per_day}
                  onChange={(e) =>
                    setEditingAddon({
                      ...editingAddon,
                      price_per_day: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  required
                />
              </div>

              {/* Dostupnost na místech */}
              <div>
                <Label className="mb-2 block">Dostupnost na lovných místech *</Label>
                <div className="border border-gray-200 rounded p-4 max-h-48 overflow-y-auto">
                  {fishingSpots.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Nejsou definována žádná lovná místa
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {fishingSpots.map((spot) => (
                        <div key={spot.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`spot-${spot.id}`}
                            checked={
                              editingAddon.available_spots?.includes(spot.id) || false
                            }
                            onCheckedChange={() => toggleSpotAvailability(spot.id)}
                          />
                          <label
                            htmlFor={`spot-${spot.id}`}
                            className="text-sm cursor-pointer"
                          >
                            Místo #{spot.number}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {editingAddon.available_spots && editingAddon.available_spots.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ Vyberte alespoň jedno místo kde bude doplněk dostupný
                  </p>
                )}
              </div>

              {/* Aktivní */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="addon-active"
                  checked={editingAddon.is_active}
                  onCheckedChange={(checked) =>
                    setEditingAddon({ ...editingAddon, is_active: !!checked })
                  }
                />
                <label htmlFor="addon-active" className="text-sm cursor-pointer">
                  Aktivní doplněk (zobrazovat při rezervacích)
                </label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setEditingAddon(null);
              }}
            >
              Zrušit
            </Button>
            <Button
              onClick={handleSaveAddon}
              disabled={
                saving ||
                !editingAddon?.name ||
                !editingAddon.available_spots ||
                editingAddon.available_spots.length === 0
              }
              className="bg-[#3d5a43] hover:bg-[#4a6850]"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Ukládám..." : "Uložit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}