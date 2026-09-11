// hooks/useSchoolData.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/app/lib/api';

export function useAnnouncements(isPublic = false) {
  return useQuery({
    queryKey: ['announcements', { public: isPublic }],
    queryFn: async () => {
      const endpoint = isPublic ? '/announcements' : '/announcements';
      const { data } = await api.get(endpoint);
      return data?.announcements || data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useTeachers() {
  return useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data } = await api.get('/teachers');
      return data?.teachers || data || [];
    },
  });
}

export function useTogglePin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isPinned }: { id: string; isPinned: boolean }) => {
      return api.patch(`/announcements/${id}`, { isPinned });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
}