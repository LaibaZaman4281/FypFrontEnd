// import Image from 'next/image';

// /**
//  * Split-screen auth shell: brand panel on wide screens, single column on mobile.
//  * Same palette and logo as the React Native auth screens.
//  */
// export default function AuthLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
//       <aside className="relative hidden overflow-hidden bg-brand px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between">
//         <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/10" />
//         <div className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-white/10" />

//         <div className="relative flex items-center gap-3">
//           <Image src="/images/logo.png" alt="" width={44} height={44} className="rounded-xl bg-white p-1" />
//           <span className="text-lg font-extrabold">Maid &amp; Servant Online</span>
//         </div>

//         <div className="relative max-w-md">
//           <h2 className="text-4xl font-extrabold leading-tight">
//             Verified domestic help, from interview to contract.
//           </h2>
//           <p className="mt-4 text-white/80">
//             One platform for clients, workers, placement agencies and law-enforcement verification —
//             interviews, time slots, hiring decisions, resignations, terminations and two-way reviews.
//           </p>
//           <ul className="mt-8 space-y-3 text-sm text-white/90">
//             {[
//               'Search workers by category, skills, habits and city',
//               'Book interviews against published time slots',
//               'Agency certification and police record checks',
//               'Transparent ratings for both sides of every contract',
//             ].map((line) => (
//               <li key={line} className="flex items-start gap-2.5">
//                 <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
//                 {line}
//               </li>
//             ))}
//           </ul>
//         </div>

//         <p className="relative text-xs text-white/60">© {new Date().getFullYear()} Maid &amp; Servant Online</p>
//       </aside>

//       <main className="flex items-center justify-center bg-canvas px-4 py-10 sm:px-8">
//         <div className="w-full max-w-md">{children}</div>
//       </main>
//     </div>
//   );
// }
import Image from 'next/image';

/**
 * Split-screen auth shell: brand panel on wide screens, single column on mobile.
 * Same palette and logo as the React Native auth screens.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-brand px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-white/10" />

        <div className="relative flex items-center gap-3">
          <Image src="/images/logo.png" alt="" width={44} height={44} className="rounded-xl bg-white p-1" />
          <span className="text-lg font-extrabold">Maid &amp; Servant Online</span>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight">
            Verified domestic help, from interview to contract.
          </h2>
          <p className="mt-4 text-white/80">
            One platform for clients, workers, placement agencies and law-enforcement verification —
            interviews, time slots, hiring decisions, resignations, terminations and two-way reviews.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/90">
            {[
              'Search workers by category, skills, habits and city',
              'Book interviews against published time slots',
              'Agency certification and police record checks',
              'Transparent ratings for both sides of every contract',
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                {line}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/60">© {new Date().getFullYear()} Maid &amp; Servant Online</p>
      </aside>

      <main className="flex items-center justify-center bg-canvas px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}