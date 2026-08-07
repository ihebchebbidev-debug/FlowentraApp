// Database Tables/Entities for Articles Module
export interface Article {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  authorId: string;
  categoryId?: string;
  tags: string[];
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArticleCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
}

export interface ArticleComment {
  id: string;
  articleId: string;
  content: string;
  authorName: string;
  authorEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  parentId?: string;
  createdAt: Date;
}

export interface ArticleView {
  id: string;
  articleId: string;
  viewerId?: string;
  ipAddress: string;
  userAgent: string;
  viewedAt: Date;
}
