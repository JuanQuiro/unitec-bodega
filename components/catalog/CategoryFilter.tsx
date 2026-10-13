'use client';

import { PRODUCT_CATEGORIES } from '@/types/bodega';
import { cn } from '@/utils/cn';

interface CategoryFilterProps {
  selected: string | null;
  onSelect: (category: string | null) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          'whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
          selected === null
            ? 'border-green-600 bg-green-600 text-white'
            : 'border-gray-200 bg-white text-gray-700 hover:border-green-300'
        )}
      >
        Todos
      </button>

      {PRODUCT_CATEGORIES.map((category) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          className={cn(
            'whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
            selected === category
              ? 'border-green-600 bg-green-600 text-white'
              : 'border-gray-200 bg-white text-gray-700 hover:border-green-300'
          )}
        >
          {category.charAt(0).toUpperCase() + category.slice(1)}
        </button>
      ))}
    </div>
  );
}
