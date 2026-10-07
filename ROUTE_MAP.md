# Route map — React Native screen ➜ Next.js route

Every screen registered in the old `App.tsx` stack navigator has a 1:1 route
here. Nothing was dropped and nothing new was invented.

| # | RN screen (`App.tsx` name) | Source file | Next.js route |
|---|---|---|---|
| 1 | `Login` | `Auth/LoginScreen.js` | `/login` |
| 2 | `Signup` | `Auth/SignupScreen.js` | `/signup` (+ `?edit=1` for profile edit) |
| 3 | `AddSkills` | `Worker/AddSkillScreen.js` | `/worker/skills` (+ dialog inside `/signup`) |
| 4 | `FindServiceScreen` | `Client/FindServiceScreen.js` | `/client/find-service` |
| 5 | `FilterationScreen` | `Client/FilterationScreen.js` | `/client/filters` (+ sidebar on the search page) |
| 6 | `WorkerDetailScreen` | `Client/WorkerDetailScreen.js` | `/client/workers/[id]` |
| 7 | `InterviewSelectionScreen` | `Client/InterviewSelectionScreen.js` | `/client/workers/[id]/interview` |
| 8 | `WorkerCertificationDetail` | `Client/WorkerCertificationDetail.js` | `/client/workers/[id]/certification` |
| 9 | `UserDashboardScreen` | `Client/UserDashboardScreen.js` | `/client/dashboard` |
| 10 | `ActiveRequestScreen` | `Client/ActiveRequestScreen.js` | `/client/requests` |
| 11 | `WorkerDecisionScreen` | `Client/WorkerDecisionScreen.js` | `/client/decisions` |
| 12 | `RatingAndReviewsScreen` | `Client/RatingAndReviewsScreen.js` | `/client/reviews/[workerId]` |
| 13 | `ResignationsScreen` | `Client/ResignationsScreen.js` | `/client/resignations` |
| 14 | `ResignationScreen` | `Client/ResignationScreen.js` | `/client/resignations/[id]` |
| 15 | `TerminateContractScreen` | `Client/TerminateContractScreen.js` | `/client/terminate/[workerId]?interviewId=` |
| 16 | `ClientProfileScreen` | `Client/ClientProfileScreen.js` | `/client/profile` (+ `?clientId=`) |
| 17 | `WorkerDashboardScreen` | `Worker/WorkerDashboardScreen.js` | `/worker/dashboard` |
| 18 | `ActiveRequestsScreen` | `Worker/ActiveRequestsScreen.js` | `/worker/requests` |
| 19 | `AcceptedRequestScreen` | `Worker/AcceptedRequestScreen.js` | `/worker/accepted` |
| 20 | `JobConfirmationScreen` | `Worker/JobConfirmationScreen.js` | `/worker/job-confirmations` |
| 21 | `MyHabitsScreen` | `Worker/MyHabitsScreen.js` | `/worker/habits` |
| 22 | `LeaveJobScreen` | `Worker/LeaveJobScreen.js` | `/worker/leave-job` |
| 23 | `WorkerTerminationScreen` | `Worker/WorkerTerminationScreen.js` | `/worker/termination` |
| 24 | *(unregistered in RN)* | `Worker/WorkerTerminatedScreen.js` | `/worker/terminated` |
| 25 | `WorkerRatingAndReviewsScreen` | `Worker/RatingAndReviewsScreen.js` | `/worker/reviews` |
| 26 | `WorkerDirectoryScreen` | `Company/WorkerDirectoryScreen.js` | `/company/directory` |
| 27 | `WorkerDetailsVerificationScreen` | `Company/WorkerDetailsVerificationScreen.js` | `/company/workers/[id]` |
| 28 | `PoliceVerificationPortal` | `Police/PoliceVerificationPortal.js` | `/police/portal` |
| 29 | `FileCriminalRecordScreen` | `Police/FileCriminalRecordScreen.js` | `/police/file-record/[workerId]` |
| 30 | `MapScreen` | `Map/Map.js` | `/map` (+ picker dialog inside `/signup`) |

## Post-login routing (unchanged)

| Role | RN `navigation.replace(...)` | Web `router.replace(...)` |
|---|---|---|
| Client | `FindServiceScreen` | `/client/find-service` |
| Worker | `WorkerDashboardScreen` | `/worker/dashboard` |
| Company | `WorkerDirectoryScreen` | `/company/directory` |
| Police | `PoliceVerificationPortal` | `/police/portal` |

## Shared helpers

| RN file | Web equivalent |
|---|---|
| `assets/config.js` | `lib/config.ts` (same constant names, base URL from env) |
| `Notification/NotificationHelper.js` | `lib/hooks/useNotification.ts` (react-hot-toast) |
| `helpers/JobTypeBadge.js` | `components/ui/Badge.tsx` → `<JobTypeBadge />` + `lib/utils/status.ts` |
| `helpers/ResidenceBadge.js` | `components/ui/Badge.tsx` → `<ResidenceBadge />` |
| `helpers/SlotTimeLabel.js` | `components/ui/Badge.tsx` → `<SlotTimeLabel />` |
| `helpers/locationHelper.js` | `lib/utils/geo.ts` |
| `@react-native-async-storage/async-storage` | `lib/storage.ts` (same keys) |
