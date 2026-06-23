import type { StartRideRequest } from '@bikeshare/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { endRide, getActiveRide, getRideHistory, startRide } from '../api/rides';
import { rideQueryKeys } from './queryKeys';
import { useRideFlow } from './RideFlowProvider';

export function useActiveRideQuery() {
  const { startedRide } = useRideFlow();

  return useQuery({
    queryKey: rideQueryKeys.active(),
    queryFn: getActiveRide,
    initialData: startedRide ?? undefined,
  });
}

export function useRideHistoryQuery() {
  return useQuery({
    queryKey: rideQueryKeys.history(),
    queryFn: getRideHistory,
  });
}

export function useStartRideMutation() {
  const queryClient = useQueryClient();
  const { setStartedRide, setEndedRide } = useRideFlow();

  return useMutation({
    mutationFn: (request: StartRideRequest) => startRide(request),
    onSuccess: (ride) => {
      setStartedRide(ride);
      setEndedRide(null);
      queryClient.setQueryData(rideQueryKeys.active(), ride);
    },
  });
}

export function useEndRideMutation() {
  const queryClient = useQueryClient();
  const { setEndedRide, setStartedRide } = useRideFlow();

  return useMutation({
    mutationFn: endRide,
    onSuccess: (ride) => {
      setEndedRide(ride);
      setStartedRide(null);
      queryClient.setQueryData(rideQueryKeys.active(), null);
      void queryClient.invalidateQueries({ queryKey: rideQueryKeys.history() });
    },
  });
}
