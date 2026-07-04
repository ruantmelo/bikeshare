import type { NearbyBicyclesResponse } from '@bikeshare/contracts'

import { apiRequest } from '../api/client'

export function getNearbyBicycles(latitude: number, longitude: number) {
  const query = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
  })

  return apiRequest<NearbyBicyclesResponse>(`/bikes/nearby?${query.toString()}`)
}
