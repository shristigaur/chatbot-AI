import './globals.css';
import { AuthProvider } from '../components/auth/AuthProvider';

export const metadata = { title: 'Lumina | A calmer way to think', description: 'A thoughtful AI chat companion.', icons: { icon: '/favicon.svg' } };

export default function RootLayout({ children }) {
  const themeScript = `(() => { const saved = localStorage.getItem('lumina-theme'); const dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches; document.documentElement.dataset.theme = dark ? 'dark' : 'light'; document.documentElement.classList.toggle('dark-mode', dark); })()`;
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body><AuthProvider>{children}</AuthProvider></body></html>;
}