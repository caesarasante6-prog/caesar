import { Bricolage_Grotesque, DM_Sans } from 'next/font/google';
import './globals.css';

const head = Bricolage_Grotesque({ subsets: ['latin'], variable: '--head' });
const body = DM_Sans({ subsets: ['latin'], variable: '--body' });

export const metadata = { title: 'CAESAR', description: 'Secure access for your whole organisation' };

const themeScript = `try{var t=localStorage.getItem('caesar-theme')||'dark';document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${head.variable} ${body.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>{children}</body>
    </html>
  );
}
