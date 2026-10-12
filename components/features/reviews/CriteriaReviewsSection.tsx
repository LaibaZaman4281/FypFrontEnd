// 'use client';

// /**
//  * Port of `assets/components/helpers/CriteriaReviewSection.js`.
//  *
//  * Per-criterion star rows for a closing review (resignation confirmation /
//  * contract termination). The criteria list comes from
//  * `GET /api/Dashboard/GetReviewCriteria?interviewId=`, which resolves the
//  * worker's profession from Interview -> Worker -> Worker_Category and returns
//  * the common set plus one group per category the worker holds.
//  *
//  * CONTROLLED component: the parent owns the scores object and is told about
//  * every change via onScoreChange(criteriaId, score) and about the total
//  * required count via onLoaded(totalRequired), so the parent can validate
//  * before submit (every criterion is mandatory — `allMandatory`).
//  */

// import { useEffect, useState } from 'react';
// import { DashboardService } from '@/lib/api/services';
// import { RatingInput } from '@/components/ui/Rating';
// import type { ReviewCriteriaData, ReviewCriteriaItem } from '@/types';

// export default function CriteriaReviewSection({
//   interviewId,
//   scores,
//   onScoreChange,
//   onLoaded,
// }: {
//   interviewId: number;
//   scores: Record<number, number>;
//   onScoreChange: (criteriaId: number, score: number) => void;
//   onLoaded: (totalRequired: number) => void;
// }) {
//   const [data, setData] = useState<ReviewCriteriaData | null>(null);
//   const [failed, setFailed] = useState(false);

//   useEffect(() => {
//     let cancelled = false;
//     (async () => {
//       try {
//         const json = await DashboardService.getReviewCriteria(interviewId);
//         if (!cancelled) {
//           setData(json);
//           onLoaded && onLoaded(json.totalCriteria || 0);
//         }
//       } catch {
//         if (!cancelled) setFailed(true);
//       }
//     })();
//     return () => {
//       cancelled = true;
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [interviewId]);

//   const starRow = (c: ReviewCriteriaItem) => {
//     const current = scores[c.criteriaId] || 0;
//     return (
//       <div
//         key={c.criteriaId}
//         className="mb-1.5 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
//       >
//         <span className="mr-2 flex-1 text-[13px] text-slate-700">{c.name}</span>
//         <RatingInput value={current} onChange={(s) => onScoreChange(c.criteriaId, s)} size={21} />
//       </div>
//     );
//   };

//   if (failed) {
//     return (
//       <p className="my-2.5 text-[13px] text-red-700">Could not load the review criteria. Please go back and retry.</p>
//     );
//   }
//   if (!data) {
//     return <div className="my-4 text-sm font-semibold text-subtle">Loading review criteria…</div>;
//   }

//   return (
//     <div>
//       <p className="mb-1 text-[15px] font-extrabold text-ink">Rate the following</p>

//       <p className="mb-1.5 mt-3 text-[11px] font-extrabold uppercase tracking-wider text-brand">Basics</p>
//       {data.common.map(starRow)}

//       {data.professions.map((p) => (
//         <div key={p.categoryId}>
//           <p className="mb-1.5 mt-3 text-[11px] font-extrabold uppercase tracking-wider text-brand">{p.categoryName}</p>
//           {p.criteria.map(starRow)}
//         </div>
//       ))}
//     </div>
//   );
// }

'use client';

/**
 * Port of `assets/components/helpers/CriteriaReviewSection.js`.
 *
 * Per-criterion star rows for a closing review (resignation confirmation /
 * contract termination). The criteria list comes from
 * `GET /api/Dashboard/GetReviewCriteria?interviewId=`, which resolves the
 * worker's profession from Interview -> Worker -> Worker_Category and returns
 * the common set plus one group per category the worker holds.
 *
 * CONTROLLED component: the parent owns the scores object and is told about
 * every change via onScoreChange(criteriaId, score) and about the total
 * required count via onLoaded(totalRequired), so the parent can validate
 * before submit (every criterion is mandatory — `allMandatory`).
 */

import { useEffect, useState } from 'react';
import { DashboardService } from '@/lib/api/services';
import { RatingInput } from '@/components/ui/Rating';
import type { ReviewCriteriaData, ReviewCriteriaItem } from '@/types';

export interface CriteriaReviewSectionProps {
  interviewId: number;
  scores: Record<number, number>;
  onScoreChange: (criteriaId: number, score: number) => void;
  onLoaded?: (totalRequired: number) => void;
}

export default function CriteriaReviewSection({
  interviewId,
  scores = {},
  onScoreChange,
  onLoaded,
}: CriteriaReviewSectionProps) {
  const [data, setData] = useState<ReviewCriteriaData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setFailed(false);
        const json = await DashboardService.getReviewCriteria(interviewId);
        if (!cancelled && json) {
          setData(json);
          if (onLoaded) {
            onLoaded(json.totalCriteria || 0);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setFailed(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [interviewId, onLoaded]);

  const starRow = (c: ReviewCriteriaItem) => {
    if (!c || !c.criteriaId) return null;
    const current = scores[c.criteriaId] || 0;
    return (
      <div
        key={c.criteriaId}
        className="mb-1.5 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
      >
        <span className="mr-2 flex-1 text-[13px] text-slate-700">{c.name}</span>
        <RatingInput
          value={current}
          onChange={(s) => onScoreChange && onScoreChange(c.criteriaId, s)}
          size={21}
        />
      </div>
    );
  };

  if (failed) {
    return (
      <p className="my-2.5 text-[13px] font-medium text-red-700">
        Could not load the review criteria. Please go back and retry.
      </p>
    );
  }

  if (!data) {
    return (
      <div className="my-4 text-sm font-semibold text-slate-500">
        Loading review criteria…
      </div>
    );
  }

  return (
    <div>
      <p className="mb-1 text-[15px] font-extrabold text-slate-900">
        Rate the following
      </p>

      {/* Basic Criteria */}
      {Array.isArray(data.common) && data.common.length > 0 && (
        <>
          <p className="mb-1.5 mt-3 text-[11px] font-extrabold uppercase tracking-wider text-blue-600">
            Basics
          </p>
          {data.common.map(starRow)}
        </>
      )}

      {/* Profession Specific Criteria */}
      {Array.isArray(data.professions) &&
        data.professions.map((p) => (
          <div key={p.categoryId}>
            <p className="mb-1.5 mt-3 text-[11px] font-extrabold uppercase tracking-wider text-blue-600">
              {p.categoryName}
            </p>
            {Array.isArray(p.criteria) && p.criteria.map(starRow)}
          </div>
        ))}
    </div>
  );
}