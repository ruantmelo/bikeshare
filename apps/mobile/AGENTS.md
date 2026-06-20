# Mobile App Notes

## Expo

- This app uses Expo SDK `56.0.0` (`expo` package `~56.0.12`).
- Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing Expo code.
- If Expo Go hangs while loading over LAN, use tunnel mode:
  - `npx expo start --tunnel -c`
  - LAN mode can fail on networks that block device-to-device traffic, VPNs, firewalls, or isolated Wi-Fi.

## Project structure

- App entry is `index.ts`.
- Root screen/component is `App.tsx`.
- Shared app source lives under `src/`.
- Reusable UI components live in `src/components/`.
- Export reusable components from `src/components/index.ts`.
- Prefer imports from the components barrel:
  - `import { Button } from '@/components';`

## Path aliases

- TypeScript alias is configured in `tsconfig.json`:
  - `@/components` -> `./src/components/index`
  - `@/components/*` -> `./src/components/*`
- Runtime/Babel alias is configured in `babel.config.js` with `babel-plugin-module-resolver`:
  - `@/components` -> `./src/components`
- When adding new aliases, update both `tsconfig.json` and `babel.config.js`.

## Styling

- Styling uses NativeWind `^4.2.5` with Tailwind CSS `^3.4.19`.
- Global Tailwind CSS entry is `global.css`.
- `index.ts` imports `./global.css`; keep that import for NativeWind styles.
- `metro.config.js` wraps Expo Metro with:
  - `withNativeWind(config, { input: './global.css' })`
- `babel.config.js` uses:
  - `['babel-preset-expo', { jsxImportSource: 'nativewind' }]`
  - `nativewind/babel`
- `tailwind.config.js` content paths include:
  - `./App.tsx`
  - `./src/**/*.{js,jsx,ts,tsx}`
- Use `className` for NativeWind styles on React Native components.

## Components

- Existing demo component: `src/components/Button.tsx`.
- Keep component files in PascalCase, e.g. `Button.tsx`.
- Keep component exports centralized in `src/components/index.ts`.
- Prefer typed props and small reusable components.

## Validation

- Run TypeScript check after code changes:
  - `npx tsc --noEmit`
- Run Expo diagnostics when dependencies or config change:
  - `npx expo-doctor`
- For bundling sanity checks:
  - `npx expo export --platform android --clear`
