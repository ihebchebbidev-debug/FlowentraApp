// Low Stock Notification Service
// Creates notifications when materials fall below minimum stock levels

import { notificationsApi } from '@/services/api/notificationsApi';
import type { MaterialStock } from '@/modules/stock-management/types';

interface LowStockNotificationData {
  articleId: string;
  articleName: string;
  stock: number;
  minStock: number;
  userId: number;
}

// Create a low stock notification
export async function createLowStockNotification(data: LowStockNotificationData): Promise<boolean> {
  try {
    const isOutOfStock = data.stock <= 0;
    
    const notification = await notificationsApi.create({
      userId: data.userId,
      title: isOutOfStock ? 'Out of Stock Alert' : 'Low Stock Alert',
      description: isOutOfStock 
        ? `Material '${data.articleName}' is out of stock! Immediate replenishment required.`
        : `Material '${data.articleName}' is running low. Current stock: ${data.stock} (minimum: ${data.minStock})`,
      type: isOutOfStock ? 'warning' : 'info',
      category: 'system',
      link: `/dashboard/stock-management`,
      relatedEntityId: parseInt(data.articleId) || undefined,
      relatedEntityType: 'article',
    });

    return notification !== null;
  } catch (error) {
    console.error('Failed to create low stock notification:', error);
    return false;
  }
}

// Create a stock replenished notification
export async function createStockReplenishedNotification(data: {
  articleId: string;
  articleName: string;
  newStock: number;
  userId: number;
}): Promise<boolean> {
  try {
    const notification = await notificationsApi.create({
      userId: data.userId,
      title: 'Stock Replenished',
      description: `Stock for '${data.articleName}' has been replenished. New stock level: ${data.newStock} units`,
      type: 'success',
      category: 'system',
      link: `/dashboard/stock-management`,
      relatedEntityId: parseInt(data.articleId) || undefined,
      relatedEntityType: 'article',
    });

    return notification !== null;
  } catch (error) {
    console.error('Failed to create stock replenished notification:', error);
    return false;
  }
}

// Check if stock level should trigger a notification
export function shouldNotifyLowStock(
  currentStock: number, 
  minStock: number, 
  previousStock?: number
): boolean {
  // Notify if current stock is at or below minimum
  if (currentStock <= minStock) {
    // If we have previous stock info, only notify if we just crossed the threshold
    if (previousStock !== undefined) {
      return previousStock > minStock && currentStock <= minStock;
    }
    return true;
  }
  return false;
}

// Check multiple materials for low stock
export async function checkAndNotifyLowStockMaterials(
  materials: MaterialStock[],
  userId: number
): Promise<{ notified: number; errors: number }> {
  let notified = 0;
  let errors = 0;

  for (const material of materials) {
    if (material.stock <= material.minStock) {
      const success = await createLowStockNotification({
        articleId: material.id,
        articleName: material.name,
        stock: material.stock,
        minStock: material.minStock,
        userId,
      });

      if (success) {
        notified++;
      } else {
        errors++;
      }
    }
  }

  return { notified, errors };
}

export const lowStockNotificationService = {
  createLowStockNotification,
  createStockReplenishedNotification,
  shouldNotifyLowStock,
  checkAndNotifyLowStockMaterials,
};
