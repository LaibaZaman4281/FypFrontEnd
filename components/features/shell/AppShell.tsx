'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronRight, LogOut, Menu, X } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { ConfirmDialog } from '@/components/ui/Modal';
import { useSession } from '@/lib/hooks/useSession';
import { cn } from '@/lib/utils/cn';
import { NAV, ROLE_HOME, ROLE_META } from './navigation';
import type { UserRole } from '@/types';

/**
 * Web-first application chrome.
 *
 * Desktop  : fixed left sidebar + sticky top bar + max-width content column.
 * Tablet   : collapsible drawer sidebar.
 * Mobile   : top bar with hamburger drawer (the mobile app's own bottom tabs are
 *            replaced by this drawer so nothing is stretched across a wide screen).
 */
export default function AppShell({ role, children }: { role: UserRole; children: React.ReactNode }) {
  const pathname = usePathname();
  const { session, logout } = useSession();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const items = NAV[role] ?? [];
  const meta = ROLE_META[role];

  const SidebarBody = (
    <>
      <Link href={ROLE_HOME[role]} className="mb-7 flex items-center gap-3 px-2">
        <Image src="/images/logo.png" alt="Maid & Servant Online" width={40} height={40} className="rounded-xl" priority />
        <span className="leading-tight">
          <span className="block text-sm font-extrabold text-ink">Maid &amp; Servant</span>
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-brand">{meta.label} Portal</span>
        </span>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setDrawerOpen(false)}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                active ? 'bg-brand text-white shadow-sm' : 'text-subtle hover:bg-brand-light hover:text-brand',
              )}
            >
              <Icon size={18} className={cn(active ? 'text-white' : 'text-brand')} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight size={15} />}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => setConfirmLogout(true)}
        className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-danger transition hover:bg-rose-50"
      >
        <LogOut size={18} />
        Log out
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-canvas">
      {/* ---------- Desktop sidebar ---------- */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-line bg-white px-4 py-6 lg:flex">
        {SidebarBody}
      </aside>

      {/* ---------- Mobile / tablet drawer ---------- */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[280px] flex-col bg-white px-4 py-6 shadow-pop">
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-subtle hover:bg-canvas"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            {SidebarBody}
          </aside>
        </div>
      )}

      <div className="lg:pl-[264px]">
        {/* ---------- Top bar ---------- */}
        <header className="sticky top-0 z-20 border-b border-line bg-white/85 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-content items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-ink lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>

            <Link href={ROLE_HOME[role]} className="flex items-center gap-2 lg:hidden">
              <Image src="/images/logo.png" alt="" width={28} height={28} className="rounded-lg" />
              <span className="text-sm font-extrabold text-ink">Maid &amp; Servant</span>
            </Link>

            <div className="ml-auto flex items-center gap-3">
              <span className="hidden text-right sm:block">
                <span className="block text-sm font-bold leading-tight text-ink">{session.name || 'Welcome'}</span>
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-brand">{meta.label}</span>
              </span>
              <Avatar src={session.picture} name={session.name} size="sm" />
            </div>
          </div>
        </header>

        <main className="page">{children}</main>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={() => {
          setConfirmLogout(false);
          logout();
        }}
        title="Log out?"
        message="You will need to sign in again to access your dashboard."
        confirmLabel="Log out"
        tone="danger"
      />
    </div>
  );
}
