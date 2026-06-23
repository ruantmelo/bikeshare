# Mobile App Notes

## Expo

- This app uses Expo SDK `56.0.0` (`expo` package `~56.0.12`).
- Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing Expo code.
- This repository uses pnpm workspaces. Prefer `pnpm expo ...` from `apps/mobile`
  or `pnpm --filter mobile exec expo ...` from the workspace root; avoid `npx expo ...`.
- Android development build:
  - `cd apps/mobile && pnpm expo run:android`
  - `cd apps/mobile && pnpm expo start --dev-client`
- Clear Metro cache with `pnpm expo start --clear --dev-client`; do not pass
  `--clear` to `expo run:android` because it is not a supported argument.
- If Expo Go hangs while loading over LAN, use tunnel mode:
  - `pnpm expo start --tunnel --clear`
  - LAN mode can fail on networks that block device-to-device traffic, VPNs, firewalls, or isolated Wi-Fi.

## Project structure

- App entry is Expo Router via `package.json` main: `expo-router/entry`.
- Root routes live under `app/`.
- The tab shell lives in `app/(tabs)/_layout.tsx`.
- The home route is `app/(tabs)/index.tsx` and renders `src/screens/HomeMapScreen.tsx`.
- `App.tsx` can exist during migration, but it is not the active app entry while Expo Router is configured.
- Shared app source lives under `src/`.
- Reusable UI components live in `src/components/`.
- Reusable screens live in `src/screens/` and should be exported from `src/screens/index.ts`.
- Export reusable components from `src/components/index.ts`.
- Prefer imports from the components barrel:
  - `import { Button } from '@/components';`

## Path aliases

- TypeScript alias is configured in `tsconfig.json`:
  - `@/components` -> `./src/components/index`
  - `@/components/*` -> `./src/components/*`
  - `@/screens` -> `./src/screens/index`
  - `@/screens/*` -> `./src/screens/*`
- Runtime/Babel alias is configured in `babel.config.js` with `babel-plugin-module-resolver`:
  - `@/components` -> `./src/components`
  - `@/screens` -> `./src/screens`
- When adding new aliases, update both `tsconfig.json` and `babel.config.js`.

## Styling

- Styling uses NativeWind `^4.2.5` with Tailwind CSS `^3.4.19`.
- Global Tailwind CSS entry is `global.css`.
- Expo Router root layout `app/_layout.tsx` imports `../global.css`; keep that import for NativeWind styles.
- `index.ts` is not the active entry while `package.json` uses `expo-router/entry`.
- `metro.config.js` wraps Expo Metro with:
  - `withNativeWind(config, { input: path.resolve(projectRoot, 'global.css'), configPath: path.resolve(projectRoot, 'tailwind.config.js') })`
- `babel.config.js` uses:
  - `['babel-preset-expo', { jsxImportSource: 'nativewind' }]`
  - `nativewind/babel`
- `tailwind.config.js` content paths include:
  - `./App.tsx`
  - `./app/**/*.{js,jsx,ts,tsx}`
  - `./src/**/*.{js,jsx,ts,tsx}`
- Use `className` for NativeWind styles on React Native components.
- Common app colors must be named in `tailwind.config.js`.
- Do not add raw hex colors directly in `src/screens` or `src/components` when the color is reusable.
- Use `src/theme/colors.ts` for JavaScript/native color props that cannot use Tailwind classes, such as icon `color`, `placeholderTextColor`, and `selectionColor`.
- Never implement fake device status bars from design/prototype pages. Use the real OS status bar via Expo/React Native only; omit any designed time, signal, Wi-Fi, or battery mock UI when translating screens from Pencil/Figma.

## Components

- Shared button component: `src/components/Button.tsx`.
- Shared icon-only button component: `src/components/IconButton.tsx`.
- Custom app tab bar component: `src/components/FloatingTabBar.tsx`.
- Keep component files in PascalCase, e.g. `Button.tsx`.
- Keep component exports centralized in `src/components/index.ts`.
- Prefer typed props and small reusable components.

## Current MVP screens

- `src/screens/HomeMapScreen.tsx` implements the MVP 03 home map screen from the Pencil prototype.
- The home map currently uses a static/mock map, not a native map SDK.
- Bike selection and route preview are local UI state for the MVP.
- `app/insert-id.tsx`, `app/(tabs)/historico.tsx`, and `app/(tabs)/perfil.tsx` are placeholder routes.

## Validation

- Run TypeScript check after code changes:
  - `pnpm exec tsc --noEmit`
- Run Expo diagnostics when dependencies or config change:
  - `pnpm expo-doctor`
- For bundling sanity checks:
  - `pnpm expo export --platform android --clear`
