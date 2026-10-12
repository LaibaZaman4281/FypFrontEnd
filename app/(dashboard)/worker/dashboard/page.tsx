// 'use client';

// /**
//  * Port of `assets/components/Worker/WorkerDashboardScreen.js` (981 lines).
//  *
//  * Unchanged behaviour:
//  *  - GetWorkerDetail/{workerId} on load; 401 -> /login; missing session -> /login
//  *  - GetWorkerReviews/{workerId} and WorkerSlots/GetWorkerTimeSlots/{workerId}
//  *  - duty toggle -> PUT UpdateDutyStatus/{workerId} with a bare boolean body,
//  *    reverting the switch when the call fails
//  *  - radius +/- 1 km between 1 and 70 -> PUT UpdateWorkerRadius/{workerId} with
//  *    a bare int body, optimistic update
//  *  - add slot -> POST WorkerSlots/AddTimeSlot with HH:MM:SS strings
//  *  - delete slot -> DELETE WorkerSlots/DeleteTimeSlot/{id} behind a confirm
//  *  - logout clears the session and replaces the route with the login screen,
//  *    exactly like the RN handleLogout did
//  *  - the same tabs, counters and navigation targets, plus the Skills tab and
//  *    the two course tiles added upstream in `bcd4115`
//  *
//  * Alert.alert() is replaced by the web dialog components.
//  */

// import { useCallback, useEffect, useState } from 'react';
// import Link from 'next/link';
// import { useRouter } from 'next/navigation';
// import {
//   Award,
//   Bell,
//   BookOpen,
//   CheckCheck,
//   ChevronRight,
//   ClipboardCheck,
//   Clock4,
//   GraduationCap,
//   LogOut,
//   Mail,
//   MapPin,
//   Minus,
//   Pencil,
//   Plus,
//   Trash2,
//   UserX,
// } from 'lucide-react';
// import Avatar from '@/components/ui/Avatar';
// import Button from '@/components/ui/Button';
// import Card from '@/components/ui/Card';
// import Modal, { ConfirmDialog } from '@/components/ui/Modal';
// import PageHeader from '@/components/ui/PageHeader';
// import Tabs from '@/components/ui/Tabs';
// import Toggle from '@/components/ui/Toggle';
// import { Input } from '@/components/ui/Field';
// import { RatingStars } from '@/components/ui/Rating';
// import { EmptyState, Loader } from '@/components/ui/States';
// import { DashboardService, SlotsService } from '@/lib/api/services';
// import { ApiError } from '@/lib/api/client';
// import NotificationHelper from '@/lib/hooks/useNotification';
// import { useSession } from '@/lib/hooks/useSession';
// import Storage from '@/lib/storage';
// import { cn } from '@/lib/utils/cn';
// import type { TimeSlot } from '@/types';

// // Skills appears before availability/time slots, matching the RN tab order.
// const TABS = ['Overview', 'Skills', 'Time Slots', 'Experience', 'Reviews'];

// export default function WorkerDashboardPage() {
//   const router = useRouter();
//   const { logout } = useSession();

//   const [isDutyOn, setIsDutyOn] = useState(true);
//   const [confirmLogout, setConfirmLogout] = useState(false);
//   const [worker, setWorker] = useState<any>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState('Overview');
//   const [selectedRadius, setSelectedRadius] = useState('5 km');

//   const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
//   const [loadingSlots, setLoadingSlots] = useState(false);
//   const [isSlotModalVisible, setIsSlotModalVisible] = useState(false);
//   const [startTime, setStartTime] = useState('09:00');
//   const [endTime, setEndTime] = useState('12:00');
//   const [submittingSlot, setSubmittingSlot] = useState(false);
//   const [slotPendingDelete, setSlotPendingDelete] = useState<number | null>(null);

//   const [reviewsList, setReviewsList] = useState<any[]>([]);
//   const [loadingReviews, setLoadingReviews] = useState(false);
//   const [reviewsAverage, setReviewsAverage] = useState<string | null>(null);
//   const [reviewsCount, setReviewsCount] = useState<number | null>(null);
//   const [reviewsError, setReviewsError] = useState(false);

//   const fetchTimeSlots = useCallback(async (id: string | number) => {
//     setLoadingSlots(true);
//     try {
//       const data = await SlotsService.getWorkerTimeSlots(id);
//       setTimeSlots(Array.isArray(data) ? data : []);
//     } catch {
//       /* same as RN: logged and ignored */
//     } finally {
//       setLoadingSlots(false);
//     }
//   }, []);

//   const fetchWorkerReviews = useCallback(
//     async (id: string | number) => {
//       if (!id) return;
//       setLoadingReviews(true);
//       setReviewsError(false);
//       try {
//         const data: any = await DashboardService.getWorkerReviews(id);
//         const list = Array.isArray(data) ? data : data?.reviews || [];
//         setReviewsList(list);
//         if (data?.averageRating != null) setReviewsAverage(String(data.averageRating));
//         if (data?.reviewCount != null) setReviewsCount(data.reviewCount);
//       } catch (error) {
//         if (error instanceof ApiError && error.isUnauthorized) {
//           NotificationHelper.showError('Session expired. Please login again.');
//           router.replace('/login');
//           return;
//         }
//         setReviewsList([]);
//         setReviewsError(true);
//       } finally {
//         setLoadingReviews(false);
//       }
//     },
//     [router],
//   );

//   const fetchWorkerDetails = useCallback(async () => {
//     setIsLoading(true);
//     try {
//       const workerId = Storage.getItem('workerId');
//       const token = Storage.getItem('userToken');

//       if (!workerId || !token) {
//         NotificationHelper.showError('Session not found. Please login again.');
//         router.replace('/login');
//         return;
//       }

//       const data: any = await DashboardService.getWorkerDetail(workerId);
//       setWorker(data);
//       setIsDutyOn(data.availableStatus ?? true);
//       if (data.radius) setSelectedRadius(`${data.radius} km`);

