import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FavoriteWidget {
  id: string;
  title: string;
  source: 'Sales' | 'Service' | 'Finance' | 'HR' | 'Purchase';
}

interface FavoritesState {
  widgets: FavoriteWidget[];
  toggle: (w: FavoriteWidget) => void;
  remove: (id: string) => void;
  has: (id: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      widgets: [],
      toggle: (w) => {
        const exists = get().widgets.some((x) => x.id === w.id);
        set({
          widgets: exists
            ? get().widgets.filter((x) => x.id !== w.id)
            : [...get().widgets, w],
        });
      },
      remove: (id) => set({ widgets: get().widgets.filter((x) => x.id !== id) }),
      has: (id) => get().widgets.some((x) => x.id === id),
    }),
    { name: 'reporting-favorites-v1' }
  )
);
