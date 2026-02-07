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
import { useMealBuilderStore } from '@/stores/mealBuilderStore';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
  onProductScanned?: (product: ScannedProduct) => void;
}

export function BarcodeScanner({ onProductScanned }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedProduct, setScannedProduct] = useState<ScannedProduct | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'barcode-scanner-container';
  
  const { addFood } = useMealBuilderStore();

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.log('Scanner already stopped');
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const handleBarcodeLookup = useCallback(async (barcode: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const product = await lookupBarcode(barcode);
      
      if (product) {
        setScannedProduct(product);
        setShowResultDialog(true);
        onProductScanned?.(product);
      } else {
        setError(`Product not found for barcode: ${barcode}. Try entering the nutrition info manually.`);
      }
    } catch (err) {
      setError('Failed to look up product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [onProductScanned]);

  const startScanner = async () => {
    setError(null);
    setIsScanning(true);

    try {
      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 100 },
        },
        async (decodedText) => {
          // Barcode detected
          await stopScanner();
          handleBarcodeLookup(decodedText);
        },
        () => {
          // QR code scanning ongoing
        }
      );
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setError('Unable to access camera. Please ensure camera permissions are granted or enter the barcode manually.');
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
      addFood(scannedProduct, 1, 'piece');
      setShowResultDialog(false);
      setScannedProduct(null);
      setManualBarcode('');
    }
  };

  const handleScanAnother = () => {
    setShowResultDialog(false);
    setScannedProduct(null);
    setManualBarcode('');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
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
            Scan product barcodes to get instant nutrition info from Open Food Facts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Scanner View */}
          {isScanning && (
            <div className="relative rounded-lg overflow-hidden bg-background">
              <div 
                id={scannerContainerId} 
                className="w-full aspect-[4/3]"
              />
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 bg-background/80"
                onClick={stopScanner}
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <Badge variant="secondary" className="bg-background/80">
                  Point camera at barcode
                </Badge>
              </div>
            </div>
          )}

          {/* Start Scanner Button */}
          {!isScanning && (
            <Button
              onClick={startScanner}
              className="w-full gap-2"
              disabled={isLoading}
            >
              <Camera className="w-4 h-4" />
              Open Camera Scanner
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
            <Button
              variant="outline"
              onClick={handleManualLookup}
              disabled={!manualBarcode.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Looking up product...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Product Found
            </DialogTitle>
            <DialogDescription>
              Review the nutrition information below
            </DialogDescription>
          </DialogHeader>
          
          {scannedProduct && (
            <div className="space-y-4">
              {/* Product Image & Name */}
              <div className="flex gap-4 items-start">
                {scannedProduct.imageUrl && (
                  <img 
                    src={scannedProduct.imageUrl} 
                    alt={scannedProduct.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate">{scannedProduct.name}</h4>
                  {scannedProduct.brand && (
                    <p className="text-sm text-muted-foreground">{scannedProduct.brand}</p>
                  )}
                  <Badge variant="outline" className="mt-1">
                    {scannedProduct.servingSize}
                  </Badge>
                </div>
              </div>

              {/* Macros Display */}
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

              {/* Actions */}
              <div className="flex gap-2">
                <Button onClick={handleAddToMeal} className="flex-1 gap-2">
                  <Plus className="w-4 h-4" />
                  Add to Meal
                </Button>
                <Button variant="outline" onClick={handleScanAnother}>
                  Scan Another
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