//       fetchTimeSlots(workerId);
//       fetchWorkerReviews(workerId);
//     } catch (error) {
//       if (error instanceof ApiError && error.isUnauthorized) {
//         NotificationHelper.showError('Session expired. Please login again.');
//         router.replace('/login');
//       } else {
//         NotificationHelper.showError(
//           error instanceof ApiError ? `Error ${error.status}: ${error.message}` : 'Network error. Verify connection and API URL.',
//         );
//       }
//     } finally {
//       setIsLoading(false);
//     }
//   }, [router, fetchTimeSlots, fetchWorkerReviews]);

//   useEffect(() => {
//     fetchWorkerDetails();
//   }, [fetchWorkerDetails]);

//   /* ---------------- Duty ---------------- */
//   const handleDutyToggle = async (value: boolean) => {
//     setIsDutyOn(value);
//     try {
//       const workerId = Storage.getItem('workerId');
//       await DashboardService.updateDutyStatus(workerId ?? '', value);
//     } catch {
//       setIsDutyOn(!value);
//       NotificationHelper.showError('Failed to update duty status.');
//     }
//   };

//   /* ---------------- Radius ---------------- */
//   const currentRadiusValue = parseInt(selectedRadius) || 1;

//   const handleRadiusChange = async (rad: string) => {
//     setSelectedRadius(rad); // optimistic
//     const radiusVal = parseInt(rad.split(' ')[0]);
//     try {
//       const workerId = Storage.getItem('workerId');
//       await DashboardService.updateWorkerRadius(workerId ?? '', radiusVal);
//     } catch (error: any) {
//       NotificationHelper.showError('Failed to update radius: ' + (error?.message || ''));
//     }
//   };

//   /* ---------------- Slots ---------------- */
//   const handleAddTimeSlot = async () => {
//     if (!startTime || !endTime) {
//       NotificationHelper.showError('Please enter start and end times (e.g., 09:00).');
//       return;
//     }

//     setSubmittingSlot(true);
//     try {
//       const workerId = Storage.getItem('workerId');
//       const formatTime = (value: string) => `${value}:00`; // HH:MM -> HH:MM:SS

//       await SlotsService.addTimeSlot({
//         workerId: parseInt(workerId ?? '0', 10),
//         startTime: formatTime(startTime),
//         endTime: formatTime(endTime),
//       });

//       NotificationHelper.showSuccess('Time slot added successfully!');
//       setIsSlotModalVisible(false);
//       if (workerId) fetchTimeSlots(workerId);
//     } catch (error: any) {
//       NotificationHelper.showError(error?.message || 'Failed to add time slot.');
//     } finally {
//       setSubmittingSlot(false);
//     }
//   };

//   const handleDeleteSlot = async (slotId: number) => {
//     try {
//       await SlotsService.deleteTimeSlot(slotId);
//       setTimeSlots((prev) => prev.filter((item) => item.id !== slotId));
//     } catch {
//       NotificationHelper.showError('Failed to delete time slot.');
//     } finally {
//       setSlotPendingDelete(null);
//     }
//   };

//   /* ---------------- Profile ---------------- */
//   const handleEditProfile = () => {
//     window.sessionStorage.setItem('editProfileDraft', JSON.stringify({ role: 'Worker', initialData: worker }));
//     router.push('/signup?edit=1');
//   };

//   /**
//    * RN: `await AsyncStorage.clear(); navigation.replace('Login');`
//    * Web: clear the same session keys, then replace the route with /login.
//    */
//   const handleLogout = () => {
//     setConfirmLogout(false);
//     logout();
//   };

//   if (isLoading) return <Loader label="Loading your dashboard…" />;
//   if (!worker) return null;

//   return (
//     <div>
//       {/* ---------- Header band ---------- */}
//       <Card className="mb-6 border-0 bg-gradient-to-br from-brand to-brand-dark text-white">
//         <div className="flex flex-wrap items-center gap-5">
//           <Avatar src={worker.picture} name={worker.name} size="lg" />
//           <div className="min-w-0 flex-1">
//             <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">Good afternoon,</p>
//             <h1 className="truncate text-2xl font-extrabold">{worker.name}</h1>
//             <p className="text-sm text-white/85">
//               {worker.role || 'Worker'} • {worker.age || 0} Years Old
//             </p>
//           </div>
//           <div className="flex items-center gap-2">
//             <Button variant="outline" icon={<Pencil size={15} />} onClick={handleEditProfile}>
//               Edit Profile
//             </Button>
//             <Button
//               variant="outline"
//               icon={<LogOut size={15} />}
//               className="text-danger"
//               onClick={() => setConfirmLogout(true)}
//             >
//               Logout
//             </Button>
//           </div>
//         </div>

//         <div className="mt-5 grid grid-cols-3 divide-x divide-white/20 rounded-2xl bg-white/10 py-3 text-center">
//           <div className="px-2">
//             <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">Rating</p>
//             <p className="text-sm font-bold">★ {worker.rating || '0.0'}</p>
//             <p className="text-[11px] text-white/70">({worker.reviewCount || 0})</p>
//           </div>
//           <div className="px-2">
//             <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">Location</p>
//             <p className="truncate text-sm font-bold">{worker.location || 'Not set'}</p>
//           </div>
//           <div className="px-2">
//             <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">Salary</p>
//             <p className="text-sm font-bold">Rs.{worker.salary || '0'}</p>
//           </div>
//         </div>
//       </Card>

//       <Tabs items={TABS.map((t) => ({ label: t, value: t }))} value={activeTab} onChange={setActiveTab} className="mb-5" />

//       {/* ---------- OVERVIEW ---------- */}
//       {activeTab === 'Overview' && (
//         <div className="grid gap-5 lg:grid-cols-2">
//           {/* Course management — intentionally first so it is immediately visible */}
//           <Link href="/worker/courses">
//             <Card hoverable className="h-full border-0 bg-course text-white">
//               <GraduationCap size={26} />
//               <p className="mt-3 text-base font-extrabold">Browse Courses</p>
//               <p className="mt-1 text-sm text-white/80">Enroll in company training</p>
//             </Card>
//           </Link>

