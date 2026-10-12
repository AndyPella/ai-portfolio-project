import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "My role | Northstar Ridge" };
export default function RolePage() { return (<article><p className="section-kicker">Product ownership</p><h1>My role in this project</h1>
<p>Andrew Pella’s contribution covered:</p>
<ul><li>Business requirements and rental-readiness definitions.</li><li>Exception handling, staff authority, and approval boundaries.</li><li>Scope decisions and implementation priorities.</li><li>Scenario review, acceptance criteria, and evaluation of resulting behavior.</li></ul>
<p>Concrete customer scenarios exposed dependencies involving maintenance timing, unresolved holds, incomplete paperwork, and changes after approval. These findings informed the requirements and workflow.</p>
<p>This was an individual project developed with AI assistance. Business reasoning, priorities, scope decisions, and acceptance judgments remained Andrew’s responsibility.</p>
<p><Link href="/project/requirements">Read the complete requirements-to-product case study</Link></p></article>); }
