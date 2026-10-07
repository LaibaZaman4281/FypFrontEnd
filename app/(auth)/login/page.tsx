// 'use client';

// /**
//  * Port of `assets/components/Auth/LoginScreen.js`.
//  *
//  * Unchanged: the POST body ({ Role, EmailOrCnic, Password }), the multiSet of
//  * session keys, the role-based redirect targets, the placeholder/keyboard logic
//  * per role, and the "Remember Me" / "Forgot Password?" controls that existed in
//  * the original UI.
//  */

// import { useState } from 'react';
// import Image from 'next/image';
// import Link from 'next/link';
// import { useRouter } from 'next/navigation';
// import {
//   Building2,
//   Eye,
//   EyeOff,
//   IdCard,
//   Lock,
//   Mail,
//   ShieldCheck,
//   User,
//   Users,
// } from 'lucide-react';
// import Button from '@/components/ui/Button';
// import { Input } from '@/components/ui/Field';
// import { AuthService } from '@/lib/api/services';
// import { errorMessage } from '@/lib/api/client';
// import NotificationHelper from '@/lib/hooks/useNotification';
// import Storage from '@/lib/storage';
// import { cn } from '@/lib/utils/cn';
// import { ROLE_HOME } from '@/components/features/shell/navigation';
// import type { UserRole } from '@/types';

// const ROLES: { value: UserRole; label: string; icon: typeof User }[] = [
//   { value: 'Client', label: 'Client', icon: User },
//   { value: 'Worker', label: 'Worker', icon: Users },
//   { value: 'Company', label: 'Company', icon: Building2 },
//   { value: 'Police', label: 'Police', icon: ShieldCheck },
// ];

// export default function LoginPage() {
//   const router = useRouter();
//   const [role, setRole] = useState<UserRole>('Client');
//   const [emailOrCnic, setEmailOrCnic] = useState('');
//   const [password, setPassword] = useState('');
//   const [isPasswordVisible, setPasswordVisible] = useState(false);
//   const [rememberMe, setRememberMe] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);

//   const getIdentifierPlaceholder = () => {
//     switch (role) {
//       case 'Client': return 'Email';
//       case 'Worker': return 'CNIC e.g XXXXX-XXXXXXX-X';
//       case 'Company': return 'License Number';
//       case 'Police': return 'Badge ID / Service ID';
//       default: return 'Email';
//     }
//   };

//   const getIdentifierIcon = () => {
//     switch (role) {
//       case 'Client': return <Mail size={18} />;
//       case 'Worker': return <IdCard size={18} />;
//       case 'Company': return <Building2 size={18} />;
//       case 'Police': return <ShieldCheck size={18} />;
//       default: return <Mail size={18} />;
//     }
//   };

//   const getInputType = () => (role === 'Client' ? 'email' : 'text');

//   const handleLogin = async (event: React.FormEvent) => {
//     event.preventDefault();

//     const trimmedIdentifier = emailOrCnic.trim();
//     const trimmedPassword = password.trim();

//     if (!trimmedIdentifier || !trimmedPassword) {
//       NotificationHelper.showError('Please enter your credentials.');
//       return;
//     }

//     setIsLoading(true);

//     try {
//       const result = await AuthService.login({
//         Role: role,
//         EmailOrCnic: trimmedIdentifier,
//         Password: trimmedPassword,
//       });

//       // 1. Session key/value pairs - identical names to the mobile app
//       const storageItems: [string, string][] = [
//         ['userToken', result.token || ''],
//         ['userRole', result.role || role],
//         ['userName', result.name || ''],
//         ['userPicture', result.picture || ''],
//         ['userAddress', result.address || ''],
//         ['userPhone', result.phone || ''],
//         ['userEmail', result.email || (role === 'Client' ? trimmedIdentifier : '')],
//       ];

//       // 2. Role-specific IDs, only when the API provided them
//       if (result.clientId != null) storageItems.push(['clientId', result.clientId.toString()]);
//       if (result.workerId != null) storageItems.push(['workerId', result.workerId.toString()]);
//       if (result.companyId != null) storageItems.push(['companyId', result.companyId.toString()]);
//       if (result.policeId != null) storageItems.push(['policeId', result.policeId.toString()]);

//       // Client coordinates come back on the login response for the Client role
//       if (result.latitude != null) storageItems.push(['clientLatitude', String(result.latitude)]);
//       if (result.longitude != null) storageItems.push(['clientLongitude', String(result.longitude)]);

//       Storage.multiSet(storageItems);
//       Storage.setItem('rememberMe', rememberMe ? 'true' : 'false');

//       NotificationHelper.showSuccess('Login Successful!');

//       // 3. Navigate by role - same destinations as the RN stack
//       const userRole = (result.role || role) as UserRole;
//       const target = ROLE_HOME[userRole];