//           <Link href="/worker/my-courses">
//             <Card hoverable className="h-full border-course-border">
//               <Award size={26} className="text-course" />
//               <p className="mt-3 text-base font-extrabold text-course-ink">My Learning</p>
//               <p className="mt-1 text-sm text-course-muted">Courses and certificates</p>
//             </Card>
//           </Link>

//           <Card className="lg:col-span-2">
//             <div className="flex flex-wrap items-center justify-between gap-4">
//               <div>
//                 <div className="flex items-center gap-2">
//                   <h2 className="text-base font-bold text-ink">Duty Status</h2>
//                   <span
//                     className={cn(
//                       'rounded-full px-2 py-0.5 text-[11px] font-bold',
//                       isDutyOn ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-subtle',
//                     )}
//                   >
//                     {isDutyOn ? 'Online' : 'Offline'}
//                   </span>
//                 </div>
//                 <p className="mt-0.5 text-sm text-subtle">
//                   {isDutyOn ? 'You are currently visible to customers' : 'You are currently hidden'}
//                 </p>
//               </div>
//               <Toggle checked={isDutyOn} onChange={handleDutyToggle} label="Duty status" />
//             </div>

//             <div className="my-4 divider" />

//             <div className="flex flex-wrap items-center gap-4">
//               <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
//                 <MapPin size={19} />
//               </span>
//               <div className="min-w-0 flex-1">
//                 <p className="text-sm font-bold text-ink">Work Location</p>
//                 <p className="text-sm text-subtle">
//                   {worker.latitude && worker.longitude
//                     ? `Pinned (${parseFloat(worker.latitude).toFixed(3)}, ${parseFloat(worker.longitude).toFixed(3)})`
//                     : 'Location not pinned on map'}
//                 </p>
//               </div>
//               <Link
//                 href={`/map?role=Worker${worker.latitude ? `&lat=${worker.latitude}&lng=${worker.longitude}` : ''}`}
//               >
//                 <Button size="sm" icon={<MapPin size={14} />}>
//                   Set Location
//                 </Button>
//               </Link>
//             </div>

//             <div className="my-4 divider" />

//             <div className="flex items-center justify-between">
//               <p className="text-sm font-bold text-ink">
//                 Work Radius <span className="font-normal text-subtle">(Service Area)</span>
//               </p>
//               <span className="rounded-full bg-brand-light px-2.5 py-1 text-xs font-bold text-brand">{selectedRadius}</span>
//             </div>

//             <div className="mt-3 flex items-center gap-3">
//               <button
//                 type="button"
//                 disabled={currentRadiusValue <= 1}
//                 onClick={() => currentRadiusValue > 1 && handleRadiusChange(`${currentRadiusValue - 1} km`)}
//                 className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-brand disabled:text-muted"
//                 aria-label="Decrease radius"
//               >
//                 <Minus size={17} />
//               </button>

//               <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
//                 <div className="h-full rounded-full bg-brand" style={{ width: `${(currentRadiusValue / 70) * 100}%` }} />
//               </div>

//               <button
//                 type="button"
//                 disabled={currentRadiusValue >= 70}
//                 onClick={() => currentRadiusValue < 70 && handleRadiusChange(`${currentRadiusValue + 1} km`)}
//                 className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-brand disabled:text-muted"
//                 aria-label="Increase radius"
//               >
//                 <Plus size={17} />
//               </button>
//             </div>
//             <p className="mt-2 text-xs text-muted">Max Limit: 70 km</p>
//           </Card>

//           <Link href="/worker/requests">
//             <Card hoverable className="flex items-center gap-4">
//               <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-canvas text-ink">
//                 <Mail size={19} />
//               </span>
//               <div className="flex-1">
//                 <p className="text-sm font-bold text-ink">Interview Requests</p>
//                 <p className="text-sm text-subtle">Pending: {worker.pendingRequestCount || 0}</p>
//               </div>
//               <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-danger px-2 text-xs font-bold text-white">
//                 {worker.pendingRequestCount || 0}
//               </span>
//             </Card>
//           </Link>

//           <Link href="/worker/job-confirmations">
//             <Card hoverable className="flex items-center gap-4">
//               <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-canvas text-ink">
//                 <Bell size={19} />
//               </span>
//               <div className="flex-1">
//                 <p className="text-sm font-bold text-ink">Job Notifications</p>
//                 <p className="text-sm text-subtle">Job Confirmations and Rejections</p>
//               </div>
//               <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-danger px-2 text-xs font-bold text-white">
//                 {worker.jobNotificationCount || 0}
//               </span>
//             </Card>
//           </Link>

//           <Card>
//             <div className="flex items-center gap-2">
//               <UserX size={20} className="text-danger" />
//               <h2 className="text-base font-bold text-ink">Employment Actions</h2>
//             </div>
//             <p className="mt-1 text-sm text-subtle">Manage your job status and termination requests</p>

//             <div className="mt-4 flex flex-col gap-3">
//               <Link href="/worker/leave-job">
//                 <Button variant="outline" fullWidth className="text-danger" icon={<UserX size={16} />}>
//                   Resign from Job
//                 </Button>
//               </Link>
//               <Link href="/worker/termination">
//                 <Button fullWidth>
//                   Check Termination Status {worker.terminationCount > 0 ? `(${worker.terminationCount})` : ''}
//                 </Button>
//               </Link>
//             </div>
//           </Card>

//           <Link href="/worker/habits">
//             <Card hoverable className="flex items-center gap-3">
//               <ClipboardCheck size={19} className="text-brand" />
//               <span className="flex-1 text-sm font-bold text-ink">
//                 My Habits{worker.habits?.length ? ` (${worker.habits.length})` : ''}
//               </span>
//               <ChevronRight size={18} className="text-muted" />
//             </Card>
//           </Link>
//         </div>
//       )}

