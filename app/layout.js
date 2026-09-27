import { Inter, Montserrat } from 'next/font/google';
import Navbar from '@/components/Navbar';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata = {
  title: 'JAAYKAT — Vends plus simplement',
  description:
    'JAAYKAT genere vos publications et legendes pour vendre plus sur WhatsApp, Facebook et Instagram.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${inter.variable} ${montserrat.variable}`}>
      <body className="min-h-screen bg-creme text-fonce antialiased">
        <div className="motif-wax pointer-events-none fixed inset-0 -z-10" aria-hidden="true" />
        <div className="relative z-0">
          <Navbar />
          {children}
        </div>
      </body>
    </html>
  );
}
