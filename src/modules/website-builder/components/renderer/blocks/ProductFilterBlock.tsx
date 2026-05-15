import React, { useState, useMemo } from 'react';
import { SiteTheme } from '../../../types';
import { SlidersHorizontal, ArrowUpDown, X, Search, ChevronDown } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FilterCategory {
  label: string;
  value: string;
  count?: number;
}

type SortOption = 'price-asc' | 'price-desc' | 'rating-desc' | 'name-asc' | 'name-desc' | 'newest';

interface ProductFilterBlockProps {
  title?: string;
  showSearch?: boolean;
  showCategories?: boolean;
  showPriceRange?: boolean;
  showRating?: boolean;
  showSort?: boolean;
  variant?: 'horizontal' | 'sidebar' | 'toolbar' | 'minimal';
  categories?: FilterCategory[];
  priceMin?: number;
  priceMax?: number;
  priceCurrency?: string;
  sortOptions?: SortOption[];
  bgColor?: string;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

/* ------------------------------------------------------------------ */
/*  Sort labels                                                        */
/* ------------------------------------------------------------------ */

const SORT_LABELS: Record<SortOption, string> = {
  'price-asc': 'Price: Low to High',
  'price-desc': 'Price: High to Low',
  'rating-desc': 'Highest Rated',
  'name-asc': 'Name: A–Z',
  'name-desc': 'Name: Z–A',
  'newest': 'Newest First',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ProductFilterBlock({
  title = 'Filter Products',
  showSearch = true,
  showCategories = true,
  showPriceRange = true,
  showRating = true,
  showSort = true,
  variant = 'horizontal',
  categories = [
    { label: 'All', value: 'all', count: 24 },
    { label: 'Electronics', value: 'electronics', count: 8 },
    { label: 'Clothing', value: 'clothing', count: 6 },
    { label: 'Accessories', value: 'accessories', count: 5 },
    { label: 'Home', value: 'home', count: 5 },
  ],
  priceMin = 0,
  priceMax = 500,
  priceCurrency = '$',
  sortOptions = ['price-asc', 'price-desc', 'rating-desc', 'name-asc', 'newest'],
  bgColor,
  theme,
  isEditing,
  onUpdate,
  style,
}: ProductFilterBlockProps) {
  const dir = theme.direction || 'ltr';

  // Local filter state (UI-only in the builder)
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([priceMin, priceMax]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(true);
  const [sortOpen, setSortOpen] = useState(false);

  const activeFilters = useMemo(() => {
    const filters: string[] = [];
    if (selectedCategory !== 'all') filters.push(selectedCategory);
    if (priceRange[0] > priceMin || priceRange[1] < priceMax) filters.push(`${priceCurrency}${priceRange[0]}–${priceCurrency}${priceRange[1]}`);
    if (minRating > 0) filters.push(`${minRating}+ stars`);
    if (search) filters.push(`"${search}"`);
    return filters;
  }, [selectedCategory, priceRange, minRating, search, priceMin, priceMax, priceCurrency]);

  const clearAll = () => {
    setSearch('');
    setSelectedCategory('all');
    setPriceRange([priceMin, priceMax]);
    setMinRating(0);
    setSortBy('newest');
  };

  /* ---- Shared sub-components ---- */

  const SearchInput = () => (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40" style={{ color: theme.secondaryColor }} />
      <input
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        disabled={isEditing}
        className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm bg-background focus:ring-2 focus:ring-primary/30 outline-none"
        style={{ borderRadius: theme.borderRadius, color: theme.textColor }}
      />
    </div>
  );

  const CategoryPills = () => (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <button
          key={cat.value}
          onClick={() => setSelectedCategory(cat.value)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
            selectedCategory === cat.value
              ? 'text-white border-transparent'
              : 'border-border/40 hover:border-primary/30'
          }`}
          style={{
            backgroundColor: selectedCategory === cat.value ? theme.primaryColor : 'transparent',
            color: selectedCategory === cat.value ? '#fff' : theme.textColor,
            borderRadius: '9999px',
          }}
        >
          {cat.label}
          {cat.count !== undefined && (
            <span className="ml-1 opacity-60">({cat.count})</span>
          )}
        </button>
      ))}
    </div>
  );

  const PriceSlider = () => (
    <div className="space-y-2">
      <label className="text-xs font-medium opacity-70" style={{ color: theme.textColor }}>
        Price Range: {priceCurrency}{priceRange[0]} – {priceCurrency}{priceRange[1]}
      </label>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={priceMin}
          max={priceMax}
          value={priceRange[0]}
          onChange={(e) => setPriceRange([Math.min(Number(e.target.value), priceRange[1]), priceRange[1]])}
          disabled={isEditing}
          className="flex-1 accent-primary h-1.5"
          style={{ accentColor: theme.primaryColor }}
        />
        <input
          type="range"
          min={priceMin}
          max={priceMax}
          value={priceRange[1]}
          onChange={(e) => setPriceRange([priceRange[0], Math.max(Number(e.target.value), priceRange[0])])}
          disabled={isEditing}
          className="flex-1 accent-primary h-1.5"
          style={{ accentColor: theme.primaryColor }}
        />
      </div>
      <div className="flex justify-between text-[10px] opacity-50" style={{ color: theme.secondaryColor }}>
        <span>{priceCurrency}{priceMin}</span>
        <span>{priceCurrency}{priceMax}</span>
      </div>
    </div>
  );

  const RatingFilter = () => (
    <div className="space-y-1.5">
      <label className="text-xs font-medium opacity-70" style={{ color: theme.textColor }}>
        Minimum Rating
      </label>
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4, 5].map((r) => (
          <button
            key={r}
            onClick={() => setMinRating(r)}
            className={`px-2 py-1 rounded text-xs font-medium border transition-all ${
              minRating === r ? 'text-white border-transparent' : 'border-border/40'
            }`}
            style={{
              backgroundColor: minRating === r ? theme.primaryColor : 'transparent',
              color: minRating === r ? '#fff' : theme.textColor,
              borderRadius: theme.borderRadius,
            }}
          >
            {r === 0 ? 'Any' : `${r}★+`}
          </button>
        ))}
      </div>
    </div>
  );

  const SortDropdown = () => (
    <div className="relative">
      <button
        onClick={() => setSortOpen(!sortOpen)}
        className="flex items-center gap-2 px-3 py-2 border rounded-lg text-xs font-medium hover:bg-muted/20 transition-colors"
        style={{ borderRadius: theme.borderRadius, color: theme.textColor }}
      >
        <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        {SORT_LABELS[sortBy]}
        <ChevronDown className={`h-3 w-3 opacity-40 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
      </button>
      {sortOpen && (
        <div
          className="absolute right-0 top-full mt-1 z-20 bg-background border rounded-lg shadow-lg py-1 min-w-[180px]"
          style={{ borderRadius: theme.borderRadius }}
        >
          {sortOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => { setSortBy(opt); setSortOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-muted/30 transition-colors ${
                sortBy === opt ? 'font-semibold' : ''
              }`}
              style={{ color: sortBy === opt ? theme.primaryColor : theme.textColor }}
            >
              {SORT_LABELS[opt]}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const ActiveFiltersBadges = () =>
    activeFilters.length > 0 ? (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-medium opacity-50" style={{ color: theme.secondaryColor }}>
          Active:
        </span>
        {activeFilters.map((f, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border border-border/30"
            style={{ color: theme.primaryColor }}
          >
            {f}
            <X className="h-2.5 w-2.5 cursor-pointer opacity-50 hover:opacity-100" onClick={clearAll} />
          </span>
        ))}
        <button
          onClick={clearAll}
          className="text-[10px] underline opacity-50 hover:opacity-100 transition-opacity"
          style={{ color: theme.primaryColor }}
        >
          Clear all
        </button>
      </div>
    ) : null;

  /* ---- Variants ---- */

  // HORIZONTAL — single-row toolbar
  if (variant === 'horizontal' || variant === 'toolbar') {
    return (
      <section dir={dir} className="py-6 px-6" style={{ backgroundColor: bgColor || 'transparent', fontFamily: theme.bodyFont, ...style }}>
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Title row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {title && (
                <h3 className="text-lg font-bold" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>
                  <SlidersHorizontal className="h-4 w-4 inline-block mr-2 mb-0.5 opacity-50" />
                  {title}
                </h3>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border/30 hover:bg-muted/20 transition-colors flex items-center gap-1.5"
                style={{ borderRadius: theme.borderRadius, color: theme.secondaryColor }}
              >
                <SlidersHorizontal className="h-3 w-3" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>
            <div className="flex items-center gap-3">
              {showSort && <SortDropdown />}
            </div>
          </div>

          {/* Filters row */}
          {showFilters && (
            <div className={`grid ${variant === 'toolbar' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-4'} gap-4 p-4 rounded-xl border border-border/20 bg-muted/5`} style={{ borderRadius: theme.borderRadius }}>
              {showSearch && (
                <div className="md:col-span-1">
                  <SearchInput />
                </div>
              )}
              {showCategories && (
                <div className="md:col-span-1">
                  <label className="text-xs font-medium opacity-70 mb-1.5 block" style={{ color: theme.textColor }}>Category</label>
                  <CategoryPills />
                </div>
              )}
              {showPriceRange && (
                <div className="md:col-span-1">
                  <PriceSlider />
                </div>
              )}
              {showRating && (
                <div className="md:col-span-1">
                  <RatingFilter />
                </div>
              )}
            </div>
          )}

          <ActiveFiltersBadges />

          {/* Edit hint */}
          {isEditing && (
            <p className="text-[10px] text-center text-muted-foreground opacity-60">
              💡 This filter block works with Product Grid and Carousel blocks on the same page
            </p>
          )}
        </div>
      </section>
    );
  }

  // SIDEBAR — vertical stacked
  if (variant === 'sidebar') {
    return (
      <aside dir={dir} className="py-6 px-4" style={{ backgroundColor: bgColor || 'transparent', fontFamily: theme.bodyFont, ...style }}>
        <div className="space-y-6 max-w-xs">
          {title && (
            <h3 className="text-base font-bold flex items-center gap-2" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>
              <SlidersHorizontal className="h-4 w-4 opacity-50" />
              {title}
            </h3>
          )}

          {showSearch && <SearchInput />}

          {showCategories && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider opacity-50" style={{ color: theme.secondaryColor }}>Categories</label>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                      selectedCategory === cat.value ? 'font-semibold' : 'opacity-70'
                    }`}
                    style={{
                      backgroundColor: selectedCategory === cat.value ? theme.primaryColor + '12' : 'transparent',
                      color: selectedCategory === cat.value ? theme.primaryColor : theme.textColor,
                      borderRadius: theme.borderRadius,
                    }}
                  >
                    {cat.label}
                    {cat.count !== undefined && (
                      <span className="float-right opacity-40">({cat.count})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showPriceRange && <PriceSlider />}
          {showRating && <RatingFilter />}

          {showSort && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider opacity-50" style={{ color: theme.secondaryColor }}>Sort By</label>
              <div className="space-y-1">
                {sortOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSortBy(opt)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                      sortBy === opt ? 'font-semibold' : 'opacity-70'
                    }`}
                    style={{
                      backgroundColor: sortBy === opt ? theme.primaryColor + '12' : 'transparent',
                      color: sortBy === opt ? theme.primaryColor : theme.textColor,
                      borderRadius: theme.borderRadius,
                    }}
                  >
                    {SORT_LABELS[opt]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeFilters.length > 0 && (
            <button
              onClick={clearAll}
              className="w-full py-2 text-xs font-medium border rounded-lg hover:bg-muted/20 transition-colors"
              style={{ borderRadius: theme.borderRadius, color: theme.primaryColor, borderColor: theme.primaryColor + '40' }}
            >
              Clear All Filters
            </button>
          )}
        </div>
      </aside>
    );
  }

  // MINIMAL — just pills + sort inline
  if (variant === 'minimal') {
    return (
      <section dir={dir} className="py-4 px-6" style={{ backgroundColor: bgColor || 'transparent', fontFamily: theme.bodyFont, ...style }}>
        <div className="max-w-6xl mx-auto flex items-center gap-4 flex-wrap">
          {showCategories && <CategoryPills />}
          <div className="flex-1" />
          {showSort && <SortDropdown />}
        </div>
      </section>
    );
  }

  return null;
}
