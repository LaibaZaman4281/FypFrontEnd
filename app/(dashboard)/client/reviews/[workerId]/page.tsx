// 'use client';

// /**
//  * Port of `assets/components/Client/RatingAndReviewsScreen.js`.
//  * Same GetWorkerReviews/{workerId} call and the same average / count / list
//  * rendering; the query string carries the optional initial values the RN route
//  * params provided.
//  */

// import { Suspense, useCallback, useEffect, useState } from 'react';
// import { useParams, useSearchParams } from 'next/navigation';
// import { MessageSquare } from 'lucide-react';
// import Avatar from '@/components/ui/Avatar';
// import Card from '@/components/ui/Card';
// import PageHeader from '@/components/ui/PageHeader';
// import { RatingStars } from '@/components/ui/Rating';
// import { EmptyState, Loader } from '@/components/ui/States';
// import CriteriaBreakdown from '@/components/features/reviews/CriteriaBreakdown';
// import { DashboardService } from '@/lib/api/services';
// import type { Review } from '@/types';

// function RatingAndReviews() {
//   const params = useParams<{ workerId: string }>();
//   const searchParams = useSearchParams();
//   const workerId = params.workerId;

//   const [reviews, setReviews] = useState<Review[]>([]);
//   const [averageRating, setAverageRating] = useState(searchParams.get('rating') || '0.0');
//   const [reviewCount, setReviewCount] = useState(Number(searchParams.get('count') || 0));
//   const [isLoading, setIsLoading] = useState(true);

//   const fetchReviews = useCallback(async () => {
//     setIsLoading(true);
//     try {
//       const data: any = await DashboardService.getWorkerReviews(workerId);
//       setReviews(data.reviews || []);
//       setAverageRating(data.averageRating?.toString() || '0.0');
//       setReviewCount(data.reviewCount || 0);
//     } catch {
//       /* same as RN: logged and ignored */
//     } finally {
//       setIsLoading(false);
//     }
//   }, [workerId]);

//   useEffect(() => {
//     if (workerId) fetchReviews();
//     else setIsLoading(false);
//   }, [workerId, fetchReviews]);

//   return (
//     <div className="mx-auto max-w-3xl">
//       <PageHeader title="Rating & Reviews" back />

//       <Card className="mb-5 flex flex-col items-center py-8">
//         <p className="text-5xl font-extrabold text-ink">{averageRating}</p>
//         <RatingStars value={Number(averageRating)} size={28} className="mt-2" />
//         <p className="mt-2 text-sm text-subtle">Based on {reviewCount} reviews</p>
//       </Card>

//       {isLoading ? (
//         <Loader label="Loading reviews…" />
//       ) : reviews.length === 0 ? (
//         <EmptyState title="No reviews submitted yet." icon={<MessageSquare size={24} />} />
//       ) : (
//         <div className="space-y-4">
//           {reviews.map((review: any, index: number) => (
//             <Card key={review.reviewId ?? index}>
//               <div className="flex items-start gap-3">
//                 <Avatar src={review.reviewerImage} name={review.reviewerName} size="sm" />
//                 <div className="min-w-0 flex-1">
//                   <div className="flex flex-wrap items-center justify-between gap-2">
//                     <p className="truncate text-sm font-bold text-ink">{review.reviewerName || 'Client'}</p>
//                     <span className="flex items-center gap-2">
//                       {String(review.endType ?? '').toLowerCase() === 'terminated' && (
//                         <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700">Terminated</span>
//                       )}
//                       {String(review.endType ?? '').toLowerCase() === 'resigned' && (
//                         <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-700">Resigned</span>
//                       )}
//                       <RatingStars value={review.rating} />
//                     </span>
//                   </div>
//                   <p className="text-xs text-subtle">{review.date || review.reviewDate}</p>
//                   {review.workedPeriod && (
//                     <p className="mt-1 text-xs font-semibold text-brand">Worked: {review.workedPeriod}</p>
//                   )}
//                   <p className="mt-2 text-sm italic text-subtle">&quot;{review.comment}&quot;</p>
//                   <CriteriaBreakdown criteria={review.criteria} />
//                 </div>
//               </div>
//             </Card>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// export default function RatingAndReviewsPage() {
//   return (
//     <Suspense fallback={null}>
//       <RatingAndReviews />
//     </Suspense>
//   );
// }
'use client';

