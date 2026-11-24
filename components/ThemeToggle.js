'use client';
import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [t, setT] = useState('light');
  useEffect(() => setT(document.documentElement.dataset.theme || 'light'), []);
  const flip = () => {
    const n = t === 'dark' ? 'light' : 'dark';
    setT(n);
    document.documentElement.dataset.theme = n;
    try { localStorage.setItem('caesar-theme', n); } catch {}
  };
  return <button className="tt" onClick={flip}>{t === 'dark' ? 'Light mode' : 'Dark mode'}</button>;
}
