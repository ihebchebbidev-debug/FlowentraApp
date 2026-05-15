/**
 * Hook for executing component actions (navigation, scroll, email, etc.)
 */
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ComponentAction, SitePage } from '../types';

interface UseActionHandlerOptions {
  pages?: SitePage[];
  currentPageId?: string;
  onModalOpen?: (modalId: string) => void;
}

export function useActionHandler(options: UseActionHandlerOptions = {}) {
  const { pages = [], currentPageId, onModalOpen } = options;
  const navigate = useNavigate();

  const executeAction = useCallback((action: ComponentAction | undefined, e?: React.MouseEvent) => {
    if (!action || action.type === 'none') return;

    // Prevent default link behavior if event provided
    if (e) {
      e.preventDefault();
    }

    switch (action.type) {
      case 'page': {
        // Navigate to internal page
        if (action.pageId) {
          const targetPage = pages.find(p => p.id === action.pageId || p.slug === action.pageId);
          if (targetPage) {
            // For website preview, we navigate within the builder
            // In published site, this would be actual navigation
            const slug = targetPage.isHomePage ? '/' : `/${targetPage.slug}`;
            navigate(slug);
          }
        }
        break;
      }

      case 'url': {
        // Navigate to external URL
        if (action.url) {
          if (action.openInNewTab) {
            window.open(action.url, '_blank', 'noopener,noreferrer');
          } else {
            window.location.href = action.url;
          }
        }
        break;
      }

      case 'section': {
        // Scroll to section on current page
        if (action.sectionId) {
          const element = document.getElementById(action.sectionId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
        break;
      }

      case 'email': {
        // Open email client
        if (action.email) {
          window.location.href = `mailto:${action.email}`;
        }
        break;
      }

      case 'phone': {
        // Open phone dialer
        if (action.phone) {
          window.location.href = `tel:${action.phone}`;
        }
        break;
      }

      case 'download': {
        // Download file
        if (action.fileUrl) {
          const link = document.createElement('a');
          link.href = action.fileUrl;
          link.download = action.fileUrl.split('/').pop() || 'download';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        break;
      }

      case 'modal': {
        // Open modal/popup
        if (action.modalId && onModalOpen) {
          onModalOpen(action.modalId);
        }
        break;
      }

      case 'custom': {
        // Custom handler - emit event that can be caught
        if (action.customHandler) {
          window.dispatchEvent(new CustomEvent('website-builder-action', {
            detail: { handler: action.customHandler, action }
          }));
        }
        break;
      }

      default:
        break;
    }
  }, [pages, navigate, onModalOpen]);

  /**
   * Get href for an action (for SEO/accessibility)
   */
  const getActionHref = useCallback((action: ComponentAction | undefined): string => {
    if (!action || action.type === 'none') return '#';

    switch (action.type) {
      case 'page': {
        if (action.pageId) {
          const targetPage = pages.find(p => p.id === action.pageId || p.slug === action.pageId);
          if (targetPage) {
            return targetPage.isHomePage ? '/' : `/${targetPage.slug}`;
          }
        }
        return '#';
      }
      case 'url':
        return action.url || '#';
      case 'section':
        return action.sectionId ? `#${action.sectionId}` : '#';
      case 'email':
        return action.email ? `mailto:${action.email}` : '#';
      case 'phone':
        return action.phone ? `tel:${action.phone}` : '#';
      case 'download':
        return action.fileUrl || '#';
      default:
        return '#';
    }
  }, [pages]);

  /**
   * Get link target for an action
   */
  const getActionTarget = useCallback((action: ComponentAction | undefined): string | undefined => {
    if (action?.type === 'url' && action.openInNewTab) {
      return '_blank';
    }
    return undefined;
  }, []);

  /**
   * Get rel attribute for an action
   */
  const getActionRel = useCallback((action: ComponentAction | undefined): string | undefined => {
    if (action?.type === 'url' && action.openInNewTab) {
      return 'noopener noreferrer';
    }
    return undefined;
  }, []);

  return {
    executeAction,
    getActionHref,
    getActionTarget,
    getActionRel,
  };
}

/**
 * Helper to create action from legacy href string
 */
export function createActionFromHref(href: string): ComponentAction {
  if (!href || href === '#') {
    return { type: 'none' };
  }

  // Check for email
  if (href.startsWith('mailto:')) {
    return { type: 'email', email: href.replace('mailto:', '') };
  }

  // Check for phone
  if (href.startsWith('tel:')) {
    return { type: 'phone', phone: href.replace('tel:', '') };
  }

  // Check for section anchor
  if (href.startsWith('#') && href.length > 1) {
    return { type: 'section', sectionId: href.substring(1) };
  }

  // Check for external URL
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return { type: 'url', url: href, openInNewTab: true };
  }

  // Check for internal page (starts with /)
  if (href.startsWith('/')) {
    return { type: 'page', pageId: href.substring(1) || 'home' };
  }

  // Default to URL
  return { type: 'url', url: href };
}
