'use client';

import { api, apiFetch } from './client';
import {
  API_ACCOUNT,
  API_AUTH,
  API_DASHBOARD,
  API_DIRECTORY,
  API_HABITS,
  API_POLICE,
  API_WORKER_SLOTS,
} from '@/lib/config';
import type {
  ActiveRequest,
  ClientDashboard,
  ClosingReviewRequest,
  FiltersData,
  Habit,
  LoginResponse,
  ResignationDetail,
  ResignationSummary,
  ReviewCriteriaData,
  ReviewsResponse,
  TerminationRequest,
  TimeSlot,
  WorkerCard,
  WorkerDetail,
} from '@/types';
import type { CharacterCertificateResponse } from '@/types/courses';

/* ------------------------------------------------------------------ *
 * AUTH  (api/Auth)
 * ------------------------------------------------------------------ */
export const AuthService = {
  login: (payload: { Role: string; EmailOrCnic: string; Password: string }) =>
    api.post<LoginResponse>(`${API_AUTH}/Login`, payload, { anonymous: true }),
};

/* ------------------------------------------------------------------ *
 * ACCOUNT CREATION  (api/AccountCreation) - multipart, same as RN
 * ------------------------------------------------------------------ */
export const AccountService = {
  signupClient: (form: FormData) => api.post(`${API_ACCOUNT}/SignupClient`, form, { anonymous: true }),
  updateClient: (form: FormData) => api.post(`${API_ACCOUNT}/UpdateClient`, form),
  signupWorker: (form: FormData) => api.post(`${API_ACCOUNT}/SignupWorker`, form, { anonymous: true }),
  updateWorker: (form: FormData) => api.post(`${API_ACCOUNT}/UpdateWorker`, form),
  signupCompany: (form: FormData) => api.post(`${API_ACCOUNT}/SignupCompany`, form, { anonymous: true }),
  updateCompany: (form: FormData) => api.post(`${API_ACCOUNT}/UpdateCompany`, form),
  signupPolice: (form: FormData) => api.post(`${API_ACCOUNT}/SignupPolice`, form, { anonymous: true }),
  updatePolice: (form: FormData) => api.post(`${API_ACCOUNT}/UpdatePolice`, form),
  getCategories: () => api.get<{ categoryId: number; categoryName: string }[]>(`${API_ACCOUNT}/GetCategories`, { anonymous: true }),
  getSkillsByCategory: (categoryId: number | string) =>
    api.get<{ skillsId: number; skillName: string }[]>(
      `${API_ACCOUNT}/GetSkillsByCategory?categoryId=${categoryId}`,
      { anonymous: true },
    ),
};

/* ------------------------------------------------------------------ *
 * DASHBOARD  (api/Dashboard) - the bulk of the app
 * ------------------------------------------------------------------ */
export const DashboardService = {
  /* ---- Client: discovery ---- */
  getWorkersForClient: (query: string) => api.get<WorkerCard[]>(`${API_DASHBOARD}/GetWorkersForClient?${query}`),
  getFiltersData: () => api.get<FiltersData>(`${API_DASHBOARD}/GetFiltersData`),
  getWorkerDetail: (id: number | string) => api.get<WorkerDetail>(`${API_DASHBOARD}/GetWorkerDetail/${id}`),
  getClientDashboard: () => api.get<ClientDashboard>(`${API_DASHBOARD}/GetClientDashboard`),
  getClientDetail: (clientId: number | string) => api.get(`${API_DASHBOARD}/GetClientDetail/${clientId}`),

  /* ---- Client: interviews & hiring ---- */
  getWorkerAvailableSlots: (workerId: number | string) =>
    api.get(`${API_DASHBOARD}/GetWorkerAvailableSlots/${workerId}`),
  bookInterview: (payload: unknown) => api.post(`${API_DASHBOARD}/BookInterview`, payload),
  getActiveRequests: (clientId: number | string) =>
    api.get<ActiveRequest[]>(`${API_DASHBOARD}/GetActiveRequests/${clientId}`),
  deleteInterviewRequest: (requestId: number | string) =>
    api.del(`${API_DASHBOARD}/DeleteInterviewRequest/${requestId}`),
  createHiring: (payload: unknown) => api.post(`${API_DASHBOARD}/CreateHiring`, payload),
  getClientWorkerDecisions: () => api.get(`${API_DASHBOARD}/GetClientWorkerDecisions`),
  finalizeHiringDecision: (payload: unknown) => api.post(`${API_DASHBOARD}/FinalizeHiringDecision`, payload),

  /* ---- Worker: requests ---- */
  getWorkerRequests: () => api.get(`${API_DASHBOARD}/GetWorkerRequests`),
  getAcceptedWorkerRequests: () => api.get(`${API_DASHBOARD}/GetAcceptedWorkerRequests`),
  updateWorkerDecision: (id: number | string, payload: unknown) =>
    api.put(`${API_DASHBOARD}/UpdateWorkerDecision/${id}`, payload),
  getWorkerJobConfirmations: () => api.get(`${API_DASHBOARD}/GetWorkerJobConfirmations`),
  workerAcceptJobOffer: (id: number | string) => api.put(`${API_DASHBOARD}/WorkerAcceptJobOffer/${id}`),
  workerRejectJobOffer: (id: number | string) => api.put(`${API_DASHBOARD}/WorkerRejectJobOffer/${id}`),
  clientDismissWorkerRejection: (id: number | string) =>
    api.del(`${API_DASHBOARD}/ClientDismissWorkerRejection/${id}`),

  /* ---- Worker: profile & duty ---- */
  updateDutyStatus: (workerId: number | string, isAvailable: boolean) =>
    api.put(`${API_DASHBOARD}/UpdateDutyStatus/${workerId}`, isAvailable),
  updateWorkerRadius: (workerId: number | string, radius: number) =>
    api.put(`${API_DASHBOARD}/UpdateWorkerRadius/${workerId}`, radius),

  /* ---- Exit flows ---- */
  getActiveJob: (workerId: number | string) => api.get(`${API_DASHBOARD}/GetActiveJob/${workerId}`),
  submitResignation: (payload: unknown) => api.post(`${API_DASHBOARD}/SubmitResignation`, payload),
  getClientResignations: () => api.get<ResignationSummary[]>(`${API_DASHBOARD}/GetClientResignations`),
  getResignationDetail: (id: number | string) =>
    api.get<ResignationDetail>(`${API_DASHBOARD}/GetResignationDetail/${id}`),
  /** Criteria applicable to this contract (common + per-category groups). */
  getReviewCriteria: (interviewId: number | string) =>
    api.get<ReviewCriteriaData>(`${API_DASHBOARD}/GetReviewCriteria?interviewId=${interviewId}`),
  confirmResignation: (payload: ClosingReviewRequest) =>
    api.post(`${API_DASHBOARD}/ConfirmResignation`, payload),
  terminateContract: (payload: TerminationRequest) =>
    api.post(`${API_DASHBOARD}/TerminateContract`, payload),
  getLatestTermination: (workerId: number | string) =>
    api.get(`${API_DASHBOARD}/GetLatestTermination/${workerId}`),
  getWorkerEndContractDetails: (workerId: number | string) =>
    api.get(`${API_DASHBOARD}/GetWorkerEndContractDetails/${workerId}`),
  submitWorkerReviewToClient: (payload: unknown) =>
    api.post(`${API_DASHBOARD}/SubmitWorkerReviewToClient`, payload),

  /* ---- Reviews ---- */
  getWorkerReviews: (workerId: number | string) =>
    api.get<ReviewsResponse>(`${API_DASHBOARD}/GetWorkerReviews/${workerId}`),

  /* ---- Location ---- */
  updateClientLocation: (payload: { ClientId: number; Latitude: number; Longitude: number }) =>
    api.post(`${API_DASHBOARD}/update-location`, payload),
  updateWorkerLocation: (payload: { workerId: number; latitude: number; longitude: number }) =>
    api.put(`${API_DASHBOARD}/UpdateWorkerLocation`, payload),
};

