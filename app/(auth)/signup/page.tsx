'use client';

/**
 * Port of `assets/components/Auth/SignupScreen.js` (the 2,035-line screen).
 *
 * Preserved exactly:
 *  - three roles (Client / Worker / Company) and the Worker 3-step wizard
 *    (1 Basic Information, 2 Professional Details, 3 Habits & Security)
 *  - every validation message and the order they fire in
 *  - mandatory habits + mandatory map location for new Client/Worker accounts
 *  - the multipart field names: Name, Phone, Address, Password, Email, Cnic,
 *    Salary, Age, Gender, Bio, skillsJson, experiencesJson, habitsJson, PictureFile,
 *    Latitude, Longitude / CompanyName, PhoneNo, CompanyAddress, LicenseNumber,
 *    LogoFile, and the ClientId / WorkerId / CompanyID key in edit mode
 *  - the 45s submit timeout and the duplicate-submit guard
 *  - post-submit routing: edit -> role dashboard, signup -> /login
 *
 * Updated for frontend `a26103d`: skills and experience are now two separate
 * payloads — `skillsJson` ([{CategoryId, SkillsId}] → Worker_Category) and
 * `experiencesJson` ([{WorkAt, ExpDetail, Duration}] → Experience). Saving
 * requires a primary category + at least one sub-skill; experience is optional.
 *
 * Changed only in presentation: the map and the skills builder open as dialogs
 * instead of separate screens, which removes the stale route-param draft the
 * mobile version had to work around.
 */