//       {/* ---------- SKILLS ---------- */}
//       {activeTab === 'Skills' && (
//         <Card className="border-course-border">
//           <div className="flex flex-wrap items-center gap-4">
//             <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-course-pale text-course">
//               <Award size={20} />
//             </span>
//             <div className="min-w-0 flex-1">
//               <h2 className="text-base font-bold text-course-ink">Professional Skills</h2>
//               <p className="text-sm text-course-muted">Your primary and secondary service expertise</p>
//             </div>
//             <Button variant="secondary" icon={<Pencil size={14} />} onClick={handleEditProfile}>
//               Edit
//             </Button>
//           </div>

//           <span className="mt-4 inline-block rounded-full bg-course px-3.5 py-2 text-sm font-extrabold text-white">
//             {worker.role || 'General Worker'}
//           </span>

//           <h3 className="mb-2 mt-5 text-sm font-extrabold text-course-ink">Primary Skills</h3>
//           {worker.primarySkills && worker.primarySkills.length > 0 ? (
//             <div className="flex flex-wrap gap-2">
//               {worker.primarySkills.map((skill: string, index: number) => (
//                 <span
//                   key={`${skill}-${index}`}
//                   className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-course-pale px-3 py-1.5 text-xs font-bold text-course-dark"
//                 >
//                   <CheckCheck size={13} className="text-course" />
//                   {skill}
//                 </span>
//               ))}
//             </div>
//           ) : (
//             <p className="text-sm text-course-muted">No primary skills added.</p>
//           )}

//           <div className="my-5 divider" />

//           <h3 className="text-sm font-extrabold text-course-ink">Secondary / Part-Time Services</h3>
//           <p className="mb-3 mt-1 text-xs text-course-muted">Additional categories and services you can provide</p>

//           {worker.partTimeSkills && worker.partTimeSkills.length > 0 ? (
//             <div className="space-y-3">
//               {worker.partTimeSkills.map((group: any, groupIndex: number) => (
//                 <div key={`${group.categoryName}-${groupIndex}`} className="rounded-xl border border-line bg-canvas p-3">
//                   <p className="mb-2 flex items-center gap-2 text-sm font-extrabold text-course-ink">
//                     <BookOpen size={16} className="text-course" />
//                     {group.categoryName || 'Additional Service'}
//                   </p>
//                   <div className="flex flex-wrap gap-2">
//                     {(group.skills || []).map((skill: string, index: number) => (
//                       <span
//                         key={`${skill}-${index}`}
//                         className="rounded-full border border-course-border bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600"
//                       >
//                         {skill}
//                       </span>
//                     ))}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <EmptyState title="No secondary services added." icon={<BookOpen size={22} />} />
//           )}
//         </Card>
//       )}

//       {/* ---------- TIME SLOTS ---------- */}
//       {activeTab === 'Time Slots' && (
//         <Card>
//           <div className="flex flex-wrap items-center gap-4">
//             <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
//               <Clock4 size={19} />
//             </span>
//             <div className="min-w-0 flex-1">
//               <h2 className="text-base font-bold text-ink">Weekly Availability</h2>
//               <p className="text-sm text-subtle">Manage your free working hours</p>
//             </div>
//             <Button variant="secondary" icon={<Plus size={16} />} onClick={() => setIsSlotModalVisible(true)}>
//               Add Slot
//             </Button>
//           </div>

//           <div className="mt-5">
//             {loadingSlots ? (
//               <p className="text-sm text-subtle">Loading slots…</p>
//             ) : timeSlots.length > 0 ? (
//               <div className="grid gap-3 sm:grid-cols-2">
//                 {timeSlots.map((slot) => (
//                   <div key={slot.id} className="flex items-center gap-3 rounded-xl border border-line bg-canvas px-4 py-3">
//                     <span className="h-2 w-2 rounded-full bg-success" />
//                     <div className="flex-1">
//                       <p className="text-sm font-bold text-ink">
//                         {slot.startTime} - {slot.endTime}
//                       </p>
//                       <p className="text-xs text-subtle">Available Shift</p>
//                     </div>
//                     <button
//                       type="button"
//                       onClick={() => setSlotPendingDelete(slot.id)}
//                       className="rounded-lg p-2 text-subtle transition hover:bg-rose-50 hover:text-danger"
//                       aria-label="Delete slot"
//                     >
//                       <Trash2 size={16} />
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <EmptyState title="No available time slots yet." icon={<Clock4 size={24} />} />
//             )}
//           </div>
//         </Card>
//       )}

//       {/* ---------- EXPERIENCE ---------- */}
//       {activeTab === 'Experience' && (
//         <Card>
//           <h2 className="mb-4 text-base font-bold text-ink">Work History</h2>
//           {worker.experiences && worker.experiences.length > 0 ? (
//             <ol className="relative space-y-5 border-l border-line pl-5">
//               {worker.experiences.map((exp: any, index: number) => (
//                 <li key={index} className="relative">
//                   <span
//                     className={cn(
//                       'absolute -left-[26px] top-1.5 h-3 w-3 rounded-full ring-4 ring-white',
//                       index === 0 ? 'bg-brand' : 'bg-line',
//                     )}
//                   />
//                   <div className="flex flex-wrap items-baseline justify-between gap-2">
//                     <p className="text-sm font-bold text-ink">{exp.title}</p>
//                     <p className="text-xs font-semibold text-subtle">{exp.period}</p>
//                   </div>
//                   <p className="mt-1 text-sm text-subtle">{exp.details}</p>
//                 </li>
//               ))}
//             </ol>
//           ) : (
//             <EmptyState title="No experience history available." />
//           )}
//         </Card>
//       )}

//       {/* ---------- REVIEWS ---------- */}
//       {activeTab === 'Reviews' && (
//         <div className="space-y-4">
//           <Card className="flex items-center gap-4">
//             <p className="text-4xl font-extrabold text-ink">{reviewsAverage ?? worker.rating ?? '0.0'}</p>
//             <div>
//               <RatingStars value={Number(reviewsAverage ?? worker.rating ?? 0)} size={18} />
//               <p className="mt-1 text-xs text-subtle">
//                 Based on {reviewsCount ?? worker.reviewCount ?? reviewsList.length} reviews
//               </p>
//             </div>
//             <Link href="/worker/reviews" className="ml-auto">
//               <Button variant="outline" size="sm">
//                 View all
//               </Button>
//             </Link>
//           </Card>