/* ------------------------------------------------------------------ *
 * WORKER SLOTS  (api/WorkerSlots)
 * ------------------------------------------------------------------ */
export const SlotsService = {
  getWorkerTimeSlots: (workerId: number | string) =>
    api.get<TimeSlot[]>(`${API_WORKER_SLOTS}/GetWorkerTimeSlots/${workerId}`),
  addTimeSlot: (payload: { workerId: number; startTime: string; endTime: string }) =>
    api.post(`${API_WORKER_SLOTS}/AddTimeSlot`, payload),
  deleteTimeSlot: (slotId: number | string) => api.del(`${API_WORKER_SLOTS}/DeleteTimeSlot/${slotId}`),
};

/* ------------------------------------------------------------------ *
 * HABITS  (api/Habits)
 * ------------------------------------------------------------------ */
export const HabitsService = {
  /** Public on the backend - the signup form calls it before a token exists. */
  getHabits: () => api.get<Habit[]>(`${API_HABITS}/GetHabits`, { anonymous: true }),
  getWorkerHabits: (workerId: number | string) => api.get(`${API_HABITS}/GetWorkerHabits/${workerId}`),
  updateWorkerHabits: (payload: { workerId: number; habitIds: number[] }) =>
    api.post(`${API_HABITS}/UpdateWorkerHabits`, payload),
};

/* ------------------------------------------------------------------ *
 * COMPANY DIRECTORY  (api/CompanyDirectory)
 * ------------------------------------------------------------------ */
export const DirectoryService = {
  getCompanyProfile: (companyId: number | string) =>
    api.get(`${API_DIRECTORY}/GetCompanyProfile?companyId=${companyId}`),
  getAllWorkers: (search = '') =>
    api.get(`${API_DIRECTORY}/GetAllWorkers${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getWorkerDetails: (workerId: number | string) => api.get(`${API_DIRECTORY}/GetWorkerDetails/${workerId}`),
  issueCertificate: (payload: unknown) => api.post(`${API_DIRECTORY}/IssueCertificate`, payload),
  getWorkerCertificateDetail: (workerId: number | string) =>
    api.get(`${API_DIRECTORY}/GetWorkerCertificateDetail/${workerId}`),
};

/* ------------------------------------------------------------------ *
 * POLICE  (api/Police)
 * ------------------------------------------------------------------ */
export const PoliceService = {
  /** Returns { totalResults, certifiedCount, uncertifiedCount, workers[] }. */
  getWorkersForVerification: (searchCnic = '') =>
    api.get(`${API_POLICE}/GetWorkersForVerification?searchCnic=${encodeURIComponent(searchCnic)}`),

  /** Worker + any existing certificate, so the officer can renew it. */
  getWorkerDetails: (workerId: number | string) => api.get(`${API_POLICE}/GetWorkerDetails/${workerId}`),

  /** Issue or renew a 5-year character certificate (officer id comes from the JWT). */
  issueCharacterCertificate: (payload: {
    workerId: number;
    certificateNo: string;
    characterStatus: string;
    remarks: string;
    verifiedCnic: string;
    cnicVerified: boolean;
  }) => api.post(`${API_POLICE}/IssueCharacterCertificate`, payload),

  /** The certificate as seen by the client (background check) and the worker. */
  getWorkerCharacterCertificate: (workerId: number | string) =>
    api.get<CharacterCertificateResponse>(`${API_POLICE}/GetWorkerCharacterCertificate/${workerId}`),
};

export { apiFetch };