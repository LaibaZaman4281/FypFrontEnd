import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'Maid & Servant Online',
  description:
    'Hire verified domestic workers, manage interviews, contracts and reviews - for clients, workers, agencies and law enforcement.',
  icons: { icon: '/images/logo.png' },
};

export const viewport: Viewport = {
  themeColor: '#1E64D3',
  width: 'device-width',
  initialScale: 1,
};

/**
 * Global layout + providers.
 * Toaster replaces <Toast /> from react-native-toast-message, mounted once at
 * the root exactly like it was in App.tsx.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              borderRadius: '14px',
              background: '#0E1B4D',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
            },
            success: { iconTheme: { primary: '#00B14F', secondary: '#fff' } },
            error: { iconTheme: { primary: '#DC2626', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  );
}
