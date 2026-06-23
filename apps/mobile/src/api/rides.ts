import type {
  ActiveRideResponse,
  RideHistoryResponse,
  RideWithBicycle,
  StartRideRequest,
} from '@bikeshare/contracts';

import { apiRequest } from './client';

export function getActiveRide() {
  return apiRequest<ActiveRideResponse>('/rides/active');
}

export function startRide(request: StartRideRequest) {
  return apiRequest<RideWithBicycle>('/rides/start', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export function endRide() {
  return apiRequest<RideWithBicycle>('/rides/end', {
    method: 'POST',
  });
}

export function getRideHistory() {
  return apiRequest<RideHistoryResponse>('/rides/history');
}
