import React from 'react';
import { SiteTheme } from '../../../types';

interface CommentsBlockProps {
  title?: string;
  comments: Array<{ author: string; text: string; date: string; avatar?: string; likes?: number }>;
  showForm?: boolean;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function CommentsBlock({ title = 'Comments', comments, showForm = true, theme, isEditing, onUpdate, style }: CommentsBlockProps) {
  return (
    <section className="py-10 px-6" style={{ fontFamily: theme.bodyFont, ...style }}>
      <div className="max-w-3xl mx-auto">
        <h3 className="text-xl font-bold mb-6" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>
          {title} ({comments.length})
        </h3>

        {/* Comment form */}
        {showForm && (
          <div className="mb-8 p-4 border rounded-xl" style={{ borderRadius: theme.borderRadius }}>
            <textarea
              placeholder="Write a comment..."
              className="w-full p-3 border rounded-lg text-sm min-h-[80px] outline-none focus:ring-2 focus:ring-primary/30 resize-y"
              style={{ borderRadius: theme.borderRadius }}
            />
            <div className="flex justify-end mt-2">
              <button className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: theme.primaryColor, borderRadius: theme.borderRadius }}>Post Comment</button>
            </div>
          </div>
        )}

        {/* Comments list */}
        <div className="space-y-4">
          {comments.map((c, i) => {
            const initials = c.author.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            return (
              <div key={i} className="flex gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: theme.primaryColor + '15', color: theme.primaryColor }}>
                  {c.avatar ? <img src={c.avatar} alt={c.author} className="w-full h-full rounded-full object-cover" /> : initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm" style={{ color: theme.textColor }}>{c.author}</span>
                    <span className="text-xs opacity-50" style={{ color: theme.secondaryColor }}>{c.date}</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: theme.secondaryColor }}>{c.text}</p>
                  <div className="flex gap-4 mt-2 text-xs" style={{ color: theme.secondaryColor }}>
                    <button className="hover:opacity-70 flex items-center gap-1">
                      <span>👍</span> {c.likes || 0}
                    </button>
                    <button className="hover:opacity-70">Reply</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {comments.length === 0 && (
          <p className="text-center text-sm py-8 opacity-50" style={{ color: theme.secondaryColor }}>No comments yet. Be the first!</p>
        )}
      </div>
    </section>
  );
}
