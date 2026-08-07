import { FormField } from '../types';

export interface FormPage {
  pageNumber: number;
  title_en?: string;
  title_fr?: string;
  fields: FormField[];
}

/**
 * Organizes form fields into pages based on page_break fields
 * @param fields - All form fields
 * @returns Array of pages with their fields
 */
export function organizeFieldsIntoPages(fields: FormField[]): FormPage[] {
  const sortedFields = [...fields].sort((a, b) => a.order - b.order);
  const pages: FormPage[] = [];
  let currentPage: FormPage = {
    pageNumber: 1,
    fields: [],
  };

  sortedFields.forEach((field) => {
    if (field.type === 'page_break') {
      // Save current page if it has fields
      if (currentPage.fields.length > 0) {
        pages.push(currentPage);
      }
      // Start new page with the page break's label as title
      currentPage = {
        pageNumber: pages.length + 2,
        title_en: field.label_en,
        title_fr: field.label_fr,
        fields: [],
      };
    } else {
      currentPage.fields.push(field);
    }
  });

  // Add the last page if it has fields
  if (currentPage.fields.length > 0) {
    pages.push(currentPage);
  }

  // Renumber pages
  pages.forEach((page, index) => {
    page.pageNumber = index + 1;
  });

  return pages;
}

/**
 * Checks if a form has multiple pages
 * @param fields - All form fields
 * @returns True if the form has page breaks
 */
export function isMultiPageForm(fields: FormField[]): boolean {
  return fields.some(field => field.type === 'page_break');
}

/**
 * Gets the total number of pages in a form
 * @param fields - All form fields
 * @returns Number of pages
 */
export function getPageCount(fields: FormField[]): number {
  const pageBreaks = fields.filter(f => f.type === 'page_break').length;
  return pageBreaks + 1;
}
