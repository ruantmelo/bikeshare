import { useQuery } from "@tanstack/react-query";

import { getNearbyBicycles } from "./api";
import { bicycleQueryKeys } from "./queryKeys";

export function useNearbyBicyclesQuery(latitude?: number, longitude?: number) {
  const enabled = latitude != null && longitude != null;

  return useQuery({
    queryKey: enabled
      ? bicycleQueryKeys.nearby(latitude, longitude)
      : bicycleQueryKeys.all,
    enabled,
    queryFn: () => getNearbyBicycles(latitude!, longitude!),
  });
}
