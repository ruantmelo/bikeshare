import { useEffect, useMemo, useRef, useState, type ElementRef } from "react";
import { Linking, Platform, StyleSheet, Text, View } from "react-native";
import MapView, {
  PROVIDER_GOOGLE,
  type MapPressEvent,
} from "react-native-maps";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import { useNavigation, useRouter } from "expo-router";
import { Button } from "@/components";

import { GreetingsCard } from "./Greetings";
import { ActionButtons } from "./ActionButtons";
import { BikeRecord, createBikes, makeRegion, MapState } from "./utils";
import { BikeMarker } from "./BikeMarker";
import { SelectedBikeDrawer } from "./SelectedBikeDrawer";

const SELECTED_BIKE_MIN_LATITUDE_DELTA = 0.0052;
const SELECTED_BIKE_MIN_LONGITUDE_DELTA = 0.0052;
const SELECTED_BIKE_VISIBLE_PADDING_FACTOR = 3.2;
const SELECTED_BIKE_DRAWER_CENTER_OFFSET = 0.18;

export default function HomeMapScreen() {
  const router = useRouter();
  const navigation = useNavigation();

  const mapRef = useRef<ElementRef<typeof MapView> | null>(null);
  const [selectedBikeId, setSelectedBikeId] = useState<BikeRecord["id"] | null>(
    null,
  );
  const [locationStatus, setLocationStatus] = useState<MapState>(
    Platform.OS === "web" ? "failure" : "loading",
  );
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const bikes = useMemo(
    () => (userLocation ? createBikes(userLocation) : []),
    [userLocation],
  );
  const selectedBike = useMemo(
    () => bikes.find((bike) => bike.id === selectedBikeId) ?? null,
    [bikes, selectedBikeId],
  );

  const openInsertId = () => router.push("/insert-id");

  const handleMapPress = (event: MapPressEvent) => {
    if (event.nativeEvent.action === "marker-press") return;

    setSelectedBikeId(null);
  };

  const centerMap = (
    center: { latitude: number; longitude: number },
    bike?: { latitude: number; longitude: number },
  ) => {
    if (mapRef.current) {
      if (bike) {
        const latitudeDelta = Math.max(
          Math.abs(center.latitude - bike.latitude) *
            SELECTED_BIKE_VISIBLE_PADDING_FACTOR,
          SELECTED_BIKE_MIN_LATITUDE_DELTA,
        );
        const longitudeDelta = Math.max(
          Math.abs(center.longitude - bike.longitude) *
            SELECTED_BIKE_VISIBLE_PADDING_FACTOR,
          SELECTED_BIKE_MIN_LONGITUDE_DELTA,
        );

        mapRef.current.animateToRegion(
          {
            latitude:
              (center.latitude + bike.latitude) / 2 -
              latitudeDelta * SELECTED_BIKE_DRAWER_CENTER_OFFSET,
            longitude: (center.longitude + bike.longitude) / 2,
            latitudeDelta,
            longitudeDelta,
          },
          500,
        );
      } else {
        mapRef.current.animateToRegion(makeRegion(center), 400);
      }
    }
  };

  const requestLocation = async () => {
    if (Platform.OS === "web") {
      setLocationStatus("failure");
      return;
    }
    setLocationStatus("loading");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setUserLocation(null);
        setSelectedBikeId(null);
        setLocationStatus("denied");
        return;
      }
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const nextLocation = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };
      setUserLocation(nextLocation);
      setSelectedBikeId(null);
      setLocationStatus("ready");
      centerMap(nextLocation);
    } catch (error) {
      console.warn("[HomeMapScreen] Failed to fetch current location", error);
      setUserLocation(null);
      setSelectedBikeId(null);
      setLocationStatus("failure");
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  useEffect(() => {
    if (!userLocation || !selectedBike) return;
    centerMap(userLocation, selectedBike.coordinate);
  }, [selectedBike, userLocation]);

  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: { display: selectedBike ? "none" : "flex" },
    });

    return () => {
      navigation.setOptions({ tabBarStyle: { display: "flex" } });
    };
  }, [navigation, selectedBike]);

  const renderBlockedState = () => {
    const message =
      locationStatus === "denied"
        ? "Ative a localização nas configurações para ver bicicletas próximas."
        : locationStatus === "failure"
          ? "Não conseguimos encontrar sua localização agora."
          : "Buscando sua localização…";

    return (
      <View className="absolute inset-0 items-center justify-center bg-background-map px-6">
        <View className="w-full max-w-[320px] rounded-[26px] border border-border-default bg-white/90 px-5 py-6">
          <Text className="text-center text-[16px] font-semibold text-text-primary">
            {message}
          </Text>
          <View className="mt-4 gap-3">
            {locationStatus !== "loading" ? (
              <>
                <Button
                  onPress={
                    locationStatus === "denied"
                      ? () => Linking.openSettings()
                      : () => void requestLocation()
                  }
                  className="h-[48px]"
                >
                  {locationStatus === "denied"
                    ? "Abrir configurações"
                    : "Tentar novamente"}
                </Button>
                {locationStatus === "denied" ? (
                  <Button
                    onPress={() => void requestLocation()}
                    variant="secondary"
                    className="h-[48px]"
                  >
                    Tentar novamente
                  </Button>
                ) : null}
              </>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background-app" edges={["top"]}>
      <StatusBar style="dark" />

      <View className="flex-1">
        <View className="absolute inset-0 overflow-hidden bg-background-map">
          {Platform.OS === "web" ? (
            renderBlockedState()
          ) : locationStatus !== "ready" || !userLocation ? (
            renderBlockedState()
          ) : (
            <MapView
              provider={PROVIDER_GOOGLE}
              ref={mapRef}
              style={styles.map}
              initialRegion={makeRegion(userLocation)}
              showsUserLocation
              showsMyLocationButton={false}
              showsCompass={false}
              onMapReady={() => console.log("[HomeMapScreen] MapView is ready")}
              onPress={handleMapPress}
            >
              {bikes.map((bike) => (
                <BikeMarker
                  key={bike.id}
                  bike={bike}
                  isSelected={bike.id === selectedBikeId}
                  onPress={setSelectedBikeId}
                />
              ))}
            </MapView>
          )}

          {selectedBike && userLocation ? (
            <SelectedBikeDrawer
              onClose={() => setSelectedBikeId(null)}
              onRentBike={(bikeId) => {
                console.log("[HomeMapScreen] Renting bike", bikeId);
                setSelectedBikeId(bikeId as any);
              }}
              selectedBike={selectedBike}
              userLocation={userLocation}
            />
          ) : null}
        </View>

        {!selectedBike && <GreetingsCard name="João" />}

        {selectedBike ? null : (
          <ActionButtons
            onInsertIdPress={openInsertId}
            onUserCenterPress={() => userLocation && centerMap(userLocation)}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
});