import { Suspense, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Camera,
  Check,
  ChevronRight,
  CreditCard,
  Home,
  IdCard,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
  Wrench,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';
import Modal from '@/components/ui/Modal';
import SkillsBuilder, { type ExperienceRecord, type SkillRecord } from '@/components/features/skills/SkillsBuilder';
import NotificationHelper from '@/lib/hooks/useNotification';
import { API_ACCOUNT, SERVER_BASE, resolveImage } from '@/lib/config';
import { HabitsService } from '@/lib/api/services';
import Storage from '@/lib/storage';
import { cn } from '@/lib/utils/cn';
import type { Habit, UserRole } from '@/types';

const LocationPicker = dynamic(() => import('@/components/features/map/LocationPicker'), { ssr: false });

const SIGNUP_TIMEOUT_MS = 45000;
const WORKER_TOTAL_STEPS = 3;

const ROLES: { key: Exclude<UserRole, 'Police'>; label: string; icon: typeof User }[] = [
  { key: 'Client', label: 'Client', icon: User },
  { key: 'Worker', label: 'Worker', icon: Wrench },
  { key: 'Company', label: 'Company', icon: Building2 },
];

interface PickedImage {
  file?: File;
  uri: string;
}

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();

  const [role, setRole] = useState<Exclude<UserRole, 'Police'>>('Client');
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [cnic, setCnic] = useState('');
  const [salary, setSalary] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedImage, setSelectedImage] = useState<PickedImage | null>(null);
  // skillsJsonData = [{ CategoryId, SkillsId }] — Worker_Category junction table
  const [skillsJsonData, setSkillsJsonData] = useState<SkillRecord[]>([]);
  // experiencesData = [{ WorkAt, ExpDetail, Duration }] — Experience table
  const [experiencesData, setExperiencesData] = useState<ExperienceRecord[]>([]);
  const [gender, setGender] = useState('Male');
  const [bio, setBio] = useState('');

  const [habitsCatalog, setHabitsCatalog] = useState<Habit[]>([]);
  const [selectedHabitIds, setSelectedHabitIds] = useState<number[]>([]);
  const [isLoadingHabits, setIsLoadingHabits] = useState(false);
  const [habitsPrefilled, setHabitsPrefilled] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [draftLocation, setDraftLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const isEditMode = params.get('edit') === '1';
  const [editEntityId, setEditEntityId] = useState<string | number | null>(null);
  const submittingRef = useRef(false);

  /* ---------------- Edit mode hydration ----------------
   * RN received `route.params.initialData` from the profile screens. On the web
   * the profile screens stash the same object in sessionStorage under
   * `editProfileDraft` before routing here - same fields, same behaviour. */
  useEffect(() => {
    if (!isEditMode || typeof window === 'undefined') return;

    try {
      const raw = window.sessionStorage.getItem('editProfileDraft');
      if (!raw) return;
      const payload = JSON.parse(raw);
      const data = payload.initialData || {};
      const targetRole = (payload.role || 'Worker') as Exclude<UserRole, 'Police'>;

      setRole(targetRole);
      setEditEntityId(data.id ?? null);
      setName(data.name || '');
      setPhone(data.phone || data.phoneNo || '');
      setAddress(data.location || data.companyAddress || data.address || '');
      setEmail(data.email || '');
      setBio(data.bio || '');
      const dbGender = data.gender ? String(data.gender).toLowerCase() : 'male';
      setGender(dbGender === 'female' ? 'Female' : 'Male');

      if (targetRole === 'Worker') {
        setAge(data.age?.toString() || '');
        setCnic(data.cnic || '');
        const rawSalary = data.salary ? data.salary.toString() : '0';
        setSalary(rawSalary.replace('Not Set', '0'));

        // Skills (Worker_Category junction) for editing
        if (Array.isArray(data.rawWorkerCategories) && data.rawWorkerCategories.length > 0) {
          setSkillsJsonData(
            data.rawWorkerCategories.map((wc: any) => ({
              CategoryId: Number(wc.CategoryId ?? wc.categoryId),
              SkillsId: Number(wc.SkillsId ?? wc.skillsId),
            })),
          );
        }

        // Raw experience records for editing
        if (Array.isArray(data.rawExperiences)) {
          setExperiencesData(
            data.rawExperiences.map((e: any) => ({
              WorkAt: e.WorkAt || e.workAt || '',
              ExpDetail: e.ExpDetail || e.expDetail || '',
              Duration: e.Duration || e.duration || '',
            })),
          );
        }
        if (Array.isArray(data.habits)) {
          setSelectedHabitIds(data.habits.map((h: any) => h.id ?? h.habitId).filter(Boolean));
        }
        setHabitsPrefilled(true);
      } else if (targetRole === 'Company') {
        setCompanyName(data.companyName || '');
        setLicenseNumber(data.licenseNumber || '');
      }

      if (data.picture && typeof data.picture === 'string') {
        setSelectedImage({ uri: resolveImage(data.picture) || data.picture });
      }
    } catch {
      /* ignore malformed draft */
    }
  }, [isEditMode]);

  /* ---------------- Habits catalogue (Worker only) ---------------- */
  useEffect(() => {
    if (role !== 'Worker') return;
    let cancelled = false;

    (async () => {
      try {
        setIsLoadingHabits(true);
        const list = await HabitsService.getHabits();
        if (!cancelled) setHabitsCatalog(Array.isArray(list) ? list : []);
      } catch {
        /* same as RN: silent, the step shows a retry hint */
      } finally {
        if (!cancelled) setIsLoadingHabits(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [role]);

  const toggleHabit = (habitId: number) => {
    setSelectedHabitIds((prev) => (prev.includes(habitId) ? prev.filter((id) => id !== habitId) : [...prev, habitId]));
  };

  const pickImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedImage({ file, uri: URL.createObjectURL(file) });
  };

  /* ---------------- Submit ---------------- */
  const performSignup = async (location: { latitude: number; longitude: number } | null) => {
    if (submittingRef.current) return;
    submittingRef.current = true;

    const needsLocation = !isEditMode && (role === 'Client' || role === 'Worker');
    if (needsLocation && !location) {
      NotificationHelper.showError('Please pin your location on the map to continue.');
      submittingRef.current = false;
      setMapOpen(true);
      return;
    }

    let endpoint = '';
    if (role === 'Company') endpoint = isEditMode ? 'UpdateCompany' : 'SignupCompany';
    else if (role === 'Client') endpoint = isEditMode ? 'UpdateClient' : 'SignupClient';
    else endpoint = isEditMode ? 'UpdateWorker' : 'SignupWorker';

    const url = `${API_ACCOUNT}/${endpoint}`;
    const formData = new FormData();

    if (isEditMode) {
      if (!editEntityId) {
        NotificationHelper.showError('Session error: Missing profile tracking metadata.');
        submittingRef.current = false;
        return;
      }
      formData.append(
        role === 'Company' ? 'CompanyID' : role === 'Client' ? 'ClientId' : 'WorkerId',
        String(editEntityId),
      );
    }

    if (role === 'Company') {
      formData.append('CompanyName', companyName);
      formData.append('PhoneNo', phone);
      formData.append('CompanyAddress', address);
      formData.append('LicenseNumber', licenseNumber);
      formData.append('Email', email);
      formData.append('Password', password || '');
      if (selectedImage?.file) formData.append('LogoFile', selectedImage.file, selectedImage.file.name || 'logo.jpg');
    } else {
      formData.append('Name', name);
      formData.append('Phone', phone);
      formData.append('Address', address);
      formData.append('Password', password || '');
      formData.append('Email', email);

      if (role === 'Worker') {
        formData.append('Cnic', cnic);
        formData.append('Salary', salary || '0');
        formData.append('Age', age || '0');
        formData.append('Gender', gender);
        formData.append('Bio', bio);
        formData.append('skillsJson', JSON.stringify(skillsJsonData));
        formData.append('experiencesJson', JSON.stringify(experiencesData));
        if (!isEditMode || habitsPrefilled) {
          formData.append('habitsJson', JSON.stringify(selectedHabitIds));
        }
      }

      if (selectedImage?.file) formData.append('PictureFile', selectedImage.file, selectedImage.file.name || 'profile.jpg');

      if (needsLocation && location) {
        formData.append('Latitude', Number(location.latitude).toFixed(6));
        formData.append('Longitude', Number(location.longitude).toFixed(6));
      }
    }

    const actionLabel = isEditMode ? 'Update' : 'Signup';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SIGNUP_TIMEOUT_MS);

    setIsLoading(true);
    try {
      const token = Storage.getItem('userToken');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...(isEditMode && token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
        signal: controller.signal,
      });

      const rawBody = await response.text();
      let result: any = {};
      try {
        result = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        result = { message: rawBody ? rawBody.slice(0, 180) : '' };
      }

      if (response.ok) {
        setPendingLocation(null);
        NotificationHelper.showSuccess(result.message || 'Operation completed successfully!');
        setTimeout(() => {
          if (isEditMode) {
            window.sessionStorage.removeItem('editProfileDraft');
            router.push(role === 'Worker' ? '/worker/dashboard' : '/client/dashboard');
          } else {
            router.replace('/login');
          }
        }, 1200);
      } else {
        NotificationHelper.showError(`${actionLabel} failed (${response.status}): ${result.message || 'unknown server error'}`);
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        NotificationHelper.showError(
          `${actionLabel} timed out after ${Math.round(SIGNUP_TIMEOUT_MS / 1000)}s — the server never answered. ` +
            `Check the backend is running at ${SERVER_BASE}, then try again.`,
        );
      } else {
        NotificationHelper.showError(`Cannot reach backend server (${error?.message || 'network error'}).`);
      }
    } finally {
      clearTimeout(timeoutId);
      submittingRef.current = false;
      setIsLoading(false);
    }
  };

  const handleSignup = () => {
    if (role === 'Company') {
      if (!companyName || !email || !phone || !licenseNumber || !address) {
        NotificationHelper.showError('Please fill out all company details.');
        return;
      }
    } else if (!name || !phone || !address || !email) {
      NotificationHelper.showError('Please fill out all fundamental profile details.');
      return;
    }

    if (!isEditMode && !password) {
      NotificationHelper.showError('Password field is required.');
      return;
    }

    if (password !== confirmPassword) {
      NotificationHelper.showError('Passwords do not match.');
      return;
    }

    if (!isEditMode && !selectedImage && (role === 'Client' || role === 'Worker')) {
      NotificationHelper.showError('Please upload a profile picture.');
      return;
    }

    if (role === 'Worker' && skillsJsonData.length === 0) {
      NotificationHelper.showError('Please select at least one sub-skill to proceed.');
      return;
    }

    if (role === 'Worker' && !isEditMode && selectedHabitIds.length === 0) {
      NotificationHelper.showError('Please tick at least one habit to proceed.');
      return;
    }

    if (!isEditMode && (role === 'Client' || role === 'Worker') && !pendingLocation) {
      setMapOpen(true);
      return;
    }

    performSignup(pendingLocation);
  };

  const showStepUi = role === 'Worker' && !isEditMode ? true : role === 'Worker';
  const isLastWorkerStep = !showStepUi || step >= WORKER_TOTAL_STEPS;

  const validateWorkerStep = (): string | null => {
    if (step === 1) {
      if (!isEditMode && !selectedImage) return 'Please upload a profile picture.';
      if (!name.trim()) return 'Please enter your full name.';
      if (!cnic.trim()) return 'Please enter your CNIC number.';
      if (!phone.trim()) return 'Please enter your phone number.';
      if (!address.trim()) return 'Please enter your address or street.';
      return null;
    }
    if (step === 2) {
      if (!email.trim()) return 'Please enter your email address.';
      if (!isEditMode && skillsJsonData.length === 0) return 'Please select at least one sub-skill.';
      return null;
    }
    if (!isEditMode && selectedHabitIds.length === 0) return 'Please tick at least one habit.';
    if (!isEditMode && !password) return 'Please create a password.';
    if (password && password !== confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const submitHandler = (event: React.FormEvent) => {
    event.preventDefault();

    if (showStepUi && !isLastWorkerStep) {
      const problem = validateWorkerStep();
      if (problem) {
        NotificationHelper.showError(problem);
        return;
      }
      setStep(step + 1);
      return;
    }
    if (showStepUi) {
      const problem = validateWorkerStep();
      if (problem) {
        NotificationHelper.showError(problem);
        return;
      }
    }
    handleSignup();
  };

  const headerTitle = isEditMode ? 'Edit Profile' : 'Create Account';
  const stepSubtitle = ['Basic Information', 'Professional Details', 'Habits & Security'];
  const headerSubtitle = isEditMode
    ? 'Update your information'
    : showStepUi
      ? stepSubtitle[Math.min(Math.max(step, 1), WORKER_TOTAL_STEPS) - 1]
      : 'Basic Information';

  const submitLabel =
    showStepUi && !isLastWorkerStep ? 'Next' : isEditMode ? (role === 'Company' ? 'Update' : 'Update Profile') : 'Sign Up';

  /* ---------------- Sub-renders ---------------- */
  const AvatarPicker = (
    <div className="mb-6 flex items-center gap-4">
      <label className="relative cursor-pointer">
        <input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={pickImage} />
        <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-brand-border bg-brand-light text-brand">
          {selectedImage?.uri ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selectedImage.uri} alt="Profile preview" className="h-full w-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-1 text-xs font-bold">
              <Camera size={20} />
              Photo
            </span>
          )}
        </span>
      </label>
      <div className="text-sm">
        <p className="font-bold text-ink">{role === 'Company' ? 'Company logo' : 'Profile picture'}</p>
        <p className="mt-0.5 text-subtle">JPG or PNG. Required for Client and Worker accounts.</p>
      </div>
    </div>
  );

  const LocationCard =
    isEditMode || (role !== 'Client' && role !== 'Worker') ? null : (
      <button
        type="button"
        onClick={() => setMapOpen(true)}
        className={cn(
          'flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition',
          pendingLocation ? 'border-success/40 bg-emerald-50' : 'border-brand-border bg-brand-light hover:bg-brand-border/60',
        )}
      >
        <span
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-xl',
            pendingLocation ? 'bg-success text-white' : 'bg-white text-brand',
          )}
        >
          <MapPin size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-ink">{pendingLocation ? 'Location Pinned' : 'Location Required'}</span>
          <span className="block truncate text-xs text-subtle">
            {pendingLocation
              ? `${pendingLocation.latitude.toFixed(5)}, ${pendingLocation.longitude.toFixed(5)} — click to change`
              : 'Click to pinpoint your address on the live map'}
          </span>
        </span>
        <ChevronRight size={18} className="text-muted" />
      </button>
    );

  const PasswordPair = (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input
        label={isEditMode ? 'New Password' : 'Password'}
        type={showPassword ? 'text' : 'password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        icon={<Lock size={18} />}
        trailing={
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="px-2 text-xs font-bold text-brand">
            {showPassword ? 'Hide' : 'Show'}
          </button>
        }
      />
      <Input
        label="Confirm"
        type={showConfirmPassword ? 'text' : 'password'}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        icon={<Lock size={18} />}
        trailing={
          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="px-2 text-xs font-bold text-brand">
            {showConfirmPassword ? 'Hide' : 'Show'}
          </button>
        }
      />
    </div>
  );

  const renderBody = () => {
    if (role === 'Company') {
      return (
        <>
          {AvatarPicker}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} icon={<Building2 size={18} />} />
            <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} icon={<Phone size={18} />} />
            <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail size={18} />} />
            <Input label="License / Registration Number" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} icon={<IdCard size={18} />} />
          </div>
          <Input label="Company Address" value={address} onChange={(e) => setAddress(e.target.value)} icon={<Home size={18} />} className="mt-4" />
          <div className="mt-4">{PasswordPair}</div>
        </>
      );
    }

    if (role === 'Worker' && step === 1) {
      return (
        <>
          {AvatarPicker}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} icon={<User size={18} />} />
            <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} icon={<Phone size={18} />} />
            <Input label="Age" type="number" value={age} onChange={(e) => setAge(e.target.value)} icon={<CreditCard size={18} />} />
            <Input label="CNIC" value={cnic} onChange={(e) => setCnic(e.target.value)} icon={<IdCard size={18} />} placeholder="XXXXX-XXXXXXX-X" />
          </div>
          <Input label="Address or Street" value={address} onChange={(e) => setAddress(e.target.value)} icon={<MapPin size={18} />} className="mt-4" />

          <p className="label-xs mt-5 mb-2">Select gender</p>
          <div className="flex gap-3">
            {['Male', 'Female'].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setGender(option)}
                className={cn(
                  'flex-1 rounded-xl border px-4 py-2.5 text-sm font-bold transition',
                  gender === option ? 'border-brand bg-brand text-white' : 'border-line bg-white text-subtle hover:bg-canvas',
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      );
    }

    if (role === 'Worker' && step === 2) {
      return (
        <>
          <Textarea
            label="Professional description"
            placeholder="Briefly describe your work experience and skills…"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail size={18} />} />
            <Input label="Expected Salary" type="number" value={salary} onChange={(e) => setSalary(e.target.value)} icon={<CreditCard size={18} />} />
          </div>

          <button
            type="button"
            onClick={() => setSkillsOpen(true)}
            className="mt-4 flex w-full items-center gap-3 rounded-xl border border-line bg-white px-4 py-3.5 text-left transition hover:border-brand-border"
          >
            <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', skillsJsonData.length > 0 ? 'bg-emerald-50 text-success' : 'bg-brand-light text-brand')}>
              {skillsJsonData.length > 0 ? <Check size={18} /> : <Wrench size={18} />}
            </span>
            <span className="flex-1 text-sm font-bold text-ink">
              {skillsJsonData.length > 0
                ? `${skillsJsonData.length} Skill${skillsJsonData.length > 1 ? 's' : ''}${
                    experiencesData.length > 0 ? ` · ${experiencesData.length} Experience${experiencesData.length > 1 ? 's' : ''}` : ''
                  }`
                : 'Add Skills & Experience'}
            </span>
            <ChevronRight size={18} className="text-muted" />
          </button>
        </>
      );
    }

    if (role === 'Worker' && step === 3) {
      return (
        <>
          <div className="mb-2 flex items-center gap-2">
            <p className="label-xs">Habits</p>
            <span className="rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-bold uppercase text-brand">Required</span>
          </div>
          <p className="mb-3 text-sm text-subtle">Shown on your profile, and used by clients when they filter workers.</p>

          {isLoadingHabits ? (
            <p className="py-4 text-sm text-subtle">Loading habits…</p>
          ) : habitsCatalog.length === 0 ? (
            <p className="py-4 text-sm text-subtle">Could not load the habit list. Check your connection and reopen this step.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {habitsCatalog.map((habit: any) => {
                const habitId = habit.habitId ?? habit.id;
                const isChecked = selectedHabitIds.includes(habitId);
                return (
                  <button
                    key={habitId}
                    type="button"
                    onClick={() => toggleHabit(habitId)}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition',
                      isChecked ? 'border-brand bg-brand-light text-brand' : 'border-line bg-white text-subtle hover:bg-canvas',
                    )}
                  >
                    <span className={cn('flex h-5 w-5 items-center justify-center rounded border', isChecked ? 'border-brand bg-brand text-white' : 'border-line')}>
                      {isChecked && <Check size={13} />}
                    </span>
                    {habit.name ?? habit.habitName}
                  </button>
                );
              })}
            </div>
          )}

          <p className="mt-3 text-xs font-semibold text-subtle">
            {selectedHabitIds.length === 0
              ? 'Tick at least one habit'
              : `${selectedHabitIds.length} habit${selectedHabitIds.length > 1 ? 's' : ''} selected`}
          </p>

          <p className="label-xs mb-2 mt-6">Security</p>
          {PasswordPair}

          <div className="mt-4">{LocationCard}</div>
        </>
      );
    }

    /* Client */
    return (
      <>
        {AvatarPicker}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} icon={<User size={18} />} />
          <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} icon={<Phone size={18} />} />
          <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail size={18} />} />
          <Input label="Address or Street" value={address} onChange={(e) => setAddress(e.target.value)} icon={<Home size={18} />} />
        </div>
        <div className="mt-4">{PasswordPair}</div>
        <div className="mt-4">{LocationCard}</div>
      </>
    );
  };

  return (
    <section className="w-full lg:max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => (showStepUi && step > 1 ? setStep(step - 1) : router.back())}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-ink transition hover:bg-canvas"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold tracking-tight text-ink">{headerTitle}</h1>
          <p className="text-sm text-subtle">
            {showStepUi ? `Step ${step} of ${WORKER_TOTAL_STEPS} • ${headerSubtitle}` : headerSubtitle}
          </p>
        </div>
        <Image src="/images/logo.png" alt="" width={40} height={40} className="rounded-xl" />
      </div>

      {showStepUi && (
        <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${Math.round((Math.min(step, WORKER_TOTAL_STEPS) / WORKER_TOTAL_STEPS) * 100)}%` }}
          />
        </div>
      )}

      <form onSubmit={submitHandler} className="rounded-3xl border border-line bg-white p-6 shadow-card sm:p-8">
        {!isEditMode && (
          <>
            <div className="mb-2 flex items-center gap-2">
              <p className="label-xs">Select role</p>
              <span className="rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-bold uppercase text-brand">Required</span>
            </div>
            <div className="mb-6 grid grid-cols-3 gap-2">
              {ROLES.map(({ key, label, icon: Icon }) => {
                const active = role === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setRole(key);
                      setStep(1);
                    }}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-bold transition',
                      active ? 'border-brand bg-brand-light text-brand' : 'border-line bg-white text-subtle hover:bg-canvas',
                    )}
                  >
                    <Icon size={19} className={active ? 'text-brand' : 'text-muted'} />
                    {label}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {renderBody()}

        <Button type="submit" size="lg" fullWidth loading={isLoading} className="mt-6">
          {submitLabel}
        </Button>

        {!isEditMode && (
          <p className="mt-4 text-center text-sm text-subtle">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-brand hover:underline">
              Sign in
            </Link>
          </p>
        )}
      </form>

      {/* ---- Location dialog (replaces navigating to MapScreen) ---- */}
      <Modal
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        title={role === 'Worker' ? 'Set Your Work Location' : 'Set Your Location'}
        description={role === 'Worker' ? 'Pin the area where you provide service' : 'Pin the area where you need service'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setMapOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="success"
              icon={<MapPin size={16} />}
              onClick={() => {
                if (!draftLocation) return;
                setPendingLocation(draftLocation);
                setMapOpen(false);
                NotificationHelper.showSuccess('Location pinned.');
              }}
            >
              Confirm Location
            </Button>
          </>
        }
      >
        <LocationPicker value={draftLocation ?? pendingLocation} onChange={setDraftLocation} height={400} />
        <p className="mt-3 text-center text-xs text-subtle">Click the map or drag the blue dot to adjust</p>
      </Modal>

      {/* ---- Skills dialog (replaces navigating to AddSkills) ---- */}
      <Modal
        open={skillsOpen}
        onClose={() => setSkillsOpen(false)}
        title="Skills & Experience"
        description="Pick your categories and sub-skills, then log any work history"
        size="lg"
      >
        <SkillsBuilder
          initialSkills={skillsJsonData}
          initialExperiences={experiencesData}
          saveLabel="Save and Continue"
          onSave={(skills, experiences) => {
            setSkillsJsonData(skills);
            setExperiencesData(experiences);
            setSkillsOpen(false);
            NotificationHelper.showSuccess(
              `${skills.length} skill(s)${experiences.length ? ` and ${experiences.length} experience(s)` : ''} saved.`,
            );
          }}
        />
      </Modal>
    </section>
  );
}

/** useSearchParams() requires a Suspense boundary during prerender. */
export default function SignupPage() {
  return (
    <Suspense fallback={<p className="py-20 text-center text-sm text-subtle">Loading…</p>}>
      <SignupForm />
    </Suspense>
  );
}
