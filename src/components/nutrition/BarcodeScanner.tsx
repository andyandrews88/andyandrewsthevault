import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Camera,
  ScanLine,
  Search,
  Loader2,
  AlertCircle,
  Plus,
  X,
  Beef,
  Wheat,
  Droplets,
  Flame,
  Package,
} from 'lucide-react';
import { lookupBarcode, ScannedProduct } from '@/lib/openFoodFacts';
import { useMealBuilderStore, MealSlotType } from '@/stores/mealBuilderStore';
import { supabase } from '@/integrations/supabase/client';
import { CustomFoodForm } from './CustomFoodForm';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from 'sonner';

interface BarcodeScannerProps {
  onProductScanned?: (product: ScannedProduct) => void;
  mealSlot?: MealSlotType;
}

export function BarcodeScanner({ onProductScanned, mealSlot: externalSlot }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedProduct, setScannedProduct] = useState<ScannedProduct | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [failedBarcode, setFailedBarcode] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<MealSlotType>(externalSlot || 'snacks');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'barcode-scanner-container';

  const { addDiaryEntry } = useMealBuilderStore();

  // Sync external slot
  useEffect(() => {
    if (externalSlot) setSelectedSlot(externalSlot);
  }, [externalSlot]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // already stopped
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const handleBarcodeLookup = useCallback(async (barcode: string) => {
    setIsLoading(true);
    setError(null);
    setShowManualEntry(false);

    try {
      // 1. Check custom_foods DB first
      const { data: customFoods } = await supabase
        .from('custom_foods')
        .select('*')
        .eq('barcode', barcode)
        .limit(1);

      if (customFoods && customFoods.length > 0) {
        const cf = customFoods[0];
        const product: ScannedProduct = {
          barcode,
          name: cf.name,
          brand: cf.brand || undefined,
          servingSize: cf.serving_size,
          servingGrams: Number(cf.serving_grams),
          calories: Number(cf.calories),
          protein: Number(cf.protein),
          carbs: Number(cf.carbs),
          fats: Number(cf.fats),
          fiber: cf.fiber ? Number(cf.fiber) : undefined,
          imageUrl: cf.image_url || undefined,
        };
        setScannedProduct(product);
        setShowResultDialog(true);
        onProductScanned?.(product);
        setIsLoading(false);
        return;
      }

      // 2. Try Open Food Facts
      const product = await lookupBarcode(barcode);
      if (product) {
        setScannedProduct(product);
        setShowResultDialog(true);
        onProductScanned?.(product);
        setIsLoading(false);
        return;
      }

      // 3. Try Nutritionix UPC lookup
      try {
        const { data: session } = await supabase.auth.getSession();
        if (session?.session) {
          const { data: nxData } = await supabase.functions.invoke('nutritionix-search', {
            body: { action: 'upc', upc: barcode },
          });
          if (nxData?.food) {
            const nxFood = nxData.food;
            const product: ScannedProduct = {
              barcode: nxFood.barcode,
              name: nxFood.name,
              brand: nxFood.brand,
              servingSize: nxFood.servingSize,
              servingGrams: nxFood.servingGrams,
              calories: nxFood.calories,
              protein: nxFood.protein,
              carbs: nxFood.carbs,
              fats: nxFood.fats,
              fiber: nxFood.fiber,
              imageUrl: nxFood.imageUrl,
            };
            setScannedProduct(product);
            setShowResultDialog(true);
            onProductScanned?.(product);
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // Nutritionix lookup failed, continue to manual entry
      }

      // 4. All lookups failed — show manual entry
      setFailedBarcode(barcode);
      setShowManualEntry(true);
      setError(`Product not found for barcode: ${barcode}. Enter the details below to save it.`);
    } catch {
      setError('Failed to look up product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [onProductScanned]);

  const startScanner = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      stream.getTracks().forEach((track) => track.stop());

      setIsScanning(true);

      setTimeout(async () => {
        try {
          const html5QrCode = new Html5Qrcode(scannerContainerId);
          scannerRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 250, height: 100 } },
            async (decodedText) => {
              await stopScanner();
              handleBarcodeLookup(decodedText);
            },
            () => {}
          );
        } catch {
          setError('Scanner initialization failed. Try entering the barcode manually.');
          setIsScanning(false);
        }
      }, 100);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please grant camera permissions in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please enter the barcode manually.');
      } else {
        setError('Unable to access camera. Please enter the barcode manually.');
      }
      setIsScanning(false);
    }
  };

  const handleManualLookup = () => {
    if (manualBarcode.trim()) {
      handleBarcodeLookup(manualBarcode.trim());
    }
  };

  const handleAddToMeal = () => {
    if (scannedProduct) {
      addDiaryEntry(scannedProduct, selectedSlot, 1, 'piece');
      toast.success(`Added to ${selectedSlot}`);
      setShowResultDialog(false);
      setScannedProduct(null);
      setManualBarcode('');
    }
  };

  const handleScanAnother = () => {
    setShowResultDialog(false);
    setScannedProduct(null);
    setManualBarcode('');
    setShowManualEntry(false);
    setError(null);
  };

  const handleCustomFoodCreated = (food: any) => {
    const product: ScannedProduct = {
      barcode: food.barcode || failedBarcode,
      name: food.name,
      brand: food.brand,
      servingSize: food.servingSize,
      servingGrams: food.servingGrams,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
      fiber: food.fiber,
    };
    setScannedProduct(product);
    setShowManualEntry(false);
    setError(null);
    setShowResultDialog(true);
    onProductScanned?.(product);
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-primary" />
            Barcode Scanner
          </CardTitle>
          <CardDescription>
            Scan barcodes to get instant nutrition info
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Meal Slot Picker */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Add to:</span>
            <Select value={selectedSlot} onValueChange={(v) => setSelectedSlot(v as MealSlotType)}>
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
                <SelectItem value="snacks">Snacks</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Scanner View */}
          {isScanning && (
            <div className="relative rounded-lg overflow-hidden bg-background">
              <div id={scannerContainerId} className="w-full aspect-[4/3]" />
              <Button variant="outline" size="sm" className="absolute top-2 right-2 bg-background/80" onClick={stopScanner}>
                <X className="w-4 h-4 mr-1" /> Cancel
              </Button>
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <Badge variant="secondary" className="bg-background/80">Point camera at barcode</Badge>
              </div>
            </div>
          )}

          {!isScanning && (
            <Button onClick={startScanner} className="w-full gap-2" disabled={isLoading}>
              <Camera className="w-4 h-4" /> Open Camera Scanner
            </Button>
          )}

          {/* Manual Entry */}
          <div className="flex gap-2">
            <Input
              placeholder="Or enter barcode manually..."
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualLookup()}
            />
            <Button variant="outline" onClick={handleManualLookup} disabled={!manualBarcode.trim() || isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Looking up product...
            </div>
          )}

          {/* Manual Entry Form (shown when barcode not found) */}
          {showManualEntry && (
            <CustomFoodForm
              defaultBarcode={failedBarcode}
              onFoodCreated={handleCustomFoodCreated}
              onCancel={() => { setShowManualEntry(false); setError(null); }}
            />
          )}
        </CardContent>
      </Card>

      {/* Product Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" /> Product Found
            </DialogTitle>
            <DialogDescription>Review the nutrition information below</DialogDescription>
          </DialogHeader>

          {scannedProduct && (
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                {scannedProduct.imageUrl && (
                  <img src={scannedProduct.imageUrl} alt={scannedProduct.name} className="w-16 h-16 object-cover rounded-lg" />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate">{scannedProduct.name}</h4>
                  {scannedProduct.brand && <p className="text-sm text-muted-foreground">{scannedProduct.brand}</p>}
                  <Badge variant="outline" className="mt-1">{scannedProduct.servingSize}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <Flame className="w-4 h-4 mx-auto mb-1 text-orange-500" />
                  <p className="text-lg font-bold font-mono">{scannedProduct.calories}</p>
                  <p className="text-xs text-muted-foreground">cal</p>
                </div>
                <div className="text-center">
                  <Beef className="w-4 h-4 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold font-mono">{scannedProduct.protein}g</p>
                  <p className="text-xs text-muted-foreground">protein</p>
                </div>
                <div className="text-center">
                  <Wheat className="w-4 h-4 mx-auto mb-1 text-success" />
                  <p className="text-lg font-bold font-mono">{scannedProduct.carbs}g</p>
                  <p className="text-xs text-muted-foreground">carbs</p>
                </div>
                <div className="text-center">
                  <Droplets className="w-4 h-4 mx-auto mb-1 text-accent" />
                  <p className="text-lg font-bold font-mono">{scannedProduct.fats}g</p>
                  <p className="text-xs text-muted-foreground">fats</p>
                </div>
              </div>

              {/* Meal slot selector in result dialog */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Add to:</span>
                <Select value={selectedSlot} onValueChange={(v) => setSelectedSlot(v as MealSlotType)}>
                  <SelectTrigger className="w-[140px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="dinner">Dinner</SelectItem>
                    <SelectItem value="snacks">Snacks</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddToMeal} className="flex-1 gap-2">
                  <Plus className="w-4 h-4" /> Add to Meal
                </Button>
                <Button variant="outline" onClick={handleScanAnother}>Scan Another</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