//       if (target) {
//         router.replace(target);
//       } else {
//         NotificationHelper.showSuccess(`${userRole} account logged in successfully!`);
//       }
//     } catch (error) {
//       NotificationHelper.showError(errorMessage(error, 'Cannot reach the server.'));
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <section>
//       <div className="mb-8 flex flex-col items-center text-center lg:hidden">
//         <Image src="/images/logo.png" alt="" width={64} height={64} className="rounded-2xl" priority />
//         <h1 className="mt-3 text-xl font-extrabold text-ink">Maid &amp; Servant Online</h1>
//       </div>

//       <div className="rounded-3xl border border-line bg-white p-6 shadow-card sm:p-8">
//         <header className="mb-6">
//           <h1 className="text-2xl font-extrabold tracking-tight text-ink">Welcome back</h1>
//           <p className="mt-1 text-sm text-subtle">Sign in to continue to your portal.</p>
//         </header>

//         {/* Role selector - same four roles as the mobile grid */}
//         <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
//           {ROLES.map(({ value, label, icon: Icon }) => {
//             const active = role === value;
//             return (
//               <button
//                 key={value}
//                 type="button"
//                 onClick={() => {
//                   setRole(value);
//                   setEmailOrCnic('');
//                 }}
//                 className={cn(
//                   'flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-bold transition',
//                   active
//                     ? 'border-brand bg-brand-light text-brand shadow-sm'
//                     : 'border-line bg-white text-subtle hover:border-brand-border hover:bg-canvas',
//                 )}
//               >
//                 <Icon size={20} className={active ? 'text-brand' : 'text-muted'} />
//                 {label}
//               </button>
//             );
//           })}
//         </div>

//         <form onSubmit={handleLogin} className="space-y-4">
//           <Input
//             label={getIdentifierPlaceholder()}
//             placeholder={getIdentifierPlaceholder()}
//             value={emailOrCnic}
//             onChange={(e) => setEmailOrCnic(e.target.value)}
//             icon={getIdentifierIcon()}
//             type={getInputType()}
//             autoCapitalize="none"
//             autoComplete="username"
//           />

//           <Input
//             label="Password"
//             placeholder="Password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             icon={<Lock size={18} />}
//             type={isPasswordVisible ? 'text' : 'password'}
//             autoComplete="current-password"
//             trailing={
//               <button
//                 type="button"
//                 onClick={() => setPasswordVisible(!isPasswordVisible)}
//                 className="rounded-lg p-2 text-subtle transition hover:bg-canvas"
//                 aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
//               >
//                 {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
//               </button>
//             }
//           />

//           <div className="flex items-center justify-between">
//             <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-subtle">
//               <input
//                 type="checkbox"
//                 checked={rememberMe}
//                 onChange={(e) => setRememberMe(e.target.checked)}
//                 className="h-4 w-4 rounded border-line text-brand focus:ring-brand/30"
//               />
//               Remember Me
//             </label>
//             <button type="button" className="text-sm font-semibold text-brand hover:underline">
//               Forgot Password?
//             </button>
//           </div>

//           <Button type="submit" size="lg" fullWidth loading={isLoading}>
//             Sign in
//           </Button>
//         </form>

//         <div className="my-6 flex items-center gap-3">
//           <span className="h-px flex-1 bg-line" />
//           <span className="text-xs font-bold uppercase tracking-wider text-muted">or</span>
//           <span className="h-px flex-1 bg-line" />
//         </div>

//         <Link
//           href="/signup"
//           className="flex h-12 w-full items-center justify-center rounded-xl border border-brand-border bg-brand-light text-sm font-bold text-brand transition hover:bg-brand-border"
//         >
//           Create an account
//         </Link>
//       </div>
//     </section>
//   );
// }
'use client';

/**
 * Port of `assets/components/Auth/LoginScreen.js`.
 *
 * Unchanged: the POST body ({ Role, EmailOrCnic, Password }), the multiSet of
 * session keys, the role-based redirect targets, the placeholder/keyboard logic
 * per role, and the "Remember Me" / "Forgot Password?" controls that existed in
 * the original UI.
 */

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Eye,
  EyeOff,
  IdCard,
  Lock,
  Mail,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { AuthService } from '@/lib/api/services';
import { errorMessage } from '@/lib/api/client';
import NotificationHelper from '@/lib/hooks/useNotification';
import Storage from '@/lib/storage';
import { cn } from '@/lib/utils/cn';
import { ROLE_HOME } from '@/components/features/shell/navigation';
import type { UserRole } from '@/types';