//           {loadingReviews ? (
//             <Loader label="Loading reviews…" />
//           ) : reviewsError ? (
//             <EmptyState title="Could not load your reviews." message="Check your connection and try again." />
//           ) : reviewsList.length === 0 ? (
//             <EmptyState title="No reviews submitted yet." />
//           ) : (
//             reviewsList.map((review: any, index: number) => (
//               <Card key={review.reviewId ?? index}>
//                 <div className="flex items-start gap-3">
//                   <Avatar src={review.reviewerImage} name={review.reviewerName} size="sm" />
//                   <div className="min-w-0 flex-1">
//                     <div className="flex flex-wrap items-center justify-between gap-2">
//                       <p className="truncate text-sm font-bold text-ink">{review.reviewerName || 'Client'}</p>
//                       <RatingStars value={review.rating} />
//                     </div>
//                     <p className="text-xs text-subtle">{review.date || review.reviewDate}</p>
//                     <p className="mt-1.5 text-sm italic text-subtle">&quot;{review.comment}&quot;</p>
//                   </div>
//                 </div>
//               </Card>
//             ))
//           )}
//         </div>
//       )}

//       {/* ---------- Add slot dialog ---------- */}
//       <Modal
//         open={isSlotModalVisible}
//         onClose={() => setIsSlotModalVisible(false)}
//         title="Add availability slot"
//         description="Clients inside your radius can book interviews inside these windows."
//         size="sm"
//         footer={
//           <>
//             <Button variant="ghost" onClick={() => setIsSlotModalVisible(false)}>
//               Cancel
//             </Button>
//             <Button loading={submittingSlot} onClick={handleAddTimeSlot}>
//               Save slot
//             </Button>
//           </>
//         }
//       >
//         <div className="grid gap-4 sm:grid-cols-2">
//           <Input label="Start time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
//           <Input label="End time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
//         </div>
//       </Modal>

//       <ConfirmDialog
//         open={confirmLogout}
//         onClose={() => setConfirmLogout(false)}
//         onConfirm={handleLogout}
//         title="Log out?"
//         message="You will need to sign in again to access your dashboard."
//         confirmLabel="Log out"
//         tone="danger"
//       />

//       <ConfirmDialog
//         open={slotPendingDelete !== null}
//         onClose={() => setSlotPendingDelete(null)}
//         onConfirm={() => slotPendingDelete !== null && handleDeleteSlot(slotPendingDelete)}
//         title="Confirm Delete"
//         message="Are you sure you want to delete this time slot?"
//         confirmLabel="Delete"
//         tone="danger"
//       />
//     </div>
//   );
// }
'use client';

