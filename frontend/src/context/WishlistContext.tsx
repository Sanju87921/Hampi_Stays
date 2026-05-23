import React, { createContext, useContext, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { apiClient } from '../utils/apiClient';
import type { Resort } from '../types/resort';

interface WishlistContextType {
  wishlist: Resort[];
  isLoading: boolean;
  isFavorite: (resortId: string) => boolean;
  toggleWishlist: (resortId: string) => Promise<void>;
  refreshWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 1. Centralized Wishlist Query
  const { data: wishlist = [], isLoading } = useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const data = await apiClient.get<any[]>(`/users/${user.id}/wishlist`);
      if (!Array.isArray(data)) return [];
      return data.map((r: any) => ({
        ...r,
        location: {
          area: r.locationArea || "Hampi",
          district: "Hampi",
          state: "Karnataka",
          lat: r.locationLat || 15.3350,
          lng: r.locationLng || 76.4600,
          distanceFromCenterKm: 5
        }
      })) as Resort[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // 2. Optimistic Mutation
  const mutation = useMutation({
    mutationFn: async (resortId: string) => {
      if (!user) throw new Error('Not authenticated');
      return apiClient.post<{ saved: boolean }>(`/wishlist/toggle`, {
        userId: user.id,
        resortId
      });
    },
    // This is the "Instant" part
    onMutate: async (resortId) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['wishlist', user?.id] });

      // Snapshot the previous value
      const previousWishlist = queryClient.getQueryData<Resort[]>(['wishlist', user?.id]);

      // Optimistically update to the new value
      if (previousWishlist) {
        const isCurrentlyFavorite = previousWishlist.some(r => r.id === resortId);
        const newWishlist = isCurrentlyFavorite
          ? previousWishlist.filter(r => r.id !== resortId)
          : [...previousWishlist, { id: resortId } as Resort]; // Temporary partial object
        
        queryClient.setQueryData(['wishlist', user?.id], newWishlist);
      }

      return { previousWishlist };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, resortId, context) => {
      if (context?.previousWishlist) {
        queryClient.setQueryData(['wishlist', user?.id], context.previousWishlist);
      }
      toast.error("Failed to update wishlist");
    },
    // Always refetch after error or success to ensure sync
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', user?.id] });
    },
    onSuccess: (data) => {
      toast.success(data.saved ? "Added to wishlist!" : "Removed from wishlist");
    }
  });

  const isFavorite = useCallback((resortId: string) => {
    return wishlist.some(r => r.id === resortId);
  }, [wishlist]);

  const toggleWishlist = async (resortId: string) => {
    if (!user) {
      window.location.href = '/register?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }
    await mutation.mutateAsync(resortId);
  };

  const refreshWishlist = () => {
    queryClient.invalidateQueries({ queryKey: ['wishlist', user?.id] });
  };

  return (
    <WishlistContext.Provider value={{ 
      wishlist, 
      isLoading, 
      isFavorite, 
      toggleWishlist, 
      refreshWishlist 
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
