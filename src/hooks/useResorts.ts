import { useQuery } from "@tanstack/react-query";
import type { Resort, FilterState, SortOption, SearchParams } from "../types/resort";
import { apiClient } from "../utils/apiClient";

interface UseResortsOptions {
  search?: Partial<SearchParams>;
  filters?: Partial<FilterState>;
  sort?: SortOption;
}

const MAX_PRICE = 60000;

export function useResorts({ search, filters, sort = "popularity" }: UseResortsOptions = {}) {
  const queryParams = new URLSearchParams();
  
  if (filters?.minPrice) queryParams.append('minPrice', filters.minPrice.toString());
  if (filters?.maxPrice) queryParams.append('maxPrice', filters.maxPrice.toString());
  if (filters?.types?.length) queryParams.append('type', filters.types[0]); // Backend handles one type for now
  if (filters?.minRating) queryParams.append('minRating', filters.minRating.toString());
  if (sort) queryParams.append('sort', sort);
  if (search?.location) queryParams.append('search', search.location);

  const { data, isLoading, error } = useQuery({
    queryKey: ['resorts', search, filters, sort],
    queryFn: async () => {
      const response = await apiClient.get<any[]>(`/resorts?${queryParams.toString()}`);
      
      // Normalization: Ensure frontend compatibility
      return response.map((r: any) => ({
        ...r,
        location: {
          area: r.locationArea,
          district: "Hampi",
          state: "Karnataka",
          lat: r.locationLat || 15.3350,
          lng: r.locationLng || 76.4600,
          distanceFromCenterKm: 5
        }
      })) as Resort[];
    },
    // Performance: Keep previous data while fetching new (prevents layout jumping)
    placeholderData: (previousData) => previousData,
  });

  const resorts = data || [];

  return {
    resorts,
    total: resorts.length,
    isEmpty: resorts.length === 0,
    isLoading,
    error,
    maxPrice: MAX_PRICE,
  };
}

