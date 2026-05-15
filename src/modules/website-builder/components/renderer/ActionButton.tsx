/**
 * ActionButton - A button component that executes configured actions
 * Used throughout the website builder for CTAs, nav links, etc.
 */
import React from 'react';
import type { ComponentAction, SitePage, SiteTheme } from '../../types';
import { useActionHandler, createActionFromHref } from '../../hooks/useActionHandler';
import { getButtonStyle } from '../../utils/themeUtils';

interface ActionButtonProps {
  /** Button text */
  children: React.ReactNode;
  /** Action to execute on click */
  action?: ComponentAction;
  /** Legacy href (will be converted to action if no action provided) */
  href?: string;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Full width button */
  fullWidth?: boolean;
  /** Theme for styling */
  theme?: SiteTheme;
  /** Custom background color */
  bgColor?: string;
  /** Custom text color */
  textColor?: string;
  /** Custom class names */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Available pages for navigation */
  pages?: SitePage[];
  /** Disabled state */
  disabled?: boolean;
  /** Icon element */
  icon?: React.ReactNode;
  /** Icon position */
  iconPosition?: 'left' | 'right';
  /** onClick override (for editing mode) */
  onClick?: (e: React.MouseEvent) => void;
}

export function ActionButton({
  children,
  action,
  href,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  theme,
  bgColor,
  textColor,
  className = '',
  style = {},
  pages = [],
  disabled = false,
  icon,
  iconPosition = 'left',
  onClick,
}: ActionButtonProps) {
  const { executeAction, getActionHref, getActionTarget, getActionRel } = useActionHandler({ pages });

  // Use provided action or create from href
  const resolvedAction = action || (href ? createActionFromHref(href) : undefined);

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e);
      return;
    }
    if (disabled) {
      e.preventDefault();
      return;
    }
    executeAction(resolvedAction, e);
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-8 py-3.5 text-lg',
  };

  // Base button style from theme
  const buttonStyle = theme ? getButtonStyle(variant, theme) : {};

  // Apply custom colors
  const customStyle: React.CSSProperties = {
    ...buttonStyle,
    ...(bgColor && { backgroundColor: bgColor }),
    ...(textColor && { color: textColor }),
    ...style,
  };

  const linkHref = getActionHref(resolvedAction);
  const linkTarget = getActionTarget(resolvedAction);
  const linkRel = getActionRel(resolvedAction);

  const content = (
    <>
      {icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
    </>
  );

  // Use anchor for SEO when we have a valid href, button otherwise
  const isLink = resolvedAction && resolvedAction.type !== 'none' && resolvedAction.type !== 'modal' && resolvedAction.type !== 'custom';

  if (isLink) {
    return (
      <a
        href={linkHref}
        target={linkTarget}
        rel={linkRel}
        onClick={handleClick}
        className={`
          inline-flex items-center justify-center font-medium rounded-lg transition-all
          hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]
          ${sizeClasses[size]}
          ${fullWidth ? 'w-full' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
        style={customStyle}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center font-medium rounded-lg transition-all
        hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      style={customStyle}
    >
      {content}
    </button>
  );
}

/**
 * ActionLink - An anchor component that executes configured actions
 * For inline text links, nav items, etc.
 */
interface ActionLinkProps {
  children: React.ReactNode;
  action?: ComponentAction;
  href?: string;
  className?: string;
  style?: React.CSSProperties;
  pages?: SitePage[];
  onClick?: (e: React.MouseEvent) => void;
}

export function ActionLink({
  children,
  action,
  href,
  className = '',
  style = {},
  pages = [],
  onClick,
}: ActionLinkProps) {
  const { executeAction, getActionHref, getActionTarget, getActionRel } = useActionHandler({ pages });

  const resolvedAction = action || (href ? createActionFromHref(href) : undefined);

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e);
      return;
    }
    executeAction(resolvedAction, e);
  };

  return (
    <a
      href={getActionHref(resolvedAction)}
      target={getActionTarget(resolvedAction)}
      rel={getActionRel(resolvedAction)}
      onClick={handleClick}
      className={className}
      style={style}
    >
      {children}
    </a>
  );
}