const ROLES: { value: UserRole; label: string; icon: typeof User }[] = [
  { value: 'Client', label: 'Client', icon: User },
  { value: 'Worker', label: 'Worker', icon: Users },
  { value: 'Company', label: 'Company', icon: Building2 },
  { value: 'Police', label: 'Police', icon: ShieldCheck },
];

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>('Client');
  const [emailOrCnic, setEmailOrCnic] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getIdentifierPlaceholder = () => {
    switch (role) {
      case 'Client': return 'Email';
      case 'Worker': return 'CNIC e.g XXXXX-XXXXXXX-X';
      case 'Company': return 'License Number';
      case 'Police': return 'Badge ID / Service ID';
      default: return 'Email';
    }
  };

  const getIdentifierIcon = () => {
    switch (role) {
      case 'Client': return <Mail size={18} />;
      case 'Worker': return <IdCard size={18} />;
      case 'Company': return <Building2 size={18} />;
      case 'Police': return <ShieldCheck size={18} />;
      default: return <Mail size={18} />;
    }
  };

  const getInputType = () => (role === 'Client' ? 'email' : 'text');

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedIdentifier = emailOrCnic.trim();
    const trimmedPassword = password.trim();

    if (!trimmedIdentifier || !trimmedPassword) {
      NotificationHelper.showError('Please enter your credentials.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await AuthService.login({
        Role: role,
        EmailOrCnic: trimmedIdentifier,
        Password: trimmedPassword,
      });

      // 1. Session key/value pairs - identical names to the mobile app
      const storageItems: [string, string][] = [
        ['userToken', result.token || ''],
        ['userRole', result.role || role],
        ['userName', result.name || ''],
        ['userPicture', result.picture || ''],
        ['userAddress', result.address || ''],
        ['userPhone', result.phone || ''],
        ['userEmail', result.email || (role === 'Client' ? trimmedIdentifier : '')],
      ];

      // 2. Role-specific IDs, only when the API provided them
      if (result.clientId != null) storageItems.push(['clientId', result.clientId.toString()]);
      if (result.workerId != null) storageItems.push(['workerId', result.workerId.toString()]);
      if (result.companyId != null) storageItems.push(['companyId', result.companyId.toString()]);
      if (result.policeId != null) storageItems.push(['policeId', result.policeId.toString()]);

      // Client coordinates come back on the login response for the Client role
      if (result.latitude != null) storageItems.push(['clientLatitude', String(result.latitude)]);
      if (result.longitude != null) storageItems.push(['clientLongitude', String(result.longitude)]);

      Storage.multiSet(storageItems);
      Storage.setItem('rememberMe', rememberMe ? 'true' : 'false');

      NotificationHelper.showSuccess('Login Successful!');

      // 3. Navigate by role - same destinations as the RN stack
      const userRole = (result.role || role) as UserRole;
      const target = ROLE_HOME[userRole];

      if (target) {
        router.replace(target);
      } else {
        NotificationHelper.showSuccess(`${userRole} account logged in successfully!`);
      }
    } catch (error) {
      NotificationHelper.showError(errorMessage(error, 'Cannot reach the server.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section>
      <div className="mb-8 flex flex-col items-center text-center lg:hidden">
        <Image src="/images/logo.png" alt="" width={64} height={64} className="rounded-2xl" priority />
        <h1 className="mt-3 text-xl font-extrabold text-ink">Maid &amp; Servant Online</h1>
      </div>

      <div className="rounded-3xl border border-line bg-white p-6 shadow-card sm:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Welcome back</h1>
          <p className="mt-1 text-sm text-subtle">Sign in to continue to your portal.</p>
        </header>

        {/* Role selector - same four roles as the mobile grid */}
        <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ROLES.map(({ value, label, icon: Icon }) => {
            const active = role === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setRole(value);
                  setEmailOrCnic('');
                }}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-bold transition',
                  active
                    ? 'border-brand bg-brand-light text-brand shadow-sm'
                    : 'border-line bg-white text-subtle hover:border-brand-border hover:bg-canvas',
                )}
              >
                <Icon size={20} className={active ? 'text-brand' : 'text-muted'} />
                {label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label={getIdentifierPlaceholder()}
            placeholder={getIdentifierPlaceholder()}
            value={emailOrCnic}
            onChange={(e) => setEmailOrCnic(e.target.value)}
            icon={getIdentifierIcon()}
            type={getInputType()}
            autoCapitalize="none"
            autoComplete="username"
          />

          <Input
            label="Password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock size={18} />}
            type={isPasswordVisible ? 'text' : 'password'}
            autoComplete="current-password"
            trailing={
              <button
                type="button"
                onClick={() => setPasswordVisible(!isPasswordVisible)}
                className="rounded-lg p-2 text-subtle transition hover:bg-canvas"
                aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
              >
                {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-subtle">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-line text-brand focus:ring-brand/30"
              />
              Remember Me
            </label>
            <button type="button" className="text-sm font-semibold text-brand hover:underline">
              Forgot Password?
            </button>
          </div>

          <Button type="submit" size="lg" fullWidth loading={isLoading}>
            Sign in
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted">or</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <Link
          href="/signup"
          className="flex h-12 w-full items-center justify-center rounded-xl border border-brand-border bg-brand-light text-sm font-bold text-brand transition hover:bg-brand-border"
        >
          Create an account
        </Link>
      </div>
    </section>
  );
}