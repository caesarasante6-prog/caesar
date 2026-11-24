import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function Home() {
  return (
    <>
      <div className="pillar">
        <header className="top">
          <span className="brand">CAESAR</span>
          <div>
            <ThemeToggle />
            <Link className="btn ghost" href="/login">Sign in</Link>
            <Link className="btn gold" href="/register">Create account</Link>
          </div>
        </header>
        <section className="hero">
          <h1>One front door for your whole organisation.</h1>
          <p>CAESAR keeps every member account safe. Sign in with your password and a code sent to your email, and see only what your role allows.</p>
          <div>
            <Link className="btn gold" href="/login">Sign in</Link>
            <Link className="btn ghost" href="/register">Join the organisation</Link>
          </div>
        </section>
      </div>
      <section className="roles">
        <article><h3>Admins</h3><p>Add members, assign roles, restore deleted accounts, review activity and back up all data with one click.</p></article>
        <article><h3>Staff</h3><p>Look after the member list and remove accounts that should no longer have access.</p></article>
        <article><h3>Members</h3><p>Your own space with your profile, security status, announcements and recent activity.</p></article>
      </section>
      <footer>© CAESAR. Secure access, by role.</footer>
    </>
  );
}
