import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dynamicFormsService } from '../services/dynamicFormsService';
import { DynamicForm, FormStatus, CreateDynamicFormDto, UpdateDynamicFormDto, SubmitFormResponseDto } from '../types';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useActionLogger } from '@/hooks/useActionLogger';

const QUERY_KEY = 'dynamic-forms';

export function useDynamicForms(filters?: { status?: FormStatus; category?: string; search?: string }) {
  const { logSearch, logFilter } = useActionLogger('DynamicForms');
  
  const query = useQuery({
    queryKey: [QUERY_KEY, filters],
    queryFn: () => dynamicFormsService.getAll(filters),
    staleTime: 30000,
  });

  // Log search when filters change
  if (filters?.search && query.data) {
    logSearch(filters.search, query.data.length, { entityType: 'DynamicForm' });
  }
  
  return query;
}

export function useDynamicForm(id: number | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => dynamicFormsService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateDynamicForm() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation('dynamic-forms');
  const { logFormSubmit } = useActionLogger('DynamicForms');
  
  return useMutation({
    mutationFn: (dto: CreateDynamicFormDto) => dynamicFormsService.create(dto),
    retry: 1, // Retry once on failure (helps with cold start timeouts)
    retryDelay: 2000, // Wait 2 seconds before retry
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      logFormSubmit('Create Dynamic Form', true, {
        entityType: 'DynamicForm',
        entityId: data.id,
        details: `Created form: ${data.name_en}`,
      });
      toast({
        title: t('create.success'),
      });
    },
    onError: (error: any) => {
      const isNetworkError = error.message?.includes('Failed to fetch') || error.message?.includes('Network');
      logFormSubmit('Create Dynamic Form', false, {
        entityType: 'DynamicForm',
        details: `Error: ${error.message || 'Unknown error'}`,
      });
      toast({
        title: t('create.error'),
        description: isNetworkError 
          ? t('errors.network_error', 'Network error. The server may be starting up. Please try again.')
          : error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateDynamicForm() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation('dynamic-forms');
  const { logFormSubmit } = useActionLogger('DynamicForms');
  
  return useMutation({
    mutationFn: (dto: UpdateDynamicFormDto) => dynamicFormsService.update(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.setQueryData([QUERY_KEY, data.id], data);
      logFormSubmit('Update Dynamic Form', true, {
        entityType: 'DynamicForm',
        entityId: data.id,
        details: `Updated form: ${data.name_en}`,
      });
      toast({
        title: t('edit.success'),
      });
    },
    onError: (error: any) => {
      logFormSubmit('Update Dynamic Form', false, {
        entityType: 'DynamicForm',
        details: `Error: ${error.message || 'Unknown error'}`,
      });
      toast({
        title: t('edit.error'),
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteDynamicForm() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation('dynamic-forms');
  const { logAction } = useActionLogger('DynamicForms');
  
  return useMutation({
    mutationFn: (id: number) => dynamicFormsService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      logAction('delete', 'Deleted dynamic form', {
        entityType: 'DynamicForm',
        entityId: id,
        details: `Deleted form with ID: ${id}`,
      });
      toast({
        title: t('delete.success'),
      });
    },
    onError: (error: any, id) => {
      logAction('delete_error', 'Failed to delete dynamic form', {
        entityType: 'DynamicForm',
        entityId: id,
        details: `Error: ${error.message || 'Unknown error'}`,
      });
      toast({
        title: t('delete.error'),
        variant: 'destructive',
      });
    },
  });
}

export function useDuplicateDynamicForm() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation('dynamic-forms');
  const { logAction } = useActionLogger('DynamicForms');
  
  return useMutation({
    mutationFn: (id: number) => dynamicFormsService.duplicate(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      logAction('duplicate', 'Duplicated dynamic form', {
        entityType: 'DynamicForm',
        entityId: data.id,
        details: `Duplicated form ID ${id} to new form: ${data.name_en}`,
      });
      toast({
        title: t('duplicate.success'),
      });
    },
    onError: (error: any, id) => {
      logAction('duplicate_error', 'Failed to duplicate dynamic form', {
        entityType: 'DynamicForm',
        entityId: id,
        details: `Error: ${error.message || 'Unknown error'}`,
      });
      toast({
        title: t('duplicate.error'),
        variant: 'destructive',
      });
    },
  });
}

export function useChangeFormStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation('dynamic-forms');
  const { logAction } = useActionLogger('DynamicForms');
  
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: FormStatus }) => 
      dynamicFormsService.changeStatus(id, status),
    onSuccess: (data, { id, status }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.setQueryData([QUERY_KEY, data.id], data);
      logAction('status_change', `Changed form status to ${status}`, {
        entityType: 'DynamicForm',
        entityId: id,
        details: `Changed status to ${status} for form: ${data.name_en}`,
      });
      toast({
        title: t(`status_change.${data.status}`),
      });
    },
    onError: (error: any, { id, status }) => {
      logAction('status_change_error', 'Failed to change form status', {
        entityType: 'DynamicForm',
        entityId: id,
        details: `Error changing to ${status}: ${error.message || 'Unknown error'}`,
      });
      toast({
        title: t('status_change.error'),
        variant: 'destructive',
      });
    },
  });
}

export function useTogglePublicSharing() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation('dynamic-forms');
  const { logAction } = useActionLogger('DynamicForms');
  
  return useMutation({
    mutationFn: ({ id, isPublic, publicSlug }: { id: number; isPublic: boolean; publicSlug?: string }) => 
      dynamicFormsService.updatePublicSharing(id, isPublic, publicSlug),
    onSuccess: (data, { id, isPublic }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.setQueryData([QUERY_KEY, data.id], data);
      logAction('public_toggle', `${isPublic ? 'Enabled' : 'Disabled'} public sharing`, {
        entityType: 'DynamicForm',
        entityId: id,
        details: `${isPublic ? 'Enabled' : 'Disabled'} public sharing for form: ${data.name_en}`,
      });
      toast({
        title: isPublic ? t('sharing.enabled') : t('sharing.disabled'),
      });
    },
    onError: (error: any, { id, isPublic }) => {
      logAction('public_toggle_error', 'Failed to toggle public sharing', {
        entityType: 'DynamicForm',
        entityId: id,
        details: `Error: ${error.message || 'Unknown error'}`,
      });
      toast({
        title: t('sharing.update_error'),
        variant: 'destructive',
      });
    },
  });
}

export function useFormResponses(formId: number | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, formId, 'responses'],
    queryFn: () => dynamicFormsService.getResponses(formId!),
    enabled: !!formId,
  });
}

export function useSubmitFormResponse() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation('dynamic-forms');
  const { logFormSubmit } = useActionLogger('DynamicForms');
  
  return useMutation({
    mutationFn: (dto: SubmitFormResponseDto) => dynamicFormsService.submitResponse(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.form_id, 'responses'] });
      logFormSubmit('Submit Form Response', true, {
        entityType: 'DynamicFormResponse',
        entityId: data.id,
        details: `Submitted response for form ID: ${data.form_id}`,
      });
      toast({
        title: t('responses.submit_success'),
      });
    },
    onError: (error: any) => {
      logFormSubmit('Submit Form Response', false, {
        entityType: 'DynamicFormResponse',
        details: `Error: ${error.message || 'Unknown error'}`,
      });
      toast({
        title: t('responses.submit_error'),
        variant: 'destructive',
      });
    },
  });
}

export function useFormResponseCount(formId: number) {
  return useQuery({
    queryKey: [QUERY_KEY, formId, 'count'],
    queryFn: () => dynamicFormsService.getResponseCount(formId),
    staleTime: 60000,
  });
}
