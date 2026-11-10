
'use client';

/**
 * Port of `assets/components/Client/RatingAndReviewsScreen.js`.
 * Same GetWorkerReviews/{workerId} call and the same average / count / list
 * rendering; the query string carries the optional initial values the RN route
 * params provided.
 */

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { RatingStars } from '@/components/ui/Rating';
import { EmptyState, Loader } from '@/components/ui/States';
import ReviewCard from '@/components/features/reviews/ReviewCard';
import { DashboardService } from '@/lib/api/services';
import { mapLimit } from '@/lib/utils/concurrency';
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
      const entries = await mapLimit(ids, 6, async (id) => {
        try {
          const c: any = await DashboardService.getClientDetail(id);
          return [id, { name: c?.name, picture: c?.picture }] as const;
        } catch {
          return [id, {}] as const;
        }
      });
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
            const client = review.clientId ? clients[String(review.clientId)] : undefined;
            const displayName =
              (review.name && review.name !== 'Client' ? review.name : null) ||
              client?.name ||
              review.reviewerName ||
              'Client';
            return (
              <ReviewCard
                key={review.reviewId ?? review.id ?? index}
                name={displayName}
                image={review.reviewerImage || client?.picture}
                nameHref={review.clientId ? `/client/profile?clientId=${review.clientId}` : undefined}
                rating={Number(review.rating) || 0}
                date={review.date || review.reviewDate}
                workedPeriod={review.workedPeriod}
                endType={review.endType}
                endReasonType={review.endReasonType}
                endReason={review.endReason}
                text={review.comment}
                criteria={review.criteria}
              />
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
