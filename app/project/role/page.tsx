import type { Metadata } from "next";

export const metadata: Metadata = { title: "My role | Northstar Ridge" };

export default function RolePage() {
  return (
    <article>
      <p className="section-kicker">Product ownership</p>
      <h1>My role in this project</h1>
      <p className="story-lead">I’m Andrew Pella. I led the requirements, scope decisions, and acceptance review for this equipment rental demo, using AI assistance to develop and implement the product.</p>
      <section>
        <h2>Start with the business decision</h2>
        <p>The starting question was practical: can customer service offer this equipment for the customer’s requested dates? I defined what “ready to rent” means, what prevents a rental, and when qualified staff must review or resolve an issue.</p>
      </section>
      <section>
        <h2>Make the rules usable</h2>
        <p>I worked through maintenance timing, warranty requirements, staff authority, customer information, and approval boundaries. Walkthroughs helped refine the experience around a worker who may have a customer waiting on the phone.</p>
        <p>That led to brief responses, projected work completion information, callbacks when a hold needs review, and temporary equipment protection while customer paperwork is completed.</p>
      </section>
      <section>
        <h2>Control scope and validate the result</h2>
        <p>I kept the new-customer process as an assumed working integration for this lightweight demo, while retaining its required checks. I chose fictional, version-controlled JSON data and reviewed scenarios before accepting the behavior.</p>
        <p>AI assisted with implementation, tests, and documentation. I set the business rules, challenged proposed behavior, approved decisions, and reviewed the resulting workflow. PR 17 records the work for review.</p>
      </section>
      <p><a href="https://github.com/AndyPella/ai-portfolio-project/pull/17">Review the decisions and implementation in PR 17</a></p>
    </article>
  );
}