/**
 * Port of `assets/components/Client/RatingAndReviewsScreen.js`.
 * Same GetWorkerReviews/{workerId} call and the same average / count / list
 * rendering; the query string carries the optional initial values the RN route
 * params provided.
 */

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { RatingStars } from '@/components/ui/Rating';
import { EmptyState, Loader } from '@/components/ui/States';
import CriteriaBreakdown from '@/components/features/reviews/CriteriaBreakdown';
import { DashboardService } from '@/lib/api/services';
import type { Review } from '@/types';

function RatingAndReviews() {
  const params = useParams<{ workerId: string }>();
  const searchParams = useSearchParams();
  const workerId = params.workerId;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [clients, setClients] = useState<Record<string, { name?: string; picture?: string | null }>>({});
  const [averageRating, setAverageRating] = useState(searchParams.get('rating') || '0.0');
  const [reviewCount, setReviewCount] = useState(Number(searchParams.get('count') || 0));
  const [isLoading, setIsLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const data: any = await DashboardService.getWorkerReviews(workerId);
      const list = data.reviews || [];
      setReviews(list);
      setAverageRating(data.averageRating?.toString() || '0.0');
      setReviewCount(data.reviewCount || 0);

      // Enrich each row with the reviewer's profile (name + photo) via
      // GetClientDetail — one call per unique client.
      const ids = Array.from(new Set(list.map((r: any) => r.clientId).filter(Boolean))) as (string | number)[];
      const entries = await Promise.all(
        ids.map(async (id) => {
          try {
            const c: any = await DashboardService.getClientDetail(id);
            return [id, { name: c?.name, picture: c?.picture }] as const;
          } catch {
            return [id, {}] as const;
          }
        }),
      );
      setClients(Object.fromEntries(entries));
    } catch {
      /* same as RN: logged and ignored */
    } finally {
      setIsLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    if (workerId) fetchReviews();
    else setIsLoading(false);
  }, [workerId, fetchReviews]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Rating & Reviews" back />

      <Card className="mb-5 flex flex-col items-center py-8">
        <p className="text-5xl font-extrabold text-ink">{averageRating}</p>
        <RatingStars value={Number(averageRating)} size={28} className="mt-2" />
        <p className="mt-2 text-sm text-subtle">Based on {reviewCount} reviews</p>
      </Card>

      {isLoading ? (
        <Loader label="Loading reviews…" />
      ) : reviews.length === 0 ? (
        <EmptyState title="No reviews submitted yet." icon={<MessageSquare size={24} />} />
      ) : (
        <div className="space-y-4">
          {reviews.map((review: any, index: number) => {
            const client = review.clientId ? clients[review.clientId] : undefined;
            const displayName =
              (review.name && review.name !== 'Client' ? review.name : null) ||
              client?.name ||
              review.reviewerName ||
              'Client';
            const displayPic = review.reviewerImage || client?.picture;
            return (
            <Card key={review.reviewId ?? review.id ?? index}>
              <div className="flex items-start gap-3">
                <Avatar src={displayPic} name={displayName} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {review.clientId ? (
                      <Link
                        href={`/client/profile?clientId=${review.clientId}`}
                        className="truncate text-sm font-bold text-brand hover:underline"
                      >
                        {displayName}
                      </Link>
                    ) : (
                      <p className="truncate text-sm font-bold text-ink">{displayName}</p>
                    )}
                    <span className="flex items-center gap-2">
                      {String(review.endType ?? '').toLowerCase() === 'terminated' && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700">Terminated</span>
                      )}
                      {String(review.endType ?? '').toLowerCase() === 'resigned' && (
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-700">Resigned</span>
                      )}
                      <RatingStars value={review.rating} />
                    </span>
                  </div>
                  <p className="text-xs text-subtle">{review.date || review.reviewDate}</p>
                  {review.workedPeriod && (
                    <p className="mt-1 text-xs font-semibold text-brand">Worked: {review.workedPeriod}</p>
                  )}
                  <p className="mt-2 text-sm italic text-subtle">&quot;{review.comment}&quot;</p>
                  <CriteriaBreakdown criteria={review.criteria} />
                </div>
              </div>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function RatingAndReviewsPage() {
  return (
    <Suspense fallback={null}>
      <RatingAndReviews />
    </Suspense>
  );
}
