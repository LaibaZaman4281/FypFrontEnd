// 'use client';

// /**
//  * Port of `assets/components/Company/CompanyCourseFormScreen.js`.
//  *
//  * Same fields, same validation order (name required → end ≥ start →
//  * class end > class start), the same derived `classTimings` string, and the
//  * same body posted to `POST /api/company/courses` or
//  * `PUT /api/company/courses/{id}`:
//  *
//  *   { courseName, startDate: 'YYYY-MM-DD', endDate, classTimings,
//  *     description|null, syllabus|null, isPublished }
//  */

// import { useMemo, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { CalendarRange, Clock4 } from 'lucide-react';
// import Button from '@/components/ui/Button';
// import Card from '@/components/ui/Card';
// import Toggle from '@/components/ui/Toggle';
// import { Input, Textarea } from '@/components/ui/Field';
// import { CompanyCourseService } from '@/lib/api/courses';
// import NotificationHelper from '@/lib/hooks/useNotification';
// import { toInputDate } from '@/lib/utils/format';
// import type { CourseDetail } from '@/types/courses';

// /** "09:00" -> "09:00 AM", matching the RN toLocaleTimeString(hour12) output. */
// function formatTime(value: string): string {
//   const [hourStr, minute] = value.split(':');
//   const hour = Number(hourStr);
//   const suffix = hour >= 12 ? 'PM' : 'AM';
//   const display = hour % 12 === 0 ? 12 : hour % 12;
//   return `${String(display).padStart(2, '0')}:${minute} ${suffix}`;
// }

// /** "09:00 AM - 05:00 PM" -> { start: '09:00', end: '17:00' } for edit mode. */
// function parseTimings(timings?: string): { start: string; end: string } {
//   const fallback = { start: '09:00', end: '17:00' };
//   if (!timings) return fallback;

//   const matches = timings.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/gi);
//   if (!matches || matches.length < 2) return fallback;

//   const to24 = (token: string) => {
//     const [, h, m, ap] = token.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i) || [];
//     let hour = Number(h);
//     if (ap?.toUpperCase() === 'PM' && hour < 12) hour += 12;
//     if (ap?.toUpperCase() === 'AM' && hour === 12) hour = 0;
//     return `${String(hour).padStart(2, '0')}:${m}`;
//   };

//   return { start: to24(matches[0]), end: to24(matches[1]) };
// }

// export default function CourseForm({ course }: { course?: CourseDetail | null }) {
//   const router = useRouter();
//   const existingTimes = parseTimings(course?.classTimings);

//   const [courseName, setCourseName] = useState(course?.courseName || '');
//   const [startDate, setStartDate] = useState(toInputDate(course?.startDate) || toInputDate(new Date()));
//   const [endDate, setEndDate] = useState(toInputDate(course?.endDate) || toInputDate(new Date()));
//   const [startTime, setStartTime] = useState(existingTimes.start);
//   const [endTime, setEndTime] = useState(existingTimes.end);
//   const [description, setDescription] = useState(course?.description || '');
//   const [syllabus, setSyllabus] = useState(course?.syllabus || '');
//   const [isPublished, setIsPublished] = useState(course?.isPublished ?? true);
//   const [saving, setSaving] = useState(false);

//   const classTimings = useMemo(
//     () => `${formatTime(startTime)} - ${formatTime(endTime)}`,
//     [startTime, endTime],
//   );

//   const save = async () => {
//     if (!courseName.trim()) {
//       NotificationHelper.showError('Course name is required.');
//       return;
//     }
//     if (endDate < startDate) {
//       NotificationHelper.showError('End date cannot be before start date.');
//       return;
//     }
//     if (endTime <= startTime) {
//       NotificationHelper.showError('Class end time must be after start time.');
//       return;
//     }

//     const body = {
//       courseName: courseName.trim(),
//       startDate,
//       endDate,
//       classTimings,
//       description: description.trim() || null,
//       syllabus: syllabus.trim() || null,
//       isPublished,
//     };

