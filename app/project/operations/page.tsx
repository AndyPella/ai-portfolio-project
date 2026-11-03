import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Operational follow-through | Northstar Ridge" };
const records = "https://github.com/AndyPella/ai-portfolio-project/blob/docs/rental-readiness-policy-2026-10-08/docs/testing/";

export default function OperationsPage() {
  return (
    <article>
      <p className="section-kicker">Operational extension</p>
      <h1>Operational follow-through</h1>
      <p className="story-lead">A working product also needs a way to manage defects. This operational extension uses two bugs found during review to demonstrate a lightweight process for documenting the problem, assessing its impact, proposing a correction, and defining how the fix would be verified. Both remain open for demonstration.</p>
      <p>This extension follows the requirements-to-product case study and sits outside the core rental demonstration. These are reproduced defects, intentionally left unfixed for this demo. The page presents their records; it does not change bug status or perform repairs.</p>
      <h2>Current bug queue</h2>
      <div className="table-scroll">
        <table>
          <caption>Two open bugs · reproduction confirmed · fixes not implemented</caption>
          <thead><tr><th scope="col">Bug</th><th scope="col">Priority</th><th scope="col">Status</th><th scope="col">Owner</th></tr></thead>
          <tbody>
            <tr><td><a href="#bug-001">NRE-BUG-001 · Post-work inspection sequence</a></td><td>P1</td><td>Open</td><td>Unassigned</td></tr>
            <tr><td><a href="#bug-002">NRE-BUG-002 · Replacement delivery protection</a></td><td>P2</td><td>Open</td><td>Unassigned</td></tr>
          </tbody>
        </table>
      </div>
      <p>P1 identifies a broken safety or required-control boundary. P2 identifies incorrect availability or workflow behavior. Both remain recorded as blocking merge; preserving them for demonstration does not close or resolve them.</p>
      <section id="bug-001" className="panel">
        <h2>NRE-BUG-001</h2>
        <p><strong>Inspection recorded before critical work can release a post-work hold.</strong></p>
        <p>Impact: the workflow can accept an inspection that predates completed work, allowing a required post-work control to be bypassed when the actions share a timestamp.</p>
        <p><strong>P1 · Open · Owner unassigned</strong></p>
        <details><summary>Reproduction and expected behavior</summary>
          <p>Using a fresh isolated dataset and qualified sample mechanic, record all three actions at September 5, 2026, 9 AM Pacific:</p>
          <ol><li>Pass inspection for EQ-1001, valid through December 31, 2026, with the next inspection limit at 2,000 operating hours.</li><li>Complete MNT-3001, creating a post-work hold.</li><li>Release the newly created hold.</li></ol>
          <p><strong>Expected:</strong> release is rejected until a qualified inspection is recorded after work completion.</p>
          <p><strong>Actual:</strong> release succeeds using the earlier inspection because its timestamp equals the work timestamp.</p>
          <p>The reproduction uses the domain workflow on isolated data. It is not a fourth customer walkthrough.</p>
        </details>
        <details><summary>Proposed fix and verification criteria</summary>
          <p>Use recorded decision order to require a qualified inspection after the latest work completion. Comparing timestamps alone cannot distinguish successive actions within the same clock tick.</p>
          <ul><li>Inspection before work at the same timestamp cannot release the hold.</li><li>Work followed by inspection at the same timestamp can satisfy the sequence if other controls pass.</li><li>Repeated work invalidates earlier inspection evidence.</li><li>Other active holds and authority requirements remain enforced.</li></ul>
          <p>Fix commit, regression coverage, verification, reviewer, merge, and closure: Pending. No deployment performed.</p>
        </details>
        <p>Reported October 11, 2026. Reproduction confirmed; correction not implemented.</p>
        <a href={records + "bug-log.md#nre-bug-001"}>View the full bug record and history</a>
      </section>
      <section id="bug-002" className="panel">
        <h2>NRE-BUG-002</h2>
        <p><strong>Replacement protection omits the interval before handoff.</strong></p>
        <p>Impact: a replacement can be proposed even though another allocation conflicts with its earlier delivery, because availability protection begins relative to handoff.</p>
        <p><strong>P2 · Open · Owner unassigned</strong></p>
        <details><summary>Reproduction and expected behavior</summary>
          <p>Use the isolated swap test fixture with its test-only spare generator, valid inspection, planned usage, and confirmed logistics.</p>
          <ol><li>Set replacement delivery to September 10, 2026, 9 AM Pacific.</li><li>Keep handoff and original collection at September 12, 9 AM.</li><li>Add another request’s confirmed spare allocation from September 10, 7 AM through September 11, 5 PM.</li><li>Evaluate the swap as of September 5, 9 AM.</li></ol>
          <p><strong>Expected:</strong> the plan is ineligible because the replacement is allocated when delivery is required.</p>
          <p><strong>Actual:</strong> the plan is eligible; replacement protection begins September 12, 7 AM and misses the delivery conflict.</p>
          <p>The spare exists only in the isolated test fixture, not in the application equipment list.</p>
        </details>
        <details><summary>Proposed fix and verification criteria</summary>
          <p>Check and protect the replacement from preparation before confirmed delivery through return and turnaround. Preserve handoff as the usage transition so early delivery does not invent operating hours.</p>
          <ul><li>An allocation overlapping early delivery makes the swap ineligible.</li><li>A successful swap protects the early delivery interval.</li><li>Exact adjacency of protected intervals remains allowed.</li><li>Same-time delivery and handoff still work.</li><li>Both units’ service limits, downtime, customer acceptance, and the no-additional-pickup/delivery-charge assumption remain enforced.</li></ul>
          <p>Fix commit, regression coverage, verification, reviewer, merge, and closure: Pending. No deployment performed.</p>
        </details>
        <p>Reported October 11, 2026. Reproduction confirmed; correction not implemented.</p>
        <a href={records + "bug-log.md#nre-bug-002"}>View the full bug record and history</a>
      </section>
      <h2>How fixes would be tracked</h2>
      <p>Open → In progress → Ready for review → Closed</p>
      <p>Open records capture the reproduction, impact, and priority. Work begins with an assigned owner. A fix moves to review after implementation and regression verification. Closure requires review, approval, and merge evidence; it does not imply deployment. Failed verification or recurrence returns the record to Open with its history preserved.</p>
      <p>The repository bug log is the tracking record. This page summarizes it for demonstration. All 75 existing tests passed when these cases were discovered, illustrating why passing tests do not replace coverage for newly found boundary cases.</p>
      <p><a href={records + "bug-workflow.md"}>Read the bug workflow</a> · <Link href="/project/requirements">Return to the case study</Link></p>
    </article>
  );
}
