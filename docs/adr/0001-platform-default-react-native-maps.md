# Use platform-default react-native-maps for MVP map integration

BikeShare UFAL needs a real native map to show the User Location and Nearby Bicycles in the mobile MVP. We will use `react-native-maps` with the platform default provider instead of Mapbox or forced Google Maps, because it works with Expo's MVP workflow without API keys or provider-specific native setup. This keeps the first map integration simple while leaving provider consistency and richer map styling as future decisions.