//     try {
//       setSaving(true);
//       if (course) {
//         await CompanyCourseService.updateCourse(course.courseId, body);
//       } else {
//         await CompanyCourseService.createCourse(body);
//       }
//       NotificationHelper.showSuccess(course ? 'Course updated.' : 'Course created.');
//       router.push('/company/courses');
//     } catch (error: any) {
//       NotificationHelper.showError(error?.message || 'Could not save the course.');
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <Card className="space-y-5 border-course-border">
//       <Input
//         label="Course name"
//         placeholder="e.g. Professional Housekeeping — Level 1"
//         value={courseName}
//         onChange={(e) => setCourseName(e.target.value)}
//       />

//       <div className="grid gap-4 sm:grid-cols-2">
//         <Input
//           label="Start date"
//           type="date"
//           value={startDate}
//           onChange={(e) => {
//             setStartDate(e.target.value);
//             // Same guard as the RN picker: pushing start past end moves end with it
//             if (e.target.value > endDate) setEndDate(e.target.value);
//           }}
//           icon={<CalendarRange size={18} />}
//         />
//         <Input
//           label="End date"
//           type="date"
//           value={endDate}
//           min={startDate}
//           onChange={(e) => setEndDate(e.target.value)}
//           icon={<CalendarRange size={18} />}
//         />
//         <Input
//           label="Class start time"
//           type="time"
//           value={startTime}
//           onChange={(e) => setStartTime(e.target.value)}
//           icon={<Clock4 size={18} />}
//         />
//         <Input
//           label="Class end time"
//           type="time"
//           value={endTime}
//           onChange={(e) => setEndTime(e.target.value)}
//           icon={<Clock4 size={18} />}
//           hint={`Saved as "${classTimings}"`}
//         />
//       </div>

//       <Textarea
//         label="Description"
//         placeholder="What will workers learn on this course?"
//         value={description}
//         onChange={(e) => setDescription(e.target.value)}
//       />

//       <Textarea
//         label="Syllabus"
//         placeholder="Module breakdown, assessment criteria…"
//         value={syllabus}
//         onChange={(e) => setSyllabus(e.target.value)}
//       />

//       <div className="flex items-center justify-between rounded-xl bg-course-pale p-4">
//         <div>
//           <p className="text-sm font-bold text-course-ink">Published</p>
//           <p className="mt-0.5 text-sm text-course-muted">Published courses appear in the worker catalogue.</p>
//         </div>
//         <Toggle checked={isPublished} onChange={setIsPublished} label="Published" />
//       </div>

//       <div className="flex gap-3">
//         <Button variant="outline" fullWidth onClick={() => router.back()}>
//           Cancel
//         </Button>
//         <Button fullWidth loading={saving} onClick={save}>
//           {course ? 'Save changes' : 'Create course'}
//         </Button>
//       </div>
//     </Card>
//   );
// }
'use client';

/**
 * Port of `assets/components/Company/CompanyCourseFormScreen.js`.
 *
 * Same fields, same validation order (name required → end ≥ start →
 * class end > class start), the same derived `classTimings` string, and the
 * same body posted to `POST /api/company/courses` or
 * `PUT /api/company/courses/{id}`:
 *
 *   { courseName, startDate: 'YYYY-MM-DD', endDate, classTimings,
 *     description|null, syllabus|null, isPublished }
 */

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarRange, Clock4 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Toggle from '@/components/ui/Toggle';
import { Input, Textarea } from '@/components/ui/Field';
import { CompanyCourseService } from '@/lib/api/courses';
import NotificationHelper from '@/lib/hooks/useNotification';
import { toInputDate } from '@/lib/utils/format';
import type { CourseDetail } from '@/types/courses';

/** "09:00" -> "09:00 AM", matching the RN toLocaleTimeString(hour12) output. */
function formatTime(value: string): string {
  const [hourStr, minute] = value.split(':');
  const hour = Number(hourStr);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${String(display).padStart(2, '0')}:${minute} ${suffix}`;
}

/** "09:00 AM - 05:00 PM" -> { start: '09:00', end: '17:00' } for edit mode. */
function parseTimings(timings?: string): { start: string; end: string } {
  const fallback = { start: '09:00', end: '17:00' };
  if (!timings) return fallback;

  const matches = timings.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/gi);
  if (!matches || matches.length < 2) return fallback;

  const to24 = (token: string) => {
    const [, h, m, ap] = token.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i) || [];
    let hour = Number(h);
    if (ap?.toUpperCase() === 'PM' && hour < 12) hour += 12;
    if (ap?.toUpperCase() === 'AM' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${m}`;
  };

  return { start: to24(matches[0]), end: to24(matches[1]) };
}

