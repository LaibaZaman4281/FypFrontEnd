// 'use client';

// /**
//  * Port of `assets/components/Client/ClientProfileScreen.js`.
//  *
//  * Same GetClientDetail/{clientId} call. Without a `clientId` query parameter it
//  * shows the signed-in client's own profile (the RN screen read the id from the
//  * route params when opened from a review author link).
//  */

// import { Suspense, useCallback, useEffect, useState } from 'react';
// import { useSearchParams } from 'next/navigation';
// import { Mail, MapPin, MessageSquare, Phone } from 'lucide-react';
// import Avatar from '@/components/ui/Avatar';
// import Button from '@/components/ui/Button';
// import Card from '@/components/ui/Card';
// import PageHeader from '@/components/ui/PageHeader';
// import { RatingStars } from '@/components/ui/Rating';
// import { EmptyState, Loader } from '@/components/ui/States';
// import { DashboardService } from '@/lib/api/services';
// import Storage from '@/lib/storage';

// function ClientProfile() {
//   const searchParams = useSearchParams();
//   const targetClientId = searchParams.get('clientId') || searchParams.get('id') || Storage.getItem('clientId');

//   const [profile, setProfile] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [showAllReviews, setShowAllReviews] = useState(false);

//   const fetchClientProfile = useCallback(async () => {
//     if (!targetClientId) {
//       setLoading(false);
//       return;
//     }
//     try {
//       const data = await DashboardService.getClientDetail(targetClientId);
//       setProfile(data);
//     } catch {
//       setProfile(null);
//     } finally {
//       setLoading(false);
//     }
//   }, [targetClientId]);

//   useEffect(() => {
//     fetchClientProfile();
//   }, [fetchClientProfile]);

//   if (loading) return <Loader label="Loading profile…" />;
//   if (!profile) return <EmptyState title="Client profile unavailable." />;

//   const allReviews = profile.reviews || [];
//   const displayedReviews = showAllReviews ? allReviews : allReviews.slice(0, 2);

//   return (
//     <div className="mx-auto max-w-4xl">
//       <PageHeader title="Client Profile" back />

//       <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
//         <Card className="text-center">
//           <Avatar src={profile.picture} name={profile.name} size="xl" className="mx-auto" />
//           <h2 className="mt-3 text-xl font-extrabold text-ink">{profile.name}</h2>
//           {profile.averageRating != null && (
//             <div className="mt-2 flex items-center justify-center gap-2">
//               <RatingStars value={profile.averageRating} />
//               <span className="text-sm font-bold text-ink">{Number(profile.averageRating).toFixed(1)}</span>
//             </div>
//           )}

//           <div className="mt-5 space-y-2 text-left text-sm text-subtle">
//             {profile.address && (
//               <p className="flex items-start gap-2">
//                 <MapPin size={15} className="mt-0.5 shrink-0 text-rose-500" /> {profile.address}
//               </p>
//             )}
//             {profile.phone && (
//               <p className="flex items-center gap-2">
//                 <Phone size={15} className="text-brand" /> {profile.phone}
//               </p>
//             )}
//             {profile.email && (
//               <p className="flex items-center gap-2 break-all">
//                 <Mail size={15} className="text-brand" /> {profile.email}
//               </p>
//             )}
//           </div>
//         </Card>

//         <div className="space-y-4">
//           {(profile.totalHired != null || profile.activeWorkers != null) && (
//             <div className="grid gap-4 sm:grid-cols-2">
//               {profile.totalHired != null && (
//                 <Card>
//                   <p className="label-xs">Total hired</p>
//                   <p className="text-2xl font-extrabold text-ink">{profile.totalHired}</p>
//                 </Card>
//               )}
//               {profile.activeWorkers != null && (
//                 <Card>
//                   <p className="label-xs">Active workers</p>
//                   <p className="text-2xl font-extrabold text-ink">{profile.activeWorkers}</p>
//                 </Card>
//               )}
//             </div>
//           )}

//           <Card>
//             <h3 className="mb-4 text-base font-bold text-ink">Reviews from workers</h3>

//             {allReviews.length === 0 ? (
//               <EmptyState title="No reviews yet." icon={<MessageSquare size={22} />} />
//             ) : (
//               <>
//                 <div className="space-y-4">
//                   {displayedReviews.map((review: any, index: number) => (
//                     <div key={review.reviewId ?? index} className="rounded-xl bg-canvas p-4">
//                       <div className="flex items-start gap-3">
//                         <Avatar src={review.reviewerImage} name={review.reviewerName} size="sm" />
//                         <div className="min-w-0 flex-1">
//                           <div className="flex flex-wrap items-center justify-between gap-2">
//                             <p className="truncate text-sm font-bold text-ink">{review.reviewerName || 'Worker'}</p>
//                             <RatingStars value={review.rating} />
//                           </div>
//                           <p className="text-xs text-subtle">{review.date || review.reviewDate}</p>
//                           <p className="mt-1.5 text-sm italic text-subtle">&quot;{review.comment}&quot;</p>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>

