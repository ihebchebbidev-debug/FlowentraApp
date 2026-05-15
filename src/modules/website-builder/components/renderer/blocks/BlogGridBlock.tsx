import React from 'react';
import { SiteTheme } from '../../../types';

interface BlogGridBlockProps {
  title?: string;
  posts: Array<{ title: string; excerpt: string; imageUrl?: string; date?: string; author?: string; category?: string }>;
  columns?: number;
  theme: SiteTheme;
  style?: React.CSSProperties;
}

export function BlogGridBlock({ title, posts, columns = 3, theme, style }: BlogGridBlockProps) {
  // Use static Tailwind classes (dynamic classes like `grid-cols-${n}` get purged)
  const colClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[columns] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <section className="py-12 px-6" style={{ fontFamily: theme.bodyFont, ...style }}>
      <div className="max-w-6xl mx-auto">
        {title && <h3 className="text-xl sm:text-2xl font-bold mb-8" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>{title}</h3>}
        <div className={`grid ${colClass} gap-6`}>
          {posts.map((post, i) => (
            <article key={i} className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow" style={{ borderRadius: theme.borderRadius }}>
              {post.imageUrl ? (
                <div className="aspect-video bg-muted">
                  <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <span className="text-3xl opacity-30">📝</span>
                </div>
              )}
              <div className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2 text-xs flex-wrap" style={{ color: theme.secondaryColor }}>
                  {post.category && <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.primaryColor + '15', color: theme.primaryColor }}>{post.category}</span>}
                  {post.date && <span>{post.date}</span>}
                </div>
                <h4 className="font-semibold text-sm sm:text-base mb-2 line-clamp-2" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>{post.title}</h4>
                <p className="text-xs sm:text-sm opacity-75 line-clamp-3" style={{ color: theme.secondaryColor }}>{post.excerpt}</p>
                {post.author && <p className="text-xs mt-3 opacity-60" style={{ color: theme.secondaryColor }}>By {post.author}</p>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
