import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Beef, Wheat, Droplets, Plus } from 'lucide-react';
import { foodDatabase, getCategoryLabel, searchFoods, getFoodsByCategory } from '@/data/foodDatabase';
import { FoodItem, FoodCategory, MacroBreakdown } from '@/types/nutrition';
import { FoodCard } from './FoodCard';

interface FoodDatabaseProps {
  targetMacros?: MacroBreakdown;
  onAddFood?: (food: FoodItem, servings: number) => void;
}

const CATEGORY_TABS: { value: 'all' | FoodCategory; label: string }[] = [
  { value: 'all', label: 'All Foods' },
  { value: 'lean_protein', label: 'Lean Protein' },
  { value: 'whole_protein', label: 'Whole Protein' },
  { value: 'dairy_vegetarian', label: 'Dairy/Veg' },
  { value: 'carbohydrate', label: 'Carbs' },
  { value: 'healthy_fat', label: 'Fats' },
  { value: 'vegetable', label: 'Vegetables' },
  { value: 'fruit', label: 'Fruits' },
];

export function FoodDatabase({ targetMacros, onAddFood }: FoodDatabaseProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | FoodCategory>('all');

  const filteredFoods = useMemo(() => {
    let foods = foodDatabase;

    if (searchQuery.trim()) {
      foods = searchFoods(searchQuery);
    }

    if (activeCategory !== 'all') {
      foods = foods.filter(food => food.category === activeCategory);
    }

    return foods;
  }, [searchQuery, activeCategory]);

  // Calculate how much protein is still needed
  const proteinNeeded = targetMacros ? targetMacros.protein : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Beef className="w-5 h-5 text-primary" />
          Food Database
        </CardTitle>
        <CardDescription>
          50+ curated foods with accurate macros. Search or browse by category.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search foods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as typeof activeCategory)}>
          <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
            {CATEGORY_TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Results Count */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{filteredFoods.length} foods found</span>
          {proteinNeeded && (
            <Badge variant="outline" className="gap-1">
              <Beef className="w-3 h-3" />
              Target: {proteinNeeded}g protein
            </Badge>
          )}
        </div>

        {/* Food Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredFoods.slice(0, 12).map((food) => (
            <FoodCard
              key={food.id}
              food={food}
              onAdd={onAddFood ? (servings) => onAddFood(food, servings) : undefined}
            />
          ))}
        </div>

        {filteredFoods.length > 12 && (
          <p className="text-sm text-center text-muted-foreground">
            Showing 12 of {filteredFoods.length} foods. Use search to narrow results.
          </p>
        )}

        {filteredFoods.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No foods found matching "{searchQuery}"</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
