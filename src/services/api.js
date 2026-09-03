import { COURSES } from "@/data/courses";
import { DEMO_USER } from "@/data/user";
import {
  STUDENT_STATS,
  UPCOMING_TASKS,
  TUTOR_SEED,
  TUTOR_REPLIES,
  DIAGNOSTIC_QUESTIONS,
  PRACTICE_QUESTIONS,
  REASSESSMENT_QUESTIONS,
} from "@/data/student";
import { INSTRUCTOR_STATS, TOPIC_GAPS, MISCONCEPTIONS } from "@/data/instructor";
import { ADMIN_STATS, RECENT_ACTIVITY, TOP_COURSES } from "@/data/admin";

const delay = (ms = 320) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchDashboard() {
  await delay();
  return { user: DEMO_USER, stats: STUDENT_STATS, courses: COURSES, tasks: UPCOMING_TASKS };
}

export async function fetchCourses() {
  await delay();
  return COURSES;
}

export async function fetchMastery() {
  await delay();
  return COURSES;
}

export async function fetchTutor() {
  await delay();
  return TUTOR_SEED;
}

export async function sendTutorMessage(_text, turn = 0) {
  await delay(750);
  return TUTOR_REPLIES[turn % TUTOR_REPLIES.length];
}

export async function fetchDiagnosticQuestions() {
  await delay();
  return DIAGNOSTIC_QUESTIONS;
}

export async function fetchPracticeQuestions() {
  await delay();
  return PRACTICE_QUESTIONS;
}

export async function fetchReassessmentQuestions() {
  await delay();
  return REASSESSMENT_QUESTIONS;
}

export async function fetchProfile() {
  await delay();
  return { user: DEMO_USER, courses: COURSES, stats: STUDENT_STATS };
}

export async function fetchInstructor() {
  await delay();
  return { stats: INSTRUCTOR_STATS, gaps: TOPIC_GAPS, misconceptions: MISCONCEPTIONS };
}

export async function fetchAdmin() {
  await delay();
  return { stats: ADMIN_STATS, activity: RECENT_ACTIVITY, courses: TOP_COURSES };
}