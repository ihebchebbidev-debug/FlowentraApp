import { useState, useMemo } from 'react';

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}

export interface PaginationActions {
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setItemsPerPage: (items: number) => void;
}

export interface PaginationInfo {
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startIndex: number;
  endIndex: number;
}

export function usePagination(totalItems: number, defaultItemsPerPage: number = 5) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);

  const paginationInfo = useMemo(() => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const hasNextPage = currentPage < totalPages;
    const hasPreviousPage = currentPage > 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    return {
      totalPages,
      hasNextPage,
      hasPreviousPage,
      startIndex,
      endIndex,
    };
  }, [currentPage, itemsPerPage, totalItems]);

  const actions = useMemo(() => ({
    goToPage: (page: number) => {
      const validPage = Math.max(1, Math.min(page, paginationInfo.totalPages));
      setCurrentPage(validPage);
    },
    nextPage: () => {
      if (paginationInfo.hasNextPage) {
        setCurrentPage(prev => prev + 1);
      }
    },
    previousPage: () => {
      if (paginationInfo.hasPreviousPage) {
        setCurrentPage(prev => prev - 1);
      }
    },
    setItemsPerPage: (items: number) => {
      setItemsPerPage(items);
      setCurrentPage(1); // Reset to first page when changing items per page
    },
  }), [paginationInfo.hasNextPage, paginationInfo.hasPreviousPage, paginationInfo.totalPages]);

  const state: PaginationState = {
    currentPage,
    itemsPerPage,
    totalItems,
  };

  return {
    state,
    actions,
    info: paginationInfo,
  };
}

// Hook for paginating data arrays
export function usePaginatedData<T>(data: T[], itemsPerPage: number = 5) {
  const pagination = usePagination(data.length, itemsPerPage);
  
  const paginatedData = useMemo(() => {
    return data.slice(pagination.info.startIndex, pagination.info.endIndex);
  }, [data, pagination.info.startIndex, pagination.info.endIndex]);

  return {
    ...pagination,
    data: paginatedData,
  };
}