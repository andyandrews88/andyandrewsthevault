import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CustomFoodFormProps {
  defaultBarcode?: string;
  onFoodCreated: (food: {
    id: string;
    name: string;
    brand?: string;
    barcode?: string;
    servingSize: string;
    servingGrams: number;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber?: number;
  }) => void;
  onCancel?: () => void;
}

export function CustomFoodForm({ defaultBarcode, onFoodCreated, onCancel }: CustomFoodFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    brand: '',
    barcode: defaultBarcode || '',
    servingSize: '100g',
    servingGrams: 100,
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    fiber: 0,
  });

  const update = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Please enter a food name');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        toast.error('You must be logged in');
        setIsSubmitting(false);
        return;
      }

      const { data, error } = await supabase
        .from('custom_foods')
        .insert({
          created_by: session.session.user.id,
          name: form.name.trim(),
          brand: form.brand.trim() || null,
          barcode: form.barcode.trim() || null,
          serving_size: form.servingSize,
          serving_grams: form.servingGrams,
          calories: form.calories,
          protein: form.protein,
          carbs: form.carbs,
          fats: form.fats,
          fiber: form.fiber || null,
          is_public: true,
        })
        .select('id')
        .single();

      if (error) throw error;

      toast.success('Custom food saved!');
      onFoodCreated({
        id: data.id,
        name: form.name.trim(),
        brand: form.brand.trim() || undefined,
        barcode: form.barcode.trim() || undefined,
        servingSize: form.servingSize,
        servingGrams: form.servingGrams,
        calories: form.calories,
        protein: form.protein,
        carbs: form.carbs,
        fats: form.fats,
        fiber: form.fiber || undefined,
      });
    } catch (err) {
      console.error('Error saving custom food:', err);
      toast.error('Failed to save food');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" />
          Create Custom Food
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label htmlFor="cf-name">Food Name *</Label>
            <Input id="cf-name" placeholder="e.g. Protein Bar" value={form.name} onChange={(e) => update('name', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="cf-brand">Brand</Label>
            <Input id="cf-brand" placeholder="Optional" value={form.brand} onChange={(e) => update('brand', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="cf-barcode">Barcode</Label>
            <Input id="cf-barcode" placeholder="Optional" value={form.barcode} onChange={(e) => update('barcode', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="cf-serving">Serving Size</Label>
            <Input id="cf-serving" placeholder="e.g. 1 bar" value={form.servingSize} onChange={(e) => update('servingSize', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="cf-grams">Serving (g)</Label>
            <Input id="cf-grams" type="number" value={form.servingGrams} onChange={(e) => update('servingGrams', Number(e.target.value))} />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div>
            <Label htmlFor="cf-cal" className="text-xs">Calories</Label>
            <Input id="cf-cal" type="number" value={form.calories} onChange={(e) => update('calories', Number(e.target.value))} />
          </div>
          <div>
            <Label htmlFor="cf-pro" className="text-xs">Protein (g)</Label>
            <Input id="cf-pro" type="number" value={form.protein} onChange={(e) => update('protein', Number(e.target.value))} />
          </div>
          <div>
            <Label htmlFor="cf-carb" className="text-xs">Carbs (g)</Label>
            <Input id="cf-carb" type="number" value={form.carbs} onChange={(e) => update('carbs', Number(e.target.value))} />
          </div>
          <div>
            <Label htmlFor="cf-fat" className="text-xs">Fats (g)</Label>
            <Input id="cf-fat" type="number" value={form.fats} onChange={(e) => update('fats', Number(e.target.value))} />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button onClick={handleSubmit} disabled={isSubmitting || !form.name.trim()} className="flex-1 gap-2">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Save Food
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