//                 {allReviews.length > 2 && (
//                   <Button variant="ghost" className="mt-4" onClick={() => setShowAllReviews(!showAllReviews)}>
//                     {showAllReviews ? 'Show less' : `Show all ${allReviews.length} reviews`}
//                   </Button>
//                 )}
//               </>
//             )}
//           </Card>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default function ClientProfilePage() {
//   return (
//     <Suspense fallback={null}>
//       <ClientProfile />
//     </Suspense>
//   );
// }
'use client';

/**
 * Port of `assets/components/Client/ClientProfileScreen.js`.
 *
 * Same GetClientDetail/{clientId} call. Without a `clientId` query parameter it
 * shows the signed-in client's own profile (the RN screen read the id from the
 * route params when opened from a review author link).
 */

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail, MapPin, MessageSquare, Phone } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { RatingStars } from '@/components/ui/Rating';
import { EmptyState, Loader } from '@/components/ui/States';
import { DashboardService } from '@/lib/api/services';
import Storage from '@/lib/storage';

function ClientProfile() {
  const searchParams = useSearchParams();
  const targetClientId = searchParams.get('clientId') || searchParams.get('id') || Storage.getItem('clientId');

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const fetchClientProfile = useCallback(async () => {
    if (!targetClientId) {
      setLoading(false);
      return;
    }
    try {
      const data = await DashboardService.getClientDetail(targetClientId);
      setProfile(data);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [targetClientId]);

  useEffect(() => {
    fetchClientProfile();
  }, [fetchClientProfile]);

  if (loading) return <Loader label="Loading profile…" />;
  if (!profile) return <EmptyState title="Client profile unavailable." />;

  const allReviews = profile.reviews || [];
  const displayedReviews = showAllReviews ? allReviews : allReviews.slice(0, 2);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Client Profile" back />

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <Card className="text-center">
          <Avatar src={profile.picture} name={profile.name} size="xl" className="mx-auto" />
          <h2 className="mt-3 text-xl font-extrabold text-ink">{profile.name}</h2>
          {profile.averageRating != null && (
            <div className="mt-2 flex items-center justify-center gap-2">
              <RatingStars value={profile.averageRating} />
              <span className="text-sm font-bold text-ink">{Number(profile.averageRating).toFixed(1)}</span>
            </div>
          )}

          <div className="mt-5 space-y-2 text-left text-sm text-subtle">
            {profile.address && (
              <p className="flex items-start gap-2">
                <MapPin size={15} className="mt-0.5 shrink-0 text-rose-500" /> {profile.address}
              </p>
            )}
            {profile.phone && (
              <p className="flex items-center gap-2">
                <Phone size={15} className="text-brand" /> {profile.phone}
              </p>
            )}
            {profile.email && (
              <p className="flex items-center gap-2 break-all">
                <Mail size={15} className="text-brand" /> {profile.email}
              </p>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          {(profile.totalHired != null || profile.activeWorkers != null) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {profile.totalHired != null && (
                <Card>
                  <p className="label-xs">Total hired</p>
                  <p className="text-2xl font-extrabold text-ink">{profile.totalHired}</p>
                </Card>
              )}
              {profile.activeWorkers != null && (
                <Card>
                  <p className="label-xs">Active workers</p>
                  <p className="text-2xl font-extrabold text-ink">{profile.activeWorkers}</p>
                </Card>
              )}
            </div>
          )}

          <Card>
            <h3 className="mb-4 text-base font-bold text-ink">Reviews from workers</h3>

            {allReviews.length === 0 ? (
              <EmptyState title="No reviews yet." icon={<MessageSquare size={22} />} />
            ) : (
              <>
                <div className="space-y-4">
                  {displayedReviews.map((review: any, index: number) => (
                    <div key={review.reviewId ?? index} className="rounded-xl bg-canvas p-4">
                      <div className="flex items-start gap-3">
                        <Avatar src={review.reviewerImage} name={review.reviewerName} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="truncate text-sm font-bold text-ink">{review.reviewerName || 'Worker'}</p>
                            <RatingStars value={review.rating} />
                          </div>
                          <p className="text-xs text-subtle">{review.date || review.reviewDate}</p>
                          <p className="mt-1.5 text-sm italic text-subtle">&quot;{review.comment}&quot;</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {allReviews.length > 2 && (
                  <Button variant="ghost" className="mt-4" onClick={() => setShowAllReviews(!showAllReviews)}>
                    {showAllReviews ? 'Show less' : `Show all ${allReviews.length} reviews`}
                  </Button>
                )}
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ClientProfilePage() {
  return (
    <Suspense fallback={null}>
      <ClientProfile />
    </Suspense>
  );
}
