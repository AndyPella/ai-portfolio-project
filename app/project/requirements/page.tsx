import type { Metadata } from "next";

export const metadata: Metadata = { title: "From requirements to product | Northstar Ridge" };

export default function RequirementsPage() {
  return (
    <article>
      <p className="section-kicker">Business rules into behavior</p>
      <h1>From requirements to product</h1>
      <p className="story-lead">Availability depends on more than a calendar. The demo brings safety, maintenance, rental timing, customer checks, and human approval into one Customer Service workflow.</p>
      <section>
        <h2>Define readiness</h2>
        <p>Ready to rent means the equipment has passed all required safety checks and has the necessary maintenance completed. Holds, unresolved operational failures, missing evidence, and conflicting bookings affect what staff can offer.</p>
        <p>Safety or operationally critical work prevents operation until completed and verified. Qualified noncritical work may be deferred within the demo’s seven-day or 25-operating-hour limit, whichever comes first, subject to tighter task or warranty requirements.</p>
      </section>
      <section>
        <h2>Connect each requirement to the experience</h2>
        <div className="table-scroll">
          <table>
            <caption>Examples of requirements translated into product behavior</caption>
            <thead><tr><th scope="col">Requirement</th><th scope="col">Product behavior</th></tr></thead>
            <tbody>
              <tr><td>Evaluate the requested rental period.</td><td>Check bookings, preparation and turnaround buffers, expected use, inspections, and service due during the rental.</td></tr>
              <tr><td>Make conditions clear before acceptance.</td><td>Present service windows and operating restrictions for staff review and customer acceptance.</td></tr>
              <tr><td>Protect equipment while intake is completed.</td><td>Use a temporary allocation lasting up to four hours; acceptance confirms it, cancellation or expiry releases it.</td></tr>
              <tr><td>Keep approval with people.</td><td>Require current staff approval and customer checks before recording rental acceptance. Changed details require renewed approval.</td></tr>
              <tr><td>Handle blocked equipment without inventing availability.</td><td>Offer an eligible alternative when one exists, or record an owned callback while a mechanic or manager reviews the hold.</td></tr>
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2>Validate through scenarios</h2>
        <p>Reviewed walkthroughs covered a ready rental, inspection and hold resolution, service conditions, pending customer paperwork, callbacks, and temporary allocation expiry. Automated domain tests and browser checks support that review; known defects remain documented in PR 17.</p>
        <p>The result is a working simulation for exploring the decisions and approval gates. Production authentication, a live customer system, and live AI integration remain future work.</p>
      </section>
      <p><a href="https://github.com/AndyPella/ai-portfolio-project/pull/17">Explore the supporting requirements and implementation in PR 17</a></p>
    </article>
  );
}
