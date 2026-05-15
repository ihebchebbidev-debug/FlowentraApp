import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { articlesApi, categoriesApi, locationsApi, transactionsApi } from '@/services/api/articlesApi';
import type {
  Article,
  CreateArticleRequest,
  UpdateArticleRequest,
  ArticleSearchParams,
  CreateCategoryRequest,
  CreateLocationRequest,
  CreateTransactionRequest,
} from '@/types/articles';
import { toast } from 'sonner';

// =====================================================
// Articles Hooks
// =====================================================

export const useArticles = (params?: ArticleSearchParams) => {
  const queryClient = useQueryClient();

  // Fetch all articles - no caching to ensure fresh data
  const { data, isLoading, error } = useQuery({
    queryKey: ['articles', params],
    queryFn: async () => {
      const result = await articlesApi.getAll(params);
      console.log('useArticles: Fetched articles from API:', result.data?.map((a: any) => ({ id: a.id, name: a.name, type: a.type })));
      return result;
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  // Create article
  const createMutation = useMutation({
    mutationFn: (request: CreateArticleRequest) => {
      console.log('useArticles: Creating article with request:', request);
      return articlesApi.create(request);
    },
    onSuccess: (data) => {
      console.log('useArticles: Article created successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Article created successfully');
    },
    onError: (error: Error) => {
      console.error('useArticles: Failed to create article:', error);
      toast.error(error.message || 'Failed to create article');
    },
  });

  // Update article
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateArticleRequest }) => 
      articlesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Article updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update article');
    },
  });

  // Delete article
  const deleteMutation = useMutation({
    mutationFn: (id: string) => articlesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Article deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete article');
    },
  });

  return {
    articles: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    error,
    createArticle: createMutation.mutate,
    updateArticle: updateMutation.mutate,
    deleteArticle: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

// Fetch single article
export const useArticle = (id?: string) => {
  return useQuery({
    queryKey: ['article', id],
    queryFn: () => articlesApi.getById(id!),
    enabled: !!id,
  });
};

// =====================================================
// Categories Hooks
// =====================================================

export const useCategories = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['article-categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (request: CreateCategoryRequest) => categoriesApi.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article-categories'] });
      toast.success('Category created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create category');
    },
  });

  return {
    categories: data || [],
    isLoading,
    error,
    createCategory: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
};

// =====================================================
// Locations Hooks
// =====================================================

export const useLocations = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (request: CreateLocationRequest) => locationsApi.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Location created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create location');
    },
  });

  return {
    locations: data || [],
    isLoading,
    error,
    createLocation: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
};

// =====================================================
// Inventory Transactions Hooks
// =====================================================

export const useArticleTransactions = (articleId?: string) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['transactions', articleId],
    queryFn: () => transactionsApi.getByArticle(articleId!),
    enabled: !!articleId,
  });

  const createMutation = useMutation({
    mutationFn: (request: CreateTransactionRequest) => transactionsApi.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Transaction recorded successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to record transaction');
    },
  });

  return {
    transactions: data || [],
    isLoading,
    error,
    createTransaction: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
};

// =====================================================
// Groups Hooks
// =====================================================

export const useGroups = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['article-groups'],
    queryFn: async () => {
      const result = await articlesApi.getGroups();
      console.log('useGroups: Fetched groups:', result);
      return result;
    },
  });

  const createMutation = useMutation({
    mutationFn: (request: CreateLocationRequest) => articlesApi.createGroup(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article-groups'] });
      toast.success('Group created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create group');
    },
  });

  return {
    groups: data || [],
    isLoading,
    error,
    createGroup: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
};
