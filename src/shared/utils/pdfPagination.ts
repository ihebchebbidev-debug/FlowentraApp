/**
 * PDF Pagination Utility
 * Intelligently batches PDF content to avoid empty spaces and breaks large tables across pages
 */

export interface PaginationConfig {
  rowsPerPage: number;           // Number of rows per page (default: 15)
  minRowsForNewPage: number;     // Minimum rows to justify new page (default: 3)
  pageHeight: number;            // Available space per page in points (default: 720)
  headerHeight: number;          // Space needed for headers (default: 120)
  footerHeight: number;          // Space needed for footer (default: 60)
  rowHeight: number;             // Approximate height per row (default: 28)
  groupHeaderHeight: number;      // Space for group header (default: 30)
  installationTableHeight: number; // Space for installation details (default: 80)
}

export interface ItemWithGroup {
  id: string;
  itemName: string;
  installationId?: string;
  installationName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  [key: string]: any;
}

export interface GroupedItems {
  groupKey: string;
  groupLabel: string;
  items: ItemWithGroup[];
  installationId?: string;
}

export interface PageBatch {
  pageNumber: number;
  groups: Array<{
    groupKey: string;
    groupLabel: string;
    items: ItemWithGroup[];
    installationId?: string;
    isFirstGroupOnPage: boolean;
    isContinued: boolean;
  }>;
}

export interface PaginationResult {
  totalPages: number;
  batches: PageBatch[];
  hasOverflow: boolean;
  totalItemsProcessed: number;
}

/**
 * Default pagination configuration optimized for A4 paper
 */
export const defaultPaginationConfig: PaginationConfig = {
  rowsPerPage: 15,
  minRowsForNewPage: 3,
  pageHeight: 792, // 11 inches in points
  headerHeight: 150,
  footerHeight: 60,
  rowHeight: 28,
  groupHeaderHeight: 25,
  installationTableHeight: 90,
};

/**
 * Group items by installation
 */
export function groupItemsByInstallation(items: ItemWithGroup[]): GroupedItems[] {
  const groups: Map<string, ItemWithGroup[]> = new Map();
  const generalItems: ItemWithGroup[] = [];

  items.forEach((item) => {
    if (item.installationId && item.installationName) {
      const key = String(item.installationId);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    } else {
      generalItems.push(item);
    }
  });

  const result: GroupedItems[] = [];

  // Add general items first
  if (generalItems.length > 0) {
    result.push({
      groupKey: '_general',
      groupLabel: 'General Items',
      items: generalItems,
    });
  }

  // Add installation groups
  groups.forEach((items, key) => {
    result.push({
      groupKey: key,
      groupLabel: `Installation: ${items[0].installationName}`,
      items,
      installationId: key,
    });
  });

  return result;
}

/**
 * Calculate the space required for a group on a page
 */
export function calculateGroupHeight(
  group: GroupedItems,
  config: PaginationConfig,
  hasInstallationData: boolean = false
): number {
  let height = config.groupHeaderHeight;

  if (hasInstallationData && group.installationId) {
    height += config.installationTableHeight;
  }

  // Table header
  height += 35;

  // Row heights
  height += group.items.length * config.rowHeight;

  // Group subtotal
  height += 25;

  return height;
}

/**
 * Intelligently batch items across pages, trying to minimize empty space
 */
export function paginateItems(
  items: ItemWithGroup[],
  config: PaginationConfig = defaultPaginationConfig,
  hasInstallationData: boolean = false
): PaginationResult {
  const groups = groupItemsByInstallation(items);

  if (groups.length === 0) {
    return {
      totalPages: 1,
      batches: [],
      hasOverflow: false,
      totalItemsProcessed: 0,
    };
  }

  const batches: PageBatch[] = [];
  let currentPageNumber = 1;
  let currentPageUsedHeight = config.headerHeight;
  let currentPageGroups: PageBatch['groups'] = [];
  let totalItemsProcessed = 0;

  groups.forEach((group, groupIndex) => {
    const groupHeight = calculateGroupHeight(group, config, hasInstallationData);
    const availableSpace = config.pageHeight - currentPageUsedHeight - config.footerHeight;

    // Check if group fits on current page
    const groupFitsOnCurrentPage = groupHeight <= availableSpace;
    const hasEnoughItemsForNewPage = group.items.length >= config.minRowsForNewPage;
    const shouldStartNewPage = !groupFitsOnCurrentPage && currentPageGroups.length > 0;

    if (shouldStartNewPage) {
      // Save current page and start new one
      batches.push({
        pageNumber: currentPageNumber,
        groups: currentPageGroups,
      });

      currentPageNumber++;
      currentPageUsedHeight = config.headerHeight;
      currentPageGroups = [];
    }

    // If group is too large, split it
    if (groupHeight > config.pageHeight - config.headerHeight - config.footerHeight) {
      // Split large groups into smaller chunks
      const subBatches = splitLargeGroup(group, config, hasInstallationData, currentPageNumber);
      subBatches.forEach((batch, batchIndex) => {
        if (batchIndex > 0) {
          batches.push({
            pageNumber: currentPageNumber,
            groups: currentPageGroups,
          });
          currentPageNumber++;
          currentPageUsedHeight = config.headerHeight;
          currentPageGroups = [];
        }

        batch.groups.forEach((g) => {
          currentPageGroups.push(g);
          currentPageUsedHeight += calculateGroupHeight(g, config, hasInstallationData);
        });
      });
    } else {
      // Group fits, add it
      const isFirstGroup = currentPageGroups.length === 0;
      currentPageGroups.push({
        groupKey: group.groupKey,
        groupLabel: group.groupLabel,
        items: group.items,
        installationId: group.installationId,
        isFirstGroupOnPage: isFirstGroup,
        isContinued: false,
      });

      currentPageUsedHeight += groupHeight;
      totalItemsProcessed += group.items.length;
    }
  });

  // Add final page
  if (currentPageGroups.length > 0) {
    batches.push({
      pageNumber: currentPageNumber,
      groups: currentPageGroups,
    });
  }

  return {
    totalPages: batches.length,
    batches,
    hasOverflow: false,
    totalItemsProcessed,
  };
}

