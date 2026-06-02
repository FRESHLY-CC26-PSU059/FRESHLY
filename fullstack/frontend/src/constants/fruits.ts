export const FRUIT_OPTIONS = [
  { id: 'banana', icon: '🍌' },
  { id: 'mango', icon: '🥭' },
  { id: 'orange', icon: '🍊' },
  { id: 'chili', icon: '🌶️' },
  { id: 'paprika', icon: '🫑' },
  { id: 'tomato', icon: '🍅' },
] as const;

export type FruitId = typeof FRUIT_OPTIONS[number]['id'];

export const DEFAULT_FRUIT_ID: FruitId = 'banana';
