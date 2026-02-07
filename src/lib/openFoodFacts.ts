// ============= Open Food Facts API Client =============

export interface OpenFoodFactsProduct {
  code: string;
  product_name: string;
  brands?: string;
  serving_size?: string;
  serving_quantity?: number;
  nutriments: {
    'energy-kcal_100g'?: number;
    'energy-kcal_serving'?: number;
    proteins_100g?: number;
    proteins_serving?: number;
    carbohydrates_100g?: number;
    carbohydrates_serving?: number;
    fat_100g?: number;
    fat_serving?: number;
    fiber_100g?: number;
    fiber_serving?: number;
    sugars_100g?: number;
    sodium_100g?: number;
  };
  image_url?: string;
  image_small_url?: string;
  categories_tags?: string[];
}

export interface ScannedProduct {
  barcode: string;
  name: string;
  brand?: string;
  servingSize: string;
  servingGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
  imageUrl?: string;
}

export interface OpenFoodFactsResponse {
  status: number;
  status_verbose: string;
  product?: OpenFoodFactsProduct;
}

const API_BASE_URL = 'https://world.openfoodfacts.org/api/v2';

export async function lookupBarcode(barcode: string): Promise<ScannedProduct | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/product/${barcode}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AndyAndrewsVault/1.0',
      },
    });

    if (!response.ok) {
      console.error('Open Food Facts API error:', response.status);
      return null;
    }

    const data: OpenFoodFactsResponse = await response.json();

    if (data.status !== 1 || !data.product) {
      return null;
    }

    const product = data.product;
    const nutriments = product.nutriments;

    // Calculate serving size in grams
    let servingGrams = product.serving_quantity || 100;
    let servingSize = product.serving_size || `${servingGrams}g`;

    // Get per-serving or per-100g values
    const hasServingData = nutriments['energy-kcal_serving'] !== undefined;
    
    const calories = hasServingData
      ? nutriments['energy-kcal_serving'] || 0
      : Math.round((nutriments['energy-kcal_100g'] || 0) * servingGrams / 100);

    const protein = hasServingData
      ? nutriments.proteins_serving || 0
      : Math.round((nutriments.proteins_100g || 0) * servingGrams / 100 * 10) / 10;

    const carbs = hasServingData
      ? nutriments.carbohydrates_serving || 0
      : Math.round((nutriments.carbohydrates_100g || 0) * servingGrams / 100 * 10) / 10;

    const fats = hasServingData
      ? nutriments.fat_serving || 0
      : Math.round((nutriments.fat_100g || 0) * servingGrams / 100 * 10) / 10;

    const fiber = hasServingData
      ? nutriments.fiber_serving
      : nutriments.fiber_100g 
        ? Math.round(nutriments.fiber_100g * servingGrams / 100 * 10) / 10
        : undefined;

    return {
      barcode,
      name: product.product_name || 'Unknown Product',
      brand: product.brands,
      servingSize,
      servingGrams,
      calories: Math.round(calories),
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fats: Math.round(fats * 10) / 10,
      fiber,
      imageUrl: product.image_small_url || product.image_url,
    };
  } catch (error) {
    console.error('Error fetching from Open Food Facts:', error);
    return null;
  }
}

// Search products by name (alternative to barcode)
export async function searchProducts(query: string, limit: number = 10): Promise<ScannedProduct[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/search?search_terms=${encodeURIComponent(query)}&page_size=${limit}&json=true`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AndyAndrewsVault/1.0',
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    
    if (!data.products || !Array.isArray(data.products)) {
      return [];
    }

    return data.products
      .filter((p: OpenFoodFactsProduct) => p.product_name && p.nutriments)
      .map((product: OpenFoodFactsProduct) => {
        const nutriments = product.nutriments;
        const servingGrams = product.serving_quantity || 100;
        
        return {
          barcode: product.code,
          name: product.product_name,
          brand: product.brands,
          servingSize: product.serving_size || `${servingGrams}g`,
          servingGrams,
          calories: Math.round(nutriments['energy-kcal_100g'] || 0),
          protein: Math.round((nutriments.proteins_100g || 0) * 10) / 10,
          carbs: Math.round((nutriments.carbohydrates_100g || 0) * 10) / 10,
          fats: Math.round((nutriments.fat_100g || 0) * 10) / 10,
          fiber: nutriments.fiber_100g,
          imageUrl: product.image_small_url || product.image_url,
        };
      });
  } catch (error) {
    console.error('Error searching Open Food Facts:', error);
    return [];
  }
}
