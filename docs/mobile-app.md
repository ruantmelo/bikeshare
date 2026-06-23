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
cd apps/mobile
pnpm expo start --clear --dev-client
```

## Android development build

This project uses pnpm workspaces. Run mobile Expo commands through pnpm from
`apps/mobile` so the workspace dependencies and local Expo CLI are used.

From a clean checkout, install dependencies and build shared contracts from the
workspace root:

```sh
pnpm install
```

The root `postinstall` script runs `pnpm build:contracts`, which generates the
`@bikeshare/contracts` package consumed by the mobile app.

Configure the mobile environment:

```sh
cd apps/mobile
cp .env.example .env
```

Set `EXPO_PUBLIC_API_URL` to a URL reachable from the Android device/emulator.
For a physical device, use the host machine IP, for example:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.10:3000
```

Build and install the Android development build:

```sh
cd apps/mobile
pnpm expo run:android
```

Start Metro for the installed development build:

```sh
cd apps/mobile
pnpm expo start --dev-client
```

If Metro, NativeWind styles, or workspace resolution look stale, clear Metro's
cache:

```sh
cd apps/mobile
pnpm expo start --clear --dev-client
```

Do not pass `--clear` to `expo run:android`; that command does not accept it.
To clear native Android build caches, remove the generated native cache folders
before rebuilding:

```sh
cd apps/mobile
rm -rf android/.gradle android/build android/app/build .expo
pnpm expo run:android
```

Prefer `pnpm expo ...` or `pnpm --filter mobile exec expo ...` over `npx expo ...`
in this repository.

## Validation

After mobile code changes, run from `apps/mobile`:

```sh
pnpm exec tsc --noEmit
```

When dependencies or Expo config change, also run:

```sh
pnpm expo-doctor
```

For Android bundle sanity checks, run:

```sh
pnpm expo export --platform android --clear
```
