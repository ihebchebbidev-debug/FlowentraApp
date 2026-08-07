/**
 * HtmlText — Renders a string as HTML when it contains tags, otherwise as plain text.
 * Used across renderer blocks so rich-text formatting from the property editor
 * (bold, italic, underline, colors, etc.) shows up in the live preview.
 */
import React from 'react';
import { sanitizeHtml } from '@/utils/sanitize';

interface HtmlTextProps extends React.HTMLAttributes<HTMLElement> {
  /** The text (may contain HTML tags) */
  content: string;
  /** The HTML tag to render. Defaults to 'span'. */
  as?: keyof React.JSX.IntrinsicElements;
}

const HTML_TAG_REGEX = /<\/?[a-z][\s\S]*?>/i;

export function HtmlText({ content, as: Tag = 'span', ...rest }: HtmlTextProps) {
  if (!content) return null;

  if (HTML_TAG_REGEX.test(content)) {
    // @ts-ignore – Tag is a valid intrinsic element string
    return <Tag {...rest} dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />;
  }

  // @ts-ignore
  return <Tag {...rest}>{content}</Tag>;
}