export default function CourseForm({ course }: { course?: CourseDetail | null }) {
  const router = useRouter();
  const existingTimes = parseTimings(course?.classTimings);

  const [courseName, setCourseName] = useState(course?.courseName || '');
  const [startDate, setStartDate] = useState(toInputDate(course?.startDate) || toInputDate(new Date()));
  const [endDate, setEndDate] = useState(toInputDate(course?.endDate) || toInputDate(new Date()));
  const [startTime, setStartTime] = useState(existingTimes.start);
  const [endTime, setEndTime] = useState(existingTimes.end);
  const [description, setDescription] = useState(course?.description || '');
  const [syllabus, setSyllabus] = useState(course?.syllabus || '');
  const [isPublished, setIsPublished] = useState(course?.isPublished ?? true);
  const [saving, setSaving] = useState(false);

  const classTimings = useMemo(
    () => `${formatTime(startTime)} - ${formatTime(endTime)}`,
    [startTime, endTime],
  );

  const save = async () => {
    if (!courseName.trim()) {
      NotificationHelper.showError('Course name is required.');
      return;
    }
    if (endDate < startDate) {
      NotificationHelper.showError('End date cannot be before start date.');
      return;
    }
    if (endTime <= startTime) {
      NotificationHelper.showError('Class end time must be after start time.');
      return;
    }

    const body = {
      courseName: courseName.trim(),
      startDate,
      endDate,
      classTimings,
      description: description.trim() || null,
      syllabus: syllabus.trim() || null,
      isPublished,
    };

    try {
      setSaving(true);
      if (course) {
        await CompanyCourseService.updateCourse(course.courseId, body);
      } else {
        await CompanyCourseService.createCourse(body);
      }
      NotificationHelper.showSuccess(course ? 'Course updated.' : 'Course created.');
      router.push('/company/courses');
    } catch (error: any) {
      NotificationHelper.showError(error?.message || 'Could not save the course.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="space-y-5 border-course-border">
      <Input
        label="Course name"
        placeholder="e.g. Professional Housekeeping — Level 1"
        value={courseName}
        onChange={(e) => setCourseName(e.target.value)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Start date"
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            // Same guard as the RN picker: pushing start past end moves end with it
            if (e.target.value > endDate) setEndDate(e.target.value);
          }}
          icon={<CalendarRange size={18} />}
        />
        <Input
          label="End date"
          type="date"
          value={endDate}
          min={startDate}
          onChange={(e) => setEndDate(e.target.value)}
          icon={<CalendarRange size={18} />}
        />
        <Input
          label="Class start time"
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          icon={<Clock4 size={18} />}
        />
        <Input
          label="Class end time"
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          icon={<Clock4 size={18} />}
          hint={`Saved as "${classTimings}"`}
        />
      </div>

      <Textarea
        label="Description"
        placeholder="What will workers learn on this course?"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <Textarea
        label="Syllabus"
        placeholder="Module breakdown, assessment criteria…"
        value={syllabus}
        onChange={(e) => setSyllabus(e.target.value)}
      />

      <div className="flex items-center justify-between rounded-xl bg-course-pale p-4">
        <div>
          <p className="text-sm font-bold text-course-ink">Published</p>
          <p className="mt-0.5 text-sm text-course-muted">Published courses appear in the worker catalogue.</p>
        </div>
        <Toggle checked={isPublished} onChange={setIsPublished} label="Published" />
      </div>

      <div className="flex gap-3">
        <Button variant="outline" fullWidth onClick={() => router.back()}>
          Cancel
        </Button>
        <Button fullWidth loading={saving} onClick={save}>
          {course ? 'Save changes' : 'Create course'}
        </Button>
      </div>
    </Card>
  );
}