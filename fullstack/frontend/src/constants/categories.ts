// Article Categories
export const ARTICLE_CATEGORIES = [
  { value: 'fruit', label: 'Buah', icon: '🍎' },
  { value: 'vegetable', label: 'Sayur', icon: '🥬' },
  { value: 'tips', label: 'Tips', icon: '💡' },
  { value: 'storage', label: 'Penyimpanan', icon: '📦' },
  { value: 'nutrition', label: 'Nutrisi', icon: '🥗' },
  { value: 'encyclopedia', label: 'Ensiklopedia', icon: '📚' },
  { value: 'recipe', label: 'Resep', icon: '👨‍🍳' },
  { value: 'health', label: 'Kesehatan', icon: '💊' },
] as const;

export type ArticleCategory = typeof ARTICLE_CATEGORIES[number]['value'];

// Get category label by value
export const getCategoryLabel = (value: string): string => {
  const category = ARTICLE_CATEGORIES.find(c => c.value === value);
  return category ? category.label : value;
};

// Get category icon by value
export const getCategoryIcon = (value: string): string => {
  const category = ARTICLE_CATEGORIES.find(c => c.value === value);
  return category ? category.icon : '📄';
};

// Get category badge color
export const getCategoryColor = (value: string): string => {
  const colors: Record<string, string> = {
    fruit: 'bg-red-500/10 text-red-600',
    vegetable: 'bg-green-500/10 text-green-600',
    tips: 'bg-yellow-500/10 text-yellow-600',
    storage: 'bg-blue-500/10 text-blue-600',
    nutrition: 'bg-purple-500/10 text-purple-600',
    encyclopedia: 'bg-indigo-500/10 text-indigo-600',
    recipe: 'bg-orange-500/10 text-orange-600',
    health: 'bg-pink-500/10 text-pink-600',
  };
  return colors[value] || 'bg-gray-500/10 text-gray-600';
};