/**
 * Port of `assets/components/Worker/WorkerDashboardScreen.js` (981 lines).
 *
 * Unchanged behaviour:
 *  - GetWorkerDetail/{workerId} on load; 401 -> /login; missing session -> /login
 *  - GetWorkerReviews/{workerId} and WorkerSlots/GetWorkerTimeSlots/{workerId}
 *  - duty toggle -> PUT UpdateDutyStatus/{workerId} with a bare boolean body,
 *    reverting the switch when the call fails
 *  - radius +/- 1 km between 1 and 70 -> PUT UpdateWorkerRadius/{workerId} with
 *    a bare int body, optimistic update
 *  - add slot -> POST WorkerSlots/AddTimeSlot with HH:MM:SS strings
 *  - delete slot -> DELETE WorkerSlots/DeleteTimeSlot/{id} behind a confirm
 *  - logout clears the session and replaces the route with the login screen,
 *    exactly like the RN handleLogout did
 *  - the same tabs, counters and navigation targets, plus the Skills tab and
 *    the two course tiles added upstream in `bcd4115`
 *
 * Alert.alert() is replaced by the web dialog components.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Award,
  Bell,
  BookOpen,
  CheckCheck,
  ChevronRight,
  ClipboardCheck,
  Clock4,
  GraduationCap,
  LogOut,
  Mail,
  MapPin,
  Minus,
  Pencil,
  Plus,
  Trash2,
  UserX,
} from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal, { ConfirmDialog } from '@/components/ui/Modal';
import PageHeader from '@/components/ui/PageHeader';
import Tabs from '@/components/ui/Tabs';
import Toggle from '@/components/ui/Toggle';
import { Input } from '@/components/ui/Field';
import { RatingStars } from '@/components/ui/Rating';
import { EmptyState, Loader } from '@/components/ui/States';
import { DashboardService, SlotsService } from '@/lib/api/services';
import { ApiError } from '@/lib/api/client';
import NotificationHelper from '@/lib/hooks/useNotification';
import { useSession } from '@/lib/hooks/useSession';
import Storage from '@/lib/storage';
import { cn } from '@/lib/utils/cn';
import type { TimeSlot } from '@/types';

// Skills appears before availability/time slots, matching the RN tab order.
const TABS = ['Overview', 'Skills', 'Time Slots', 'Experience', 'Reviews'];

export default function WorkerDashboardPage() {
  const router = useRouter();
  const { logout } = useSession();

  const [isDutyOn, setIsDutyOn] = useState(true);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [worker, setWorker] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedRadius, setSelectedRadius] = useState('5 km');

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSlotModalVisible, setIsSlotModalVisible] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [submittingSlot, setSubmittingSlot] = useState(false);
  const [slotPendingDelete, setSlotPendingDelete] = useState<number | null>(null);

  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsAverage, setReviewsAverage] = useState<string | null>(null);
  const [reviewsCount, setReviewsCount] = useState<number | null>(null);
  const [reviewsError, setReviewsError] = useState(false);

  const fetchTimeSlots = useCallback(async (id: string | number) => {
    setLoadingSlots(true);
    try {
      const data = await SlotsService.getWorkerTimeSlots(id);
      setTimeSlots(Array.isArray(data) ? data : []);
    } catch {
      /* same as RN: logged and ignored */
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  const fetchWorkerReviews = useCallback(
    async (id: string | number) => {
      if (!id) return;
      setLoadingReviews(true);
      setReviewsError(false);
      try {
        const data: any = await DashboardService.getWorkerReviews(id);
        const list = Array.isArray(data) ? data : data?.reviews || [];
        setReviewsList(list);
        if (data?.averageRating != null) setReviewsAverage(String(data.averageRating));
        if (data?.reviewCount != null) setReviewsCount(data.reviewCount);
      } catch (error) {
        if (error instanceof ApiError && error.isUnauthorized) {
          NotificationHelper.showError('Session expired. Please login again.');
          router.replace('/login');
          return;
        }
        setReviewsList([]);
        setReviewsError(true);
      } finally {
        setLoadingReviews(false);
      }
    },
    [router],
  );

  const fetchWorkerDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const workerId = Storage.getItem('workerId');
      const token = Storage.getItem('userToken');

      if (!workerId || !token) {
        NotificationHelper.showError('Session not found. Please login again.');
        router.replace('/login');
        return;
      }

      const data: any = await DashboardService.getWorkerDetail(workerId);
      setWorker(data);
      setIsDutyOn(data.availableStatus ?? true);
      if (data.radius) setSelectedRadius(`${data.radius} km`);

      fetchTimeSlots(workerId);
      fetchWorkerReviews(workerId);
    } catch (error) {
      if (error instanceof ApiError && error.isUnauthorized) {
        NotificationHelper.showError('Session expired. Please login again.');
        router.replace('/login');
      } else {
        NotificationHelper.showError(
          error instanceof ApiError ? `Error ${error.status}: ${error.message}` : 'Network error. Verify connection and API URL.',
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [router, fetchTimeSlots, fetchWorkerReviews]);

  useEffect(() => {
    fetchWorkerDetails();
  }, [fetchWorkerDetails]);

  /* ---------------- Duty ---------------- */
  const handleDutyToggle = async (value: boolean) => {
    setIsDutyOn(value);
    try {
      const workerId = Storage.getItem('workerId');
      await DashboardService.updateDutyStatus(workerId ?? '', value);
    } catch {
      setIsDutyOn(!value);
      NotificationHelper.showError('Failed to update duty status.');
    }
  };

  /* ---------------- Radius ---------------- */
  const currentRadiusValue = parseInt(selectedRadius) || 1;

  const handleRadiusChange = async (rad: string) => {
    setSelectedRadius(rad); // optimistic
    const radiusVal = parseInt(rad.split(' ')[0]);
    try {
      const workerId = Storage.getItem('workerId');
      await DashboardService.updateWorkerRadius(workerId ?? '', radiusVal);
    } catch (error: any) {
      NotificationHelper.showError('Failed to update radius: ' + (error?.message || ''));
    }
  };

  /* ---------------- Slots ---------------- */
  const handleAddTimeSlot = async () => {
    if (!startTime || !endTime) {
      NotificationHelper.showError('Please enter start and end times (e.g., 09:00).');
      return;
    }

    setSubmittingSlot(true);
    try {
      const workerId = Storage.getItem('workerId');
      const formatTime = (value: string) => `${value}:00`; // HH:MM -> HH:MM:SS

      await SlotsService.addTimeSlot({
        workerId: parseInt(workerId ?? '0', 10),
        startTime: formatTime(startTime),
        endTime: formatTime(endTime),
      });

      NotificationHelper.showSuccess('Time slot added successfully!');
      setIsSlotModalVisible(false);
      if (workerId) fetchTimeSlots(workerId);
    } catch (error: any) {
      NotificationHelper.showError(error?.message || 'Failed to add time slot.');
    } finally {
      setSubmittingSlot(false);
    }
  };

  const handleDeleteSlot = async (slotId: number) => {
    try {
      await SlotsService.deleteTimeSlot(slotId);
      setTimeSlots((prev) => prev.filter((item) => item.id !== slotId));
    } catch {
      NotificationHelper.showError('Failed to delete time slot.');
    } finally {
      setSlotPendingDelete(null);
    }
  };

  /* ---------------- Profile ---------------- */
  const handleEditProfile = () => {
    window.sessionStorage.setItem('editProfileDraft', JSON.stringify({ role: 'Worker', initialData: worker }));
    router.push('/signup?edit=1');
  };

  /**
   * RN: `await AsyncStorage.clear(); navigation.replace('Login');`
   * Web: clear the same session keys, then replace the route with /login.
   */
  const handleLogout = () => {
    setConfirmLogout(false);
    logout();
  };

  if (isLoading) return <Loader label="Loading your dashboard…" />;
  if (!worker) return null;

  return (
    <div>
      {/* ---------- Header band ---------- */}
      <Card className="mb-6 border-0 bg-gradient-to-br from-brand to-brand-dark text-white">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar src={worker.picture} name={worker.name} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">Good afternoon,</p>
            <h1 className="truncate text-2xl font-extrabold">{worker.name}</h1>
            <p className="text-sm text-white/85">
              {worker.role || 'Worker'} • {worker.age || 0} Years Old
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={<Pencil size={15} />} onClick={handleEditProfile}>
              Edit Profile
            </Button>
            <Button
              variant="outline"
              icon={<LogOut size={15} />}
              className="text-danger"
              onClick={() => setConfirmLogout(true)}
            >
              Logout
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 divide-x divide-white/20 rounded-2xl bg-white/10 py-3 text-center">
          <div className="px-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">Rating</p>
            <p className="text-sm font-bold">★ {worker.rating || '0.0'}</p>
            <p className="text-[11px] text-white/70">({worker.reviewCount || 0})</p>
          </div>
          <div className="px-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">Location</p>
            <p className="truncate text-sm font-bold">{worker.location || 'Not set'}</p>
          </div>
          <div className="px-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">Salary</p>
            <p className="text-sm font-bold">Rs.{worker.salary || '0'}</p>
          </div>
        </div>
      </Card>

      <Tabs items={TABS.map((t) => ({ label: t, value: t }))} value={activeTab} onChange={setActiveTab} className="mb-5" />

      {/* ---------- OVERVIEW ---------- */}
      {activeTab === 'Overview' && (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Course management — intentionally first so it is immediately visible */}
          <Link href="/worker/courses">
            <Card hoverable className="h-full border-0 bg-course text-white">
              <GraduationCap size={26} />
              <p className="mt-3 text-base font-extrabold">Browse Courses</p>
              <p className="mt-1 text-sm text-white/80">Enroll in company training</p>
            </Card>
          </Link>

          <Link href="/worker/my-courses">
            <Card hoverable className="h-full border-course-border">
              <Award size={26} className="text-course" />
              <p className="mt-3 text-base font-extrabold text-course-ink">My Learning</p>
              <p className="mt-1 text-sm text-course-muted">Courses and certificates</p>
            </Card>
          </Link>

          <Card className="lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-ink">Duty Status</h2>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-bold',
                      isDutyOn ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-subtle',
                    )}
                  >
                    {isDutyOn ? 'Online' : 'Offline'}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-subtle">
                  {isDutyOn ? 'You are currently visible to customers' : 'You are currently hidden'}
                </p>
              </div>
              <Toggle checked={isDutyOn} onChange={handleDutyToggle} label="Duty status" />
            </div>

            <div className="my-4 divider" />

            <div className="flex flex-wrap items-center gap-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
                <MapPin size={19} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink">Work Location</p>
                <p className="text-sm text-subtle">
                  {worker.latitude && worker.longitude
                    ? `Pinned (${parseFloat(worker.latitude).toFixed(3)}, ${parseFloat(worker.longitude).toFixed(3)})`
                    : 'Location not pinned on map'}
                </p>
              </div>
              <Link
                href={`/map?role=Worker${worker.latitude ? `&lat=${worker.latitude}&lng=${worker.longitude}` : ''}`}
              >
                <Button size="sm" icon={<MapPin size={14} />}>
                  Set Location
                </Button>
              </Link>
            </div>

            <div className="my-4 divider" />

            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-ink">
                Work Radius <span className="font-normal text-subtle">(Service Area)</span>
              </p>
              <span className="rounded-full bg-brand-light px-2.5 py-1 text-xs font-bold text-brand">{selectedRadius}</span>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                disabled={currentRadiusValue <= 1}
                onClick={() => currentRadiusValue > 1 && handleRadiusChange(`${currentRadiusValue - 1} km`)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-brand disabled:text-muted"
                aria-label="Decrease radius"
              >
                <Minus size={17} />
              </button>

              <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-brand" style={{ width: `${(currentRadiusValue / 70) * 100}%` }} />
              </div>

              <button
                type="button"
                disabled={currentRadiusValue >= 70}
                onClick={() => currentRadiusValue < 70 && handleRadiusChange(`${currentRadiusValue + 1} km`)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-brand disabled:text-muted"
                aria-label="Increase radius"
              >
                <Plus size={17} />
              </button>
            </div>
            <p className="mt-2 text-xs text-muted">Max Limit: 70 km</p>
          </Card>

          <Link href="/worker/requests">
            <Card hoverable className="flex items-center gap-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-canvas text-ink">
                <Mail size={19} />
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold text-ink">Interview Requests</p>
                <p className="text-sm text-subtle">Pending: {worker.pendingRequestCount || 0}</p>
              </div>
              <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-danger px-2 text-xs font-bold text-white">
                {worker.pendingRequestCount || 0}
              </span>
            </Card>
          </Link>

          <Link href="/worker/job-confirmations">
            <Card hoverable className="flex items-center gap-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-canvas text-ink">
                <Bell size={19} />
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold text-ink">Job Notifications</p>
                <p className="text-sm text-subtle">Job Confirmations and Rejections</p>
              </div>
              <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-danger px-2 text-xs font-bold text-white">
                {worker.jobNotificationCount || 0}
              </span>
            </Card>
          </Link>

          <Card>
            <div className="flex items-center gap-2">
              <UserX size={20} className="text-danger" />
              <h2 className="text-base font-bold text-ink">Employment Actions</h2>
            </div>
            <p className="mt-1 text-sm text-subtle">Manage your job status and termination requests</p>

            <div className="mt-4 flex flex-col gap-3">
              <Link href="/worker/leave-job">
                <Button variant="outline" fullWidth className="text-danger" icon={<UserX size={16} />}>
                  Resign from Job
                </Button>
              </Link>
              <Link href="/worker/termination">
                <Button fullWidth>
                  Check Termination Status {worker.terminationCount > 0 ? `(${worker.terminationCount})` : ''}
                </Button>
              </Link>
            </div>
          </Card>

          <Link href="/worker/habits">
            <Card hoverable className="flex items-center gap-3">
              <ClipboardCheck size={19} className="text-brand" />
              <span className="flex-1 text-sm font-bold text-ink">
                My Habits{worker.habits?.length ? ` (${worker.habits.length})` : ''}
              </span>
              <ChevronRight size={18} className="text-muted" />
            </Card>
          </Link>
        </div>
      )}

      {/* ---------- SKILLS ---------- */}
      {activeTab === 'Skills' && (
        <Card className="border-course-border">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-course-pale text-course">
              <Award size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-course-ink">Professional Skills</h2>
              <p className="text-sm text-course-muted">Your primary and secondary service expertise</p>
            </div>
            <Button variant="secondary" icon={<Pencil size={14} />} onClick={handleEditProfile}>
              Edit
            </Button>
          </div>

          <span className="mt-4 inline-block rounded-full bg-course px-3.5 py-2 text-sm font-extrabold text-white">
            {worker.role || 'General Worker'}
          </span>

          <h3 className="mb-2 mt-5 text-sm font-extrabold text-course-ink">Primary Skills</h3>
          {worker.primarySkills && worker.primarySkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {worker.primarySkills.map((skill: string, index: number) => (
                <span
                  key={`${skill}-${index}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-course-pale px-3 py-1.5 text-xs font-bold text-course-dark"
                >
                  <CheckCheck size={13} className="text-course" />
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-course-muted">No primary skills added.</p>
          )}

          <div className="my-5 divider" />

          <h3 className="text-sm font-extrabold text-course-ink">Secondary / Part-Time Services</h3>
          <p className="mb-3 mt-1 text-xs text-course-muted">Additional categories and services you can provide</p>

          {worker.partTimeSkills && worker.partTimeSkills.length > 0 ? (
            <div className="space-y-3">
              {worker.partTimeSkills.map((group: any, groupIndex: number) => (
                <div key={`${group.categoryName}-${groupIndex}`} className="rounded-xl border border-line bg-canvas p-3">
                  <p className="mb-2 flex items-center gap-2 text-sm font-extrabold text-course-ink">
                    <BookOpen size={16} className="text-course" />
                    {group.categoryName || 'Additional Service'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(group.skills || []).map((skill: string, index: number) => (
                      <span
                        key={`${skill}-${index}`}
                        className="rounded-full border border-course-border bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No secondary services added." icon={<BookOpen size={22} />} />
          )}
        </Card>
      )}

      {/* ---------- TIME SLOTS ---------- */}
      {activeTab === 'Time Slots' && (
        <Card>
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
              <Clock4 size={19} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-ink">Weekly Availability</h2>
              <p className="text-sm text-subtle">Manage your free working hours</p>
            </div>
            <Button variant="secondary" icon={<Plus size={16} />} onClick={() => setIsSlotModalVisible(true)}>
              Add Slot
            </Button>
          </div>

          <div className="mt-5">
            {loadingSlots ? (
              <p className="text-sm text-subtle">Loading slots…</p>
            ) : timeSlots.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {timeSlots.map((slot) => (
                  <div key={slot.id} className="flex items-center gap-3 rounded-xl border border-line bg-canvas px-4 py-3">
                    <span className="h-2 w-2 rounded-full bg-success" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-ink">
                        {slot.startTime} - {slot.endTime}
                      </p>
                      <p className="text-xs text-subtle">Available Shift</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSlotPendingDelete(slot.id)}
                      className="rounded-lg p-2 text-subtle transition hover:bg-rose-50 hover:text-danger"
                      aria-label="Delete slot"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No available time slots yet." icon={<Clock4 size={24} />} />
            )}
          </div>
        </Card>
      )}

      {/* ---------- EXPERIENCE ---------- */}
      {activeTab === 'Experience' && (
        <Card>
          <h2 className="mb-4 text-base font-bold text-ink">Work History</h2>
          {worker.experiences && worker.experiences.length > 0 ? (
            <ol className="relative space-y-5 border-l border-line pl-5">
              {worker.experiences.map((exp: any, index: number) => (
                <li key={index} className="relative">
                  <span
                    className={cn(
                      'absolute -left-[26px] top-1.5 h-3 w-3 rounded-full ring-4 ring-white',
                      index === 0 ? 'bg-brand' : 'bg-line',
                    )}
                  />
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-bold text-ink">{exp.title}</p>
                    <p className="text-xs font-semibold text-subtle">{exp.period}</p>
                  </div>
                  <p className="mt-1 text-sm text-subtle">{exp.details}</p>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState title="No experience history available." />
          )}
        </Card>
      )}

      {/* ---------- REVIEWS ---------- */}
      {activeTab === 'Reviews' && (
        <div className="space-y-4">
          <Card className="flex items-center gap-4">
            <p className="text-4xl font-extrabold text-ink">{reviewsAverage ?? worker.rating ?? '0.0'}</p>
            <div>
              <RatingStars value={Number(reviewsAverage ?? worker.rating ?? 0)} size={18} />
              <p className="mt-1 text-xs text-subtle">
                Based on {reviewsCount ?? worker.reviewCount ?? reviewsList.length} reviews
              </p>
            </div>
            <Link href="/worker/reviews" className="ml-auto">
              <Button variant="outline" size="sm">
                View all
              </Button>
            </Link>
          </Card>

          {loadingReviews ? (
            <Loader label="Loading reviews…" />
          ) : reviewsError ? (
            <EmptyState title="Could not load your reviews." message="Check your connection and try again." />
          ) : reviewsList.length === 0 ? (
            <EmptyState title="No reviews submitted yet." />
          ) : (
            reviewsList.map((review: any, index: number) => (
              <Card key={review.reviewId ?? index}>
                <div className="flex items-start gap-3">
                  <Avatar src={review.reviewerImage} name={review.reviewerName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold text-ink">{review.reviewerName || 'Client'}</p>
                      <RatingStars value={review.rating} />
                    </div>
                    <p className="text-xs text-subtle">{review.date || review.reviewDate}</p>
                    <p className="mt-1.5 text-sm italic text-subtle">&quot;{review.comment}&quot;</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ---------- Add slot dialog ---------- */}
      <Modal
        open={isSlotModalVisible}
        onClose={() => setIsSlotModalVisible(false)}
        title="Add availability slot"
        description="Clients inside your radius can book interviews inside these windows."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsSlotModalVisible(false)}>
              Cancel
            </Button>
            <Button loading={submittingSlot} onClick={handleAddTimeSlot}>
              Save slot
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Start time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          <Input label="End time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={handleLogout}
        title="Log out?"
        message="You will need to sign in again to access your dashboard."
        confirmLabel="Log out"
        tone="danger"
      />

      <ConfirmDialog
        open={slotPendingDelete !== null}
        onClose={() => setSlotPendingDelete(null)}
        onConfirm={() => slotPendingDelete !== null && handleDeleteSlot(slotPendingDelete)}
        title="Confirm Delete"
        message="Are you sure you want to delete this time slot?"
        confirmLabel="Delete"
        tone="danger"
      />
    </div>
  );
}
