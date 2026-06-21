import type { ConfigContext, ExpoConfig } from 'expo/config';

declare const process: {
  env: {
    GOOGLE_MAPS_ANDROID_KEY?: string;
  };
};

declare function require<T>(path: string): T;

const appJson = require<{ expo: ExpoConfig }>('./app.json');

export default ({ config }: ConfigContext): ExpoConfig => {
  const androidGoogleMapsApiKey = process.env.GOOGLE_MAPS_ANDROID_KEY;

  return {
    ...config,
    ...appJson.expo,
    plugins: [
      ...(appJson.expo.plugins ?? []),
      [
        'react-native-maps',
        {
          androidGoogleMapsApiKey,
        },
      ],
    ],
  };
};
