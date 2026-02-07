import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  UtensilsCrossed,
  Plus,
  Minus,
  Trash2,
  Save,
  Folder,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Search,
  X,
  Clock,
} from 'lucide-react';
import { useMealBuilderStore, MealFood, SavedMeal } from '@/stores/mealBuilderStore';
import { foodDatabase, searchFoods } from '@/data/foodDatabase';
import { FoodItem } from '@/types/nutrition';
import { 
  MeasurementUnit, 
  UNIT_OPTIONS, 
  getAvailableUnits,
  formatMeasurement,
} from '@/lib/unitConversions';
import { BarcodeScanner } from './BarcodeScanner';

export function MealBuilder() {
  const {
    currentMeal,
    savedMeals,
    addFood,
    removeFood,
    updateFoodAmount,
    clearCurrentMeal,
    saveMeal,
    loadMeal,
    deleteSavedMeal,
    getCurrentTotals,
  } = useMealBuilderStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [mealName, setMealName] = useState('');
  const [showSavedMeals, setShowSavedMeals] = useState(false);

  const totals = getCurrentTotals();

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchFoods(searchQuery).slice(0, 6);
  }, [searchQuery]);

  const handleAddFood = (food: FoodItem) => {
    addFood(food, 1, 'piece');
    setSearchQuery('');
    setShowFoodSearch(false);
  };

  const handleSaveMeal = () => {
    if (mealName.trim()) {
      saveMeal(mealName.trim());
      setMealName('');
      setSaveDialogOpen(false);
    }
  };

  const handleLoadMeal = (meal: SavedMeal) => {
    loadMeal(meal.id);
    setShowSavedMeals(false);
  };

  return (
    <div className="space-y-4">
      {/* Main Builder Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-primary" />
                Build Your Meal
              </CardTitle>
              <CardDescription>
                Add foods to see total calories and macros
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {savedMeals.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSavedMeals(true)}
                >
                  <Folder className="w-4 h-4 mr-1" />
                  Saved
                </Button>
              )}
              {currentMeal.length > 0 && (
                <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Save Meal</DialogTitle>
                    </DialogHeader>
                    <Input
                      placeholder="Meal name (e.g., Post-Workout)"
                      value={mealName}
                      onChange={(e) => setMealName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveMeal()}
                    />
                    <DialogFooter>
                      <Button onClick={handleSaveMeal} disabled={!mealName.trim()}>
                        Save Meal
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Totals Bar */}
          <div className="grid grid-cols-4 gap-2 p-4 bg-muted/50 rounded-lg">
            <TotalStat icon={Flame} value={totals.calories} label="cal" color="text-orange-500" />
            <TotalStat icon={Beef} value={Math.round(totals.protein * 10) / 10} label="g protein" color="text-primary" />
            <TotalStat icon={Wheat} value={Math.round(totals.carbs * 10) / 10} label="g carbs" color="text-success" />
            <TotalStat icon={Droplets} value={Math.round(totals.fats * 10) / 10} label="g fats" color="text-accent" />
          </div>

          {/* Food List */}
          <div className="space-y-2">
            {currentMeal.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No foods added yet</p>
                <p className="text-sm">Search for foods or scan a barcode to start building your meal</p>
              </div>
            ) : (
              currentMeal.map((mealFood) => (
                <MealFoodItem
                  key={mealFood.id}
                  mealFood={mealFood}
                  onRemove={() => removeFood(mealFood.id)}
                  onUpdate={(amount, unit) => updateFoodAmount(mealFood.id, amount, unit)}
                />
              ))
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowFoodSearch(true)}
            >
              <Search className="w-4 h-4 mr-2" />
              Add from Database
            </Button>
            {currentMeal.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear Meal?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove all foods from your current meal.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={clearCurrentMeal}>Clear</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Barcode Scanner */}
      <BarcodeScanner />

      {/* Food Search Dialog */}
      <Dialog open={showFoodSearch} onOpenChange={setShowFoodSearch}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Food</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search foods..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
            
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {searchQuery.trim() ? (
                searchResults.length > 0 ? (
                  searchResults.map((food) => (
                    <button
                      key={food.id}
                      onClick={() => handleAddFood(food)}
                      className="w-full p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{food.name}</p>
                        <p className="text-sm text-muted-foreground">{food.servingSize}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-mono">{food.calories} cal</p>
                        <p className="text-muted-foreground">{food.protein}g P</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No foods found
                  </p>
                )
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Type to search the food database
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Saved Meals Dialog */}
      <Dialog open={showSavedMeals} onOpenChange={setShowSavedMeals}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Saved Meals</DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {savedMeals.map((meal) => (
              <div
                key={meal.id}
                className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">{meal.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(meal.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {meal.totals.calories} cal
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleLoadMeal(meal)}
                  >
                    Load
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Saved Meal?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete "{meal.name}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteSavedMeal(meal.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============= Sub-Components =============

interface TotalStatProps {
  icon: React.ElementType;
  value: number;
  label: string;
  color: string;
}

function TotalStat({ icon: Icon, value, label, color }: TotalStatProps) {
  return (
    <div className="text-center">
      <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
      <p className="text-xl font-bold font-mono">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

interface MealFoodItemProps {
  mealFood: MealFood;
  onRemove: () => void;
  onUpdate: (amount: number, unit: MeasurementUnit) => void;
}

function MealFoodItem({ mealFood, onRemove, onUpdate }: MealFoodItemProps) {
  const { food, amount, unit, calculatedMacros } = mealFood;
  
  // Determine available units
  const category = 'category' in food ? food.category : 'supplement';
  const availableUnits = getAvailableUnits(category);

  const handleAmountChange = (newAmount: number) => {
    if (newAmount > 0 && newAmount <= 20) {
      onUpdate(newAmount, unit);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
      {/* Food Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{food.name}</p>
        <p className="text-xs text-muted-foreground">{food.servingSize}</p>
      </div>

      {/* Amount Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleAmountChange(amount - 0.5)}
          disabled={amount <= 0.5}
        >
          <Minus className="w-3 h-3" />
        </Button>
        
        <div className="flex items-center gap-1 min-w-[80px]">
          <Input
            type="number"
            value={amount}
            onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0.5)}
            className="w-14 h-8 text-center text-sm"
            step={0.5}
            min={0.5}
            max={20}
          />
          <Select value={unit} onValueChange={(v) => onUpdate(amount, v as MeasurementUnit)}>
            <SelectTrigger className="w-16 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableUnits.map((u) => {
                const option = UNIT_OPTIONS.find((o) => o.value === u);
                return (
                  <SelectItem key={u} value={u}>
                    {option?.shortLabel || u}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleAmountChange(amount + 0.5)}
          disabled={amount >= 20}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {/* Calculated Macros */}
      <div className="text-right min-w-[60px]">
        <p className="font-mono text-sm font-medium">{calculatedMacros.calories}</p>
        <p className="text-xs text-muted-foreground">cal</p>
      </div>

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
