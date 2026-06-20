# Mobile app implementation notes

## Routing

- The mobile app uses Expo Router.
- `apps/mobile/package.json` points `main` to `expo-router/entry`.
- Routes live in `apps/mobile/app/`.
- The Router root layout imports `../global.css`; this is required for NativeWind styles because `index.ts` is bypassed by Expo Router.
- The active tab routes are:
  - `app/(tabs)/index.tsx` -> home map
  - `app/(tabs)/historico.tsx` -> history placeholder
  - `app/(tabs)/perfil.tsx` -> profile placeholder
  - `app/insert-id.tsx` -> insert-id placeholder
- `App.tsx` is not the active root while Expo Router is configured.

## Linking scheme

- `apps/mobile/app.json` sets `expo.scheme` to avoid Expo Linking production-build warnings.
- Changing the scheme affects native build configuration; create a new development build for native scheme changes to apply.

## MVP 03 home map

- `src/screens/HomeMapScreen.tsx` implements the current home map UI.
- The map is a static/mock UI to match the prototype and avoid adding native map dependencies for this MVP.
- Bike marker/card behavior is local UI state.
- The center-map control resets the selected bike state.
- The tab bar is a custom floating pill via `src/components/FloatingTabBar.tsx`.

## Styling and colors

- Styling uses NativeWind with Tailwind classes.
- Reusable color tokens are defined in `apps/mobile/tailwind.config.js`.
- Native-only color values are mirrored in `apps/mobile/src/theme/colors.ts`.
- `src/screens` and `src/components` should not use raw hex colors for reusable/common colors.
- Use Tailwind class names first; use `colors.ts` only where React Native props require a string color.
- After NativeWind config changes, restart Expo with cache clear:

```sh
npx expo start -c
```

## Validation

After mobile code changes, run from `apps/mobile`:

```sh
npx tsc --noEmit
```

When dependencies or Expo config change, also run:

```sh
npx expo-doctor
```

For Android bundle sanity checks, run:

```sh
npx expo export --platform android --clear
```
