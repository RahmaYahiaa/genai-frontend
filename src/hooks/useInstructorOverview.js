import { useCallback } from "react";
import useAsync from "@/hooks/useAsync";
import { getInstructorHome, getCourseAnalytics, getCoverageGaps } from "@/services/analytics";
import { listEnrollments, getCreationPolicy } from "@/services/courses";
import { listAssignmentsForCourse } from "@/services/assignments";
import { getReview, pendingCounts } from "@/services/review";

/**
 * Everything the instructor home and course list need, from real endpoints only:
 * GET /instructor/home, /courses/:id/enrollments, /courses/:id/analytics,
 * /courses/:id/coverage-gaps, /courses/:id/assignments and, for every published
 * assignment, the live review queue counts (/assignments/:id/review).
 * Each per-course call degrades on its own so one failure never blanks the page.
 */
export async function loadInstructorOverview() {
  const [home, policy] = await Promise.all([getInstructorHome(), getCreationPolicy().catch(() => null)]);
  const list = home?.courses ?? [];
  const courses = await Promise.all(
    list.map(async (course) => {
      const id = course.courseId;
      const [roster, analytics, gaps, assignments] = await Promise.all([
        listEnrollments(id, { page: 1, limit: 1 }).catch(() => null),
        getCourseAnalytics(id).catch(() => null),
        getCoverageGaps(id).catch(() => null),
        listAssignmentsForCourse(id).then((r) => r.items).catch(() => []),
      ]);
      const published = assignments.filter((a) => a.status !== "DRAFT");
      const queues = await Promise.all(
        published.map(async (a) => {
          const review = await getReview(a.id, { limit: 1 }).catch(() => null);
          return { assignment: a, ...pendingCounts(review) };
        }),
      );
      const materials = analytics?.totals?.materials ?? {};
      return {
        id,
        code: course.code ?? "",
        title: course.title ?? "",
        students: roster?.total ?? 0,
        assignments,
        drafts: assignments.filter((a) => a.status === "DRAFT"),
        openCount: assignments.filter((a) => a.status === "OPEN").length,
        queues,
        toReview: queues.reduce((s, q) => s + q.toReview, 0),
        readyToApprove: queues.reduce((s, q) => s + q.readyToApprove, 0),
        materialsTotal: materials.totalCount ?? 0,
        materialsReady: materials.readyCount ?? 0,
        avgScore: analytics?.totals?.avgCoursePercentage ?? null,
        topicsWithoutQuestions: gaps?.items ?? [],
        topicsTotal: gaps?.totalTopics ?? null,
      };
    }),
  );
  return { courses, canCreateCourse: policy?.allowDoctorCourseCreation === true };
}

export default function useInstructorOverview() {
  const load = useCallback(() => loadInstructorOverview(), []);
  return useAsync(load);
}