/**
 * Split a large group into multiple pages
 */
function splitLargeGroup(
  group: GroupedItems,
  config: PaginationConfig,
  hasInstallationData: boolean,
  startPageNumber: number
): PageBatch[] {
  const batches: PageBatch[] = [];
  const itemChunks: ItemWithGroup[][] = [];
  let currentChunk: ItemWithGroup[] = [];
  let currentChunkHeight = 0;

  const maxHeightPerChunk =
    config.pageHeight - config.headerHeight - config.footerHeight - 60; // Leave margin

  group.items.forEach((item) => {
    const itemHeight = config.rowHeight;

    if (currentChunkHeight + itemHeight > maxHeightPerChunk && currentChunk.length > 0) {
      itemChunks.push(currentChunk);
      currentChunk = [item];
      currentChunkHeight = itemHeight;
    } else {
      currentChunk.push(item);
      currentChunkHeight += itemHeight;
    }
  });

  if (currentChunk.length > 0) {
    itemChunks.push(currentChunk);
  }

  itemChunks.forEach((chunk, chunkIndex) => {
    const isContinued = chunkIndex > 0;
    batches.push({
      pageNumber: startPageNumber + chunkIndex,
      groups: [
        {
          groupKey: group.groupKey,
          groupLabel: isContinued ? `${group.groupLabel} (continued)` : group.groupLabel,
          items: chunk,
          installationId: group.installationId,
          isFirstGroupOnPage: chunkIndex === 0,
          isContinued,
        },
      ],
    });
  });

  return batches;
}

/**
 * Calculate if content fits on single page
 */
export function fitsSinglePage(
  items: ItemWithGroup[],
  config: PaginationConfig = defaultPaginationConfig,
  hasInstallationData: boolean = false
): boolean {
  const groups = groupItemsByInstallation(items);
  let totalHeight = config.headerHeight + config.footerHeight;

  for (const group of groups) {
    totalHeight += calculateGroupHeight(group, config, hasInstallationData);
  }

  return totalHeight <= config.pageHeight;
}

/**
 * Optimize configuration for number of items
 */
export function optimizeConfigForItemCount(
  itemCount: number,
  baseConfig: PaginationConfig = defaultPaginationConfig
): PaginationConfig {
  if (itemCount <= 10) {
    return { ...baseConfig, rowsPerPage: 10 };
  } else if (itemCount <= 30) {
    return { ...baseConfig, rowsPerPage: 15 };
  } else if (itemCount <= 100) {
    return { ...baseConfig, rowsPerPage: 20 };
  } else {
    return { ...baseConfig, rowsPerPage: 25 };
  }
}

/**
 * Calculate space waste (empty space on last page)
 */
export function calculateSpaceWaste(
  items: ItemWithGroup[],
  config: PaginationConfig = defaultPaginationConfig,
  hasInstallationData: boolean = false
): number {
  const result = paginateItems(items, config, hasInstallationData);
  if (result.batches.length === 0) return 0;

  const lastBatch = result.batches[result.batches.length - 1];
  let lastPageHeight = config.headerHeight + config.footerHeight;

  for (const group of lastBatch.groups) {
    const groupAsGroupedItem: GroupedItems = {
      groupKey: group.groupKey,
      groupLabel: group.groupLabel,
      items: group.items,
      installationId: group.installationId,
    };
    lastPageHeight += calculateGroupHeight(groupAsGroupedItem, config, hasInstallationData);
  }

  const wasteSpace = Math.max(0, config.pageHeight - lastPageHeight);
  const wastePercentage = (wasteSpace / config.pageHeight) * 100;

  return wastePercentage;
}
