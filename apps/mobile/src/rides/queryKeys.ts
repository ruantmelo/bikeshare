export const rideQueryKeys = {
  all: ['rides'] as const,
  active: () => [...rideQueryKeys.all, 'active'] as const,
  history: () => [...rideQueryKeys.all, 'history'] as const,
};
