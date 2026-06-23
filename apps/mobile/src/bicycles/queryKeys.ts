export const bicycleQueryKeys = {
  all: ['bicycles'] as const,
  nearby: (latitude: number, longitude: number) =>
    [...bicycleQueryKeys.all, 'nearby', latitude, longitude] as const,
}
