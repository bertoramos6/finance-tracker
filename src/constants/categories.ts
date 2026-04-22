export interface Category {
  name: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  { name: 'Housing',                   color: '#818cf8' },
  { name: 'Grocery',                   color: '#4ade80' },
  { name: 'Restaurants',               color: '#fb923c' },
  { name: 'Transportation',            color: '#60a5fa' },
  { name: 'Drinks, Tapas, tomar algo', color: '#f472b6' },
  { name: 'Entertainment',             color: '#c084fc' },
  { name: 'Clothing',                  color: '#2dd4bf' },
  { name: 'Golf',                      color: '#a3e635' },
  { name: 'Gifts',                     color: '#fbbf24' },
  { name: 'Planes finde',              color: '#38bdf8' },
  { name: 'Desarrollo personal',       color: '#a78bfa' },
  { name: 'Subscription',              color: '#94a3b8' },
  { name: 'Otros gastos personales',   color: '#a8a29e' },
  { name: 'Glovo',                     color: '#fdba74' },
  { name: 'Deporte',                   color: '#34d399' },
  { name: 'Party',                     color: '#fb7185' },
  { name: 'Vacation',                  color: '#22d3ee' },
  { name: 'Suministros',               color: '#d6d3d1' },
  { name: 'Impuestos/multas',          color: '#f87171' },
];

export const CAT_MAP: Record<string, string> = Object.fromEntries(
  CATEGORIES.map(c => [c.name, c.color])
);
