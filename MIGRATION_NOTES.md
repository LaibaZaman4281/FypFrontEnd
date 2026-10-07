# Migration notes — React Native ➜ Next.js (App Router)

## What was kept identical

* **Every API call.** Same base URL, same paths, same HTTP verbs, same request
  bodies, same response handling. `lib/api/services.ts` is a thin, typed index of
  the exact endpoints the mobile app used.
* **Auth flow.** The login POST body (`{ Role, EmailOrCnic, Password }`), the JWT
  in the `userToken` key, the role IDs (`clientId` / `workerId` / `companyId` /
  `policeId`), the per-screen `Bearer` header, and the 401 → login rule.
* **Session storage keys.** `lib/storage.ts` writes the *same* key names
  AsyncStorage used, so nothing downstream had to change.
* **Business rules.** Habits mandatory at worker signup, location mandatory for
  new Client/Worker accounts, part-time bookings requiring a published slot,
  residence toggle only for full-time, remarks required to confirm a
  resignation, rating + reason + checkbox required to terminate, "keep at least
  one habit ticked", the 1–70 km radius bounds, the 45 s signup timeout, and
  every duplicate-submit guard.
* **Copy.** Validation messages, toast text, empty states and button labels are
  carried over verbatim.

## React Native ➜ Web substitutions

| React Native | Web |
|---|---|
| `@react-navigation/stack` | Next.js App Router (`next/link`, `useRouter`, `usePathname`, `useParams`, `useSearchParams`) |
| `View` / `Text` / `ScrollView` / `FlatList` | semantic `div`, `p`, `section`, `article`, `ul`, CSS grid |
| `TouchableOpacity` | `button` / `Link` |
| `Image` (`{uri}`) | `<img>` inside `<Avatar>`, `next/image` for local brand assets |
| `StyleSheet.create` | Tailwind CSS (brand tokens mirrored in `tailwind.config.ts`) |
| `AsyncStorage` | `localStorage` wrapper with identical keys |
| `Alert.alert` | `<Modal>` / `<ConfirmDialog>` |
| `react-native-toast-message` | `react-hot-toast`, same `showSuccess` / `showError` API |
| `Switch` | `<Toggle>` |
| `@react-native-community/datetimepicker` | native `<input type="date" | "time">` |
| `react-native-image-picker` | `<input type="file" accept="image/*">` + object URL preview |
| `@react-native-community/geolocation` + `PermissionsAndroid` | `navigator.geolocation` (browser handles permission) |
| Leaflet inside `react-native-webview` | `react-leaflet` with the same OSM tiles and marker behaviour |
| `Dimensions.get('window')` | CSS media queries + `useMediaQuery` |
| `react-native-vector-icons` (MaterialCommunityIcons) | `lucide-react` |

## Bugs found in the RN code and fixed during the port

These were crashes or dead ends, not feature changes. Each is commented at the
call site.

1. **`WorkerDetailScreen.js:234`** navigated to `workerPoliceRecord`, a route
   that was never registered → red screen. The background-check card now opens a
   dialog built from `isFlagged` / `isBlocked` already present in the payload.
2. **`ActiveRequestScreen.js`** read `norm` one line *before* `const norm = …`
   (temporal dead zone) → the screen threw as soon as a card rendered. The
   declaration order is corrected.
3. **`WorkerTerminatedScreen.js`** (262 lines) was never imported or registered.
   It is wired up at `/worker/terminated` and reads the worker id from the session.
4. **`locationHelper.js`** posted to `Dashboard/update-worker-location`, which
   does not exist on the backend (404 every time). `lib/utils/geo.ts` calls the
   real route, `PUT Dashboard/UpdateWorkerLocation`, which the map screen already used.
5. **`FilterationScreen.js`** requested habits from `${API_DASHBOARD}/GetHabits`
   instead of `/api/Habits/GetHabits`, so the habits facet never rendered. The
   panel now calls the real endpoint.
6. **Remote image fallbacks** were inconsistent (local asset in some screens, a
   remote `worker_default.jpg` in others — useless when the server is down).
   `<Avatar>` falls back to initials everywhere.

## Web-first design decisions

* **App shell**: fixed sidebar + sticky top bar on desktop (≥1024 px), drawer
  navigation below that. Content is capped at 1280 px so nothing is stretched.
* **Lists become responsive grids** (1 / 2 / 3 columns) instead of single-column
  FlatLists.
* **The worker search page** gets a persistent filter rail on desktop; the
  dedicated `/client/filters` route is still there for narrow screens.
* **The signup wizard** keeps the same three worker steps, but the map picker and
  skills builder open as dialogs instead of navigating away — this also removes
  the stale route-param draft the mobile version had to work around.
* **Brand identity preserved**: `#1E64D3` brand blue, `#0E1B4D` ink, `#F6F9FF`
  canvas, `#00B14F` success, plus the original logo and default avatar assets.

## Things intentionally *not* changed

The backend has known security problems (plaintext passwords, unauthenticated
controllers, IDOR on several endpoints, a committed JWT key). Fixing those is a
server-side job and was explicitly out of scope: the frontend continues to call
the same endpoints in the same way. See the backend review for the full list.
