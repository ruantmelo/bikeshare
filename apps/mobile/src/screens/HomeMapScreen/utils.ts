import type { BicycleStatus, NearbyBicycle } from '@bikeshare/contracts';
import { Region } from "react-native-maps";
import { colors } from "../../theme/colors";

export type BIKE_STATUS = BicycleStatus;

export const BIKE_STATUS_LABELS = {
  UNREGISTERED: "Não registrada",
  AVAILABLE: "Disponível",
  RESERVED: "Reservada",
  IN_USE: "Em uso",
  ERROR: "Com problema",
} as const;

export const BIKE_STATUS_COLORS = {
  UNREGISTERED: colors.text.muted,
  AVAILABLE: colors.brand.primary,
  RESERVED: colors.text.warning,
  IN_USE: colors.text.warning,
  ERROR: colors.text.error,
} as const;

export type BikeRecord = {
  id: string;
  battery: string;
  status: BIKE_STATUS;
  note: string;
  available: boolean;
  coordinate: { latitude: number; longitude: number };
  distanceMeters: number;
};

export type MapState = "loading" | "denied" | "failure" | "ready";

export const TAB_BAR_HEIGHT = 64;
export const TAB_BAR_SAFE_GAP = 18;
export const ACTIONS_GAP = 14;
export const ACTIONS_BOTTOM_OFFSET =
  TAB_BAR_HEIGHT + TAB_BAR_SAFE_GAP + ACTIONS_GAP;
export const EARTH_RADIUS_METERS = 6_371_000;

const BASE_BIKES = [
  {
    id: "BIKE_001",
    distance: 120,
    bearing: 12,
    battery: "83%",
    status: "AVAILABLE",
    note: "Ponto principal",
    available: true,
  },
  {
    id: "BIKE_002",
    distance: 280,
    bearing: 236,
    battery: "64%",
    status: "IN_USE",
    note: "Próxima ao bloco B",
    available: false,
  },
  {
    id: "BIKE_003",
    distance: 410,
    bearing: 48,
    battery: "91%",
    status: "AVAILABLE",
    note: "Área da biblioteca",
    available: true,
  },
  {
    id: "BIKE_004",
    distance: 190,
    bearing: 118,
    battery: "52%",
    status: "IN_USE",
    note: "Próxima ao pátio",
    available: false,
  },
] as const;

export function coordinateFromOffset(
  origin: { latitude: number; longitude: number },
  distance: number,
  bearing: number,
) {
  const angularDistance = distance / EARTH_RADIUS_METERS;
  const bearingRadians = (bearing * Math.PI) / 180;
  const latitudeRadians = (origin.latitude * Math.PI) / 180;
  const longitudeRadians = (origin.longitude * Math.PI) / 180;

  const nextLatitude = Math.asin(
    Math.sin(latitudeRadians) * Math.cos(angularDistance) +
      Math.cos(latitudeRadians) *
        Math.sin(angularDistance) *
        Math.cos(bearingRadians),
  );
  const nextLongitude =
    longitudeRadians +
    Math.atan2(
      Math.sin(bearingRadians) *
        Math.sin(angularDistance) *
        Math.cos(latitudeRadians),
      Math.cos(angularDistance) -
        Math.sin(latitudeRadians) * Math.sin(nextLatitude),
    );

  return {
    latitude: (nextLatitude * 180) / Math.PI,
    longitude: (nextLongitude * 180) / Math.PI,
  };
}

export function createBikes(userLocation: {
  latitude: number;
  longitude: number;
}): BikeRecord[] {
  return BASE_BIKES.map((bike) => ({
    id: bike.id,
    battery: bike.battery,
    status: bike.status,
    note: bike.note,
    available: bike.available,
    coordinate: coordinateFromOffset(userLocation, bike.distance, bike.bearing),
    distanceMeters: bike.distance,
  }));
}

export function nearbyBicycleToRecord(bicycle: NearbyBicycle): BikeRecord {
  return {
    id: bicycle.id,
    battery: '—',
    status: bicycle.status,
    note: 'Bicicleta próxima',
    available: bicycle.status === 'AVAILABLE',
    coordinate: { latitude: bicycle.latitude, longitude: bicycle.longitude },
    distanceMeters: bicycle.distanceMeters,
  };
}

export function calculateDistanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const latitudeDelta = ((b.latitude - a.latitude) * Math.PI) / 180;
  const longitudeDelta = ((b.longitude - a.longitude) * Math.PI) / 180;
  const startLatitude = (a.latitude * Math.PI) / 180;
  const endLatitude = (b.latitude * Math.PI) / 180;
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(startLatitude) *
      Math.cos(endLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return Math.round(
    EARTH_RADIUS_METERS *
      2 *
      Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)),
  );
}

export function formatDistance(meters: number) {
  return meters < 1000
    ? `${meters} m`
    : `${(meters / 1000).toFixed(1).replace(".0", "")} km`;
}

export function makeRegion(
  center: { latitude: number; longitude: number },
  latitudeDelta = 0.006,
): Region {
  return {
    latitude: center.latitude,
    longitude: center.longitude,
    latitudeDelta,
    longitudeDelta: latitudeDelta,
  };
}

export function bikeMarkerColor(available: boolean) {
  return available ? colors.brand.primary : colors.text.muted;
}
