import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Folder, Trash2 } from 'lucide-react';
import { useMealBuilderStore, MealFood, SavedMeal, MealSlotType } from '@/stores/mealBuilderStore';
import { searchFoods } from '@/data/foodDatabase';
import { FoodItem } from '@/types/nutrition';
import { CalorieSummary } from './CalorieSummary';
import { MealSection, MealSlot } from './MealSection';
import { BarcodeScanner } from './BarcodeScanner';
import { DateNavigator } from './DateNavigator';
import { Skeleton } from '@/components/ui/skeleton';
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

interface FoodDiaryProps {
  targetCalories: number;
  targetMacros: {
    protein: number;
    carbs: number;
    fats: number;
  };
}

export function FoodDiary({ targetCalories, targetMacros }: FoodDiaryProps) {
  const {
    selectedDate,
    setSelectedDate,
    savedMeals,
    addDiaryEntry,
    removeDiaryEntry,
    updateDiaryEntry,
    clearDiaryForDate,
    fetchDiaryForDate,
    getEntriesForDate,
    getTotalsForDate,
    deleteSavedMeal,
    isLoading,
  } = useMealBuilderStore();

  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [activeMealSlot, setActiveMealSlot] = useState<MealSlot>('breakfast');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSavedMeals, setShowSavedMeals] = useState(false);

  const entries = getEntriesForDate(selectedDate);
  const totals = getTotalsForDate(selectedDate);

  const mealSlots: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snacks'];

  // Fetch diary on mount
  useEffect(() => {
    fetchDiaryForDate(selectedDate);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter entries by slot
  const getFoodsForSlot = (slot: MealSlot): MealFood[] => {
    return entries.filter((e) => e.mealSlot === slot);
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchFoods(searchQuery).slice(0, 8);
  }, [searchQuery]);

  const handleAddFood = (slot: MealSlot) => {
    setActiveMealSlot(slot);
    setShowFoodSearch(true);
  };

  const handleSelectFood = (food: FoodItem) => {
    addDiaryEntry(food, activeMealSlot as MealSlotType, 1, 'piece');
    setSearchQuery('');
    setShowFoodSearch(false);
  };

  const handleLoadSavedMeal = (meal: SavedMeal) => {
    for (const f of meal.foods) {
      addDiaryEntry(f.food, activeMealSlot as MealSlotType, f.amount, f.unit);
    }
    setShowSavedMeals(false);
  };

  return (
    <div className="space-y-4">
      {/* Date Navigator */}
      <DateNavigator selectedDate={selectedDate} onDateChange={setSelectedDate} />

      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <Badge variant="elite">FOOD DIARY</Badge>
        <div className="flex gap-2">
          {savedMeals.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowSavedMeals(true)}>
              <Folder className="w-4 h-4 mr-1" />
              Saved
            </Button>
          )}
          {entries.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All Foods?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all foods from {format(selectedDate, 'MMM d')}'s diary.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => clearDiaryForDate(selectedDate)}>
                    Clear
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Daily Summary with Hand Portions */}
      <CalorieSummary
        consumed={totals}
        targets={{
          calories: targetCalories,
          protein: targetMacros.protein,
          carbs: targetMacros.carbs,
          fats: targetMacros.fats,
        }}
      />

      {/* Meal Sections */}
      {isLoading ? (
        <div className="space-y-3">
          {mealSlots.map((slot) => (
            <Skeleton key={slot} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {mealSlots.map((slot) => (
            <MealSection
              key={slot}
              slot={slot}
              foods={getFoodsForSlot(slot)}
              onAddFood={() => handleAddFood(slot)}
              onRemoveFood={(id) => removeDiaryEntry(id)}
              onUpdateFood={(id, amount, unit) => updateDiaryEntry(id, amount, unit)}
            />
          ))}
        </div>
      )}

      {/* Barcode Scanner — passes active meal slot */}
      <BarcodeScanner mealSlot={activeMealSlot as MealSlotType} />

      {/* Food Search Dialog */}
      <Dialog open={showFoodSearch} onOpenChange={setShowFoodSearch}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Add Food to {activeMealSlot.charAt(0).toUpperCase() + activeMealSlot.slice(1)}
            </DialogTitle>
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
                      onClick={() => handleSelectFood(food)}
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
                  <p className="text-center text-muted-foreground py-4">No foods found</p>
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
            <DialogTitle>Saved Meal Templates</DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {savedMeals.map((meal) => (
              <div key={meal.id} className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">{meal.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(meal.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline">{meal.totals.calories} cal</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleLoadSavedMeal(meal)}>
                    Add to {activeMealSlot}
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
