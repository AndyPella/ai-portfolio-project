import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "My role | Northstar Ridge" };
export default function RolePage() { return (<article><p className="section-kicker">Product ownership</p><h1>My role in this project</h1>
<p>The role combined product management, product ownership, and business analysis, with responsibility for product direction, requirements, scope, and acceptance decisions. The work translated an operational problem into business rules, decision criteria, data requirements, and a usable workflow.</p>
<p>Product responsibilities included defining the intended experience, prioritizing capabilities, managing scope, and determining whether the implementation met the requirements. Business analysis included mapping process dependencies, examining exceptions, identifying the information needed for rental decisions, and establishing validation criteria.</p>
<p>AI served as a development tool for exploring options and producing implementation, tests, and documentation.</p>
<p><Link href="/project/requirements">Read the complete requirements-to-product case study</Link></p></article>); }
