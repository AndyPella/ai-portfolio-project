import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "From requirements to product | Northstar Ridge" };
export default function RequirementsPage() { return (<article><p className="section-kicker">Case study</p><h1>From requirements to product</h1>
<h2>Project overview</h2>
<p>Northstar Ridge demonstrates the translation of a complex operational process into clear requirements and a working product. The fictional equipment rental business provides a setting for coordinating availability, safety, maintenance, customer intake, and approval requirements.</p>
<p>The project demonstrates product definition, process design, scope management, and validation. AI served as a development tool for exploring options and producing implementation, tests, and documentation.</p>
<h2>The problem</h2>
<p>Customer Service needs to determine whether equipment can be offered for a requested rental period, often while a customer waits on the phone.</p>
<p>Calendar availability is only part of the answer. A rental decision also depends on safety checks, maintenance requirements, active holds, customer information, and operating conditions. The workflow brings these factors together into a recommendation for staff review and customer acceptance.</p>
<h2>Product ownership and business analysis</h2>
<p>The role combined product management, product ownership, and business analysis, with responsibility for product direction, requirements, scope, and acceptance decisions. The work translated an operational problem into business rules, decision criteria, data requirements, and a usable workflow.</p>
<p>Product responsibilities included defining the intended experience, prioritizing capabilities, managing scope, and determining whether the implementation met the requirements. Business analysis included mapping process dependencies, examining exceptions, identifying the information needed for rental decisions, and establishing validation criteria.</p>
<p>AI served as a development tool for exploring options and producing implementation, tests, and documentation.</p>
<h2>Key decisions</h2>
<h3>Reduce manual interactions while retaining human approval</h3>
<p>The workflow consolidates equipment selection, maintenance and hold checks, rental-date comparisons, and required conditions. The goal is to reduce the manual interactions needed to reach critical information.</p>
<p>Routine preparation proceeds automatically. Missing or conflicting evidence requires qualified review. Staff approval and customer acceptance remain necessary before rental confirmation; approval cannot override a safety blocker.</p>
<p>The demo uses deterministic rules to represent this preparation. Reductions in task time and human interactions have not been measured.</p>
<h3>Distinguish required work from permitted maintenance delays</h3>
<p>Safety or operationally critical work prevents operation until completed and verified. Noncritical work may permit rental within a defined deferral limit: seven calendar days or 25 operating hours, whichever comes first. Tighter task or warranty requirements take precedence.</p>
<p>The maintenance record captures the supporting classification and assessment. These fictional policies demonstrate how explicit limits and recorded evidence support consistent decisions.</p>
<h3>Protect equipment during customer intake</h3>
<p>A four-hour temporary allocation protects selected equipment while customer information and the rental agreement are completed.</p>
<p>Customer acceptance changes the allocation to confirmed. Expiry releases it, and renewed protection requires fresh staff approval.</p>
<p>Early release was intentionally excluded from the lightweight demo. It remains part of the intended cancellation workflow.</p>
<h3>Use fictional, version-controlled data</h3>
<p>Fictional records allow realistic scenarios without exposing customer, employee, or business information.</p>
<p>The authoritative dataset moved from Google Sheets to repository-based JSON. This removed a runtime dependency on Google Drive and made data changes reviewable alongside implementation changes. The demo and tests use the same dataset.</p>
<h2>From requirements to working product</h2>
<p>Three guided scenarios demonstrate the core decisions:</p>
<div className="table-scroll"><table><caption>Guided rental scenarios</caption><thead><tr><th scope="col">Scenario</th><th scope="col">Product behavior</th></tr></thead><tbody><tr><td>Ready to rent</td><td>Review availability and customer checks, protect equipment, approve the proposal, and record acceptance.</td></tr><tr><td>Blocked rental</td><td>Identify missing inspection evidence and an active hold; require qualified resolution before proceeding.</td></tr><tr><td>Ready with conditions</td><td>Present required service and operating restrictions before customer acceptance.</td></tr></tbody></table></div>
<p>Equipment search and dropdown selection provide consistent access to recorded units. Readiness findings determine the available actions.</p>
<p>Scenario review also informed shorter responses, readable service times, and renewed approval after request changes.</p>
<h2>Build method</h2>
<p>The build followed an iterative workflow. Requirements were defined, AI proposed a solution, and the proposal was reviewed against the business needs and scope. Changes were presented, refined, and accepted before implementation.</p>
<p>The resulting behavior was validated through scenarios and tests. Findings fed back into the requirements and proposed solutions, repeating the cycle where further refinement was needed.</p>
<h2>Validation and boundaries</h2>
<p>Validation covered ready rentals, inspection and hold resolution, service conditions, customer checks, callbacks, temporary allocation expiry, and equipment-selection consistency. Automated domain tests and browser checks supported scenario review.</p>
<p>The implemented scope uses fictional data, sample staff roles, and deterministic responses. Live AI, production authentication, customer-system integration, and early release of temporary allocations remain future work.</p>
<p>Known defects are documented separately as an operational extension. Passing tests supports the behaviors checked; it does not establish that the product is defect-free.</p>
<p><Link href="/project/operations">Continue to operational follow-through: visible bug tracking</Link></p>
</article>); }
