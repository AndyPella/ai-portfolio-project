import Link from "next/link";
import type { ReactNode } from "react";

export default function ProjectLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="brand" href="/">Northstar Ridge · Project background</Link>
      </header>
      <main className="project-story">
        <nav aria-label="Project pages" className="story-navigation">
          <Link href="/">Open demo</Link>
          <Link href="/project/role">My role</Link>
          <Link href="/project/requirements">Requirements to product</Link>
        </nav>
        {children}
        <p className="scope-note">Fictional portfolio demo. Responses are simulated using deterministic rules; no live AI service is connected. Changes in the rental workspace are held in memory and reset on reload.</p>
      </main>
      <footer><p>Northstar Ridge Equipment Group</p><p>Requirements to product</p></footer>
    </div>
  );
}
