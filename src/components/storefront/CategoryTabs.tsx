import React from 'react';
import { ProductCategory } from '../../types';

interface CategoryTabsProps {
  selectedCategory: ProductCategory;
  onSelectCategory: (category: ProductCategory) => void;
}

const CATEGORIES: { id: ProductCategory; label: string }[] = [
  { id: 'vyote', label: 'Mkusanyiko Wote' },
  { id: 'suti', label: 'Suti za Kifahari' },
  { id: 'wanaume', label: 'Mavazi ya Kiume' },
  { id: 'wanawake', label: 'Mavazi ya Kike' },
  { id: 'viatu', label: 'Viatu vya Ngozi' },
  { id: 'accessories', label: 'Vifaa & Saa' }
];

export const CategoryTabs: React.FC<CategoryTabsProps> = ({ selectedCategory, onSelectCategory }) => {
  return (
    <nav className="category-tabs" aria-label="Aina za Mavazi">
      <div className="category-tabs-scroller" role="tablist">
        {CATEGORIES.map(cat => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectCategory(cat.id)}
              className={isActive ? 'category-tab active' : 'category-tab'}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
