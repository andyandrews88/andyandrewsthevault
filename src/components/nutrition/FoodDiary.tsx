import { useState, useMemo, useEffect, useCallback } from 'react';
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
import { Search, Folder, Trash2, Plus, Loader2 } from 'lucide-react';
import { useMealBuilderStore, MealFood, SavedMeal, MealSlotType, TrackingMode } from '@/stores/mealBuilderStore';
import { searchFoods } from '@/data/foodDatabase';
import { FoodItem } from '@/types/nutrition';
import { CalorieSummary } from './CalorieSummary';
import { MealSection, MealSlot } from './MealSection';
import { HandPortionLogger } from './HandPortionLogger';
import { BarcodeScanner } from './BarcodeScanner';
import { DateNavigator } from './DateNavigator';
import { CustomFoodForm } from './CustomFoodForm';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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

interface SearchResult {
  source: 'local' | 'custom' | 'nutritionix';
  food: FoodItem;
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
    trackingMode,
    setTrackingMode,
    isLoading,
  } = useMealBuilderStore();

  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [activeMealSlot, setActiveMealSlot] = useState<MealSlot>('breakfast');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSavedMeals, setShowSavedMeals] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [externalResults, setExternalResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const entries = getEntriesForDate(selectedDate);
  const totals = getTotalsForDate(selectedDate);

  const mealSlots: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snacks'];

  // Fetch diary on mount and when selectedDate changes
  useEffect(() => {
    fetchDiaryForDate(selectedDate);
  }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const getFoodsForSlot = (slot: MealSlot): MealFood[] => {
    return entries.filter((e) => e.mealSlot === slot);
  };

  // Local search results (instant)
  const localResults = useMemo<SearchResult[]>(() => {
    if (!searchQuery.trim()) return [];
    return searchFoods(searchQuery).slice(0, 6).map((food) => ({
      source: 'local' as const,
      food,
    }));
  }, [searchQuery]);

  // Debounced external search (custom_foods + nutritionix)
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setExternalResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results: SearchResult[] = [];

      try {
        // Search custom_foods table
        const { data: customFoods } = await supabase
          .from('custom_foods')
          .select('*')
          .ilike('name', `%${searchQuery}%`)
          .limit(5);

        if (customFoods) {
          for (const cf of customFoods) {
            results.push({
              source: 'custom',
              food: {
                id: cf.id,
                name: cf.name + (cf.brand ? ` (${cf.brand})` : ''),
                category: 'lean_protein' as any,
                servingSize: cf.serving_size,
                servingGrams: Number(cf.serving_grams),
                calories: Number(cf.calories),
                protein: Number(cf.protein),
                carbs: Number(cf.carbs),
                fats: Number(cf.fats),
                fiber: cf.fiber ? Number(cf.fiber) : undefined,
                tags: ['custom'],
              },
            });
          }
        }

        // Search Nutritionix
        try {
          const { data: nxData } = await supabase.functions.invoke('nutritionix-search', {
            body: { action: 'search', query: searchQuery },
          });
          if (nxData?.foods) {
            for (const nf of nxData.foods.slice(0, 6)) {
              results.push({
                source: 'nutritionix',
                food: {
                  id: `nx-${nf.name}-${Date.now()}`,
                  name: nf.name + (nf.brand ? ` (${nf.brand})` : ''),
                  category: 'lean_protein' as any,
                  servingSize: nf.servingSize,
                  servingGrams: nf.servingGrams || 100,
                  calories: nf.calories,
                  protein: nf.protein,
                  carbs: nf.carbs,
                  fats: nf.fats,
                  fiber: nf.fiber,
                  tags: ['nutritionix'],
                },
              });
            }
          }
        } catch {
          // Nutritionix search failed silently
        }
      } catch {
        // External search failed silently
      }

      setExternalResults(results);
      setIsSearching(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Combine all results
  const allResults = useMemo(() => {
    const combined = [...localResults, ...externalResults];
    // Deduplicate by name (case-insensitive)
    const seen = new Set<string>();
    return combined.filter((r) => {
      const key = r.food.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [localResults, externalResults]);

  const handleAddFood = (slot: MealSlot) => {
    setActiveMealSlot(slot);
    setShowFoodSearch(true);
  };

  const handleSelectFood = (food: FoodItem) => {
    addDiaryEntry(food, activeMealSlot as MealSlotType, 1, 'piece');
    toast.success(`Added ${food.name} to ${activeMealSlot}`);
    setSearchQuery('');
    setShowFoodSearch(false);
  };

  const handleLoadSavedMeal = (meal: SavedMeal) => {
    for (const f of meal.foods) {
      addDiaryEntry(f.food, activeMealSlot as MealSlotType, f.amount, f.unit);
    }
    toast.success(`Loaded "${meal.name}"`);
    setShowSavedMeals(false);
  };

  const handleCustomFoodCreated = (food: any) => {
    const foodItem: FoodItem = {
      id: food.id,
      name: food.name,
      category: 'lean_protein',
      servingSize: food.servingSize,
      servingGrams: food.servingGrams,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
      fiber: food.fiber,
      tags: ['custom'],
    };
    addDiaryEntry(foodItem, activeMealSlot as MealSlotType, 1, 'piece');
    toast.success(`Added ${food.name} to ${activeMealSlot}`);
    setShowCustomForm(false);
    setShowFoodSearch(false);
  };

  const sourceLabel = (source: string) => {
    if (source === 'local') return null;
    if (source === 'custom') return <Badge variant="outline" className="text-[10px] px-1 py-0">Custom</Badge>;
    return <Badge variant="outline" className="text-[10px] px-1 py-0">Nutritionix</Badge>;
  };

  return (
    <div className="space-y-4">
      <DateNavigator selectedDate={selectedDate} onDateChange={setSelectedDate} />

      <ToggleGroup
        type="single"
        value={trackingMode}
        onValueChange={(v) => { if (v) setTrackingMode(v as TrackingMode); }}
        className="w-full border border-border rounded-lg p-1 bg-muted/30"
      >
        <ToggleGroupItem value="simple" className="flex-1 text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
          ✋ Simple
        </ToggleGroupItem>
        <ToggleGroupItem value="detailed" className="flex-1 text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
          📊 Detailed
        </ToggleGroupItem>
      </ToggleGroup>

      <div className="flex items-center justify-between">
        <Badge variant="elite">FOOD DIARY</Badge>
        <div className="flex gap-2">
          {savedMeals.length > 0 && trackingMode === 'detailed' && (
            <Button variant="outline" size="sm" onClick={() => setShowSavedMeals(true)}>
              <Folder className="w-4 h-4 mr-1" /> Saved
            </Button>
          )}
          {entries.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm"><Trash2 className="w-4 h-4" /></Button>
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
                  <AlertDialogAction onClick={() => clearDiaryForDate(selectedDate)}>Clear</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <CalorieSummary
        consumed={totals}
        targets={{
          calories: targetCalories,
          protein: targetMacros.protein,
          carbs: targetMacros.carbs,
          fats: targetMacros.fats,
        }}
      />

      {isLoading ? (
        <div className="space-y-3">
          {mealSlots.map((slot) => (
            <Skeleton key={slot} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : trackingMode === 'simple' ? (
        <HandPortionLogger entries={entries} onRemoveFood={(id) => removeDiaryEntry(id)} />
      ) : (
        <>
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

          <BarcodeScanner mealSlot={activeMealSlot as MealSlotType} />
        </>
      )}

      {/* Food Search Dialog */}
      <Dialog open={showFoodSearch} onOpenChange={(open) => { setShowFoodSearch(open); if (!open) { setSearchQuery(''); setShowCustomForm(false); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Add Food to {activeMealSlot.charAt(0).toUpperCase() + activeMealSlot.slice(1)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {showCustomForm ? (
              <CustomFoodForm
                onFoodCreated={handleCustomFoodCreated}
                onCancel={() => setShowCustomForm(false)}
              />
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search foods (local + Nutritionix)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    autoFocus
                  />
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-1">
                  {searchQuery.trim() ? (
                    <>
                      {allResults.length > 0 ? (
                        allResults.map((result, idx) => (
                          <button
                            key={`${result.source}-${result.food.id}-${idx}`}
                            onClick={() => handleSelectFood(result.food)}
                            className="w-full p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="min-w-0">
                                <p className="font-medium truncate">{result.food.name}</p>
                                <p className="text-sm text-muted-foreground">{result.food.servingSize}</p>
                              </div>
                              {sourceLabel(result.source)}
                            </div>
                            <div className="text-right text-sm shrink-0 ml-2">
                              <p className="font-mono">{result.food.calories} cal</p>
                              <p className="text-muted-foreground">{result.food.protein}g P</p>
                            </div>
                          </button>
                        ))
                      ) : !isSearching ? (
                        <p className="text-center text-muted-foreground py-4">No foods found</p>
                      ) : null}
                      {isSearching && (
                        <div className="flex items-center justify-center py-2 gap-2 text-muted-foreground text-sm">
                          <Loader2 className="w-3 h-3 animate-spin" /> Searching Nutritionix...
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      Type to search from 600K+ foods
                    </p>
                  )}
                </div>

                {/* Create Custom Food button */}
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setShowCustomForm(true)}
                >
                  <Plus className="w-4 h-4" /> Create Custom Food
                </Button>
              </>
            )}
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
                    <p className="text-xs text-muted-foreground">{new Date(meal.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge variant="outline">{meal.totals.calories} cal</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleLoadSavedMeal(meal)}>
                    Add to {activeMealSlot}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost"><Trash2 className="w-4 h-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Saved Meal?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete "{meal.name}".</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteSavedMeal(meal.id)}>Delete</AlertDialogAction>
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
