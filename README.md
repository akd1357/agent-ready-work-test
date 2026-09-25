# Agent Ready Work Test (ARWT)

ARWT is an experimental, deterministic diagnostic for a **specific unit of work**. It examines what the work can support before a person gives more autonomy to AI, an AI agent, conventional automation, or another executor.

## Who it is for

Someone considering delegation of a bounded task, workflow, or responsibility and deciding how much autonomy that work can safely support **today**. The assessment is about the work and its controls, not the skill of a particular person or model.

## The problem

Asking whether an AI system can perform a task leaves out how the work is actually defined and governed. The task may depend on undocumented exceptions, tacit knowledge, contextual decisions, or errors that are hard to detect and reverse.

## The decision

ARWT helps identify a structural delegation pattern, current readiness constraints, and issues to address before increasing autonomy. A favorable pattern alone is **not** approval for unattended execution: Legibility and feedback constraints can still limit readiness.

## How it works

The browser asks 23 questions about one unit of work: seven each on Legibility, Judgment, and Reversibility, plus two on result verification and feedback. Answer from real examples and controls available today. The deterministic algorithm produces three visible scores, a Legibility status, a structural delegation pattern, readiness constraints, up to three key issues, and suggested next actions. Boundary warnings show when a one-step answer change could alter specified classifications or safeguards.

### Legibility

Can another competent person reconstruct and verify the trigger, inputs, correct output, completion, main steps, exceptions, and dependencies from available evidence? A low status remains a separate readiness constraint even when Judgment and Reversibility yield a favorable structural pattern.

### Judgment

How often do the same formal information and rules leave room for reasonable interpretation, tacit knowledge, or discretion? The score describes contextual decision demand, including an override for high discretionary authority in J7.

### Reversibility

What existing mechanisms detect, undo, restore, contain, and control plausible errors and consequential actions? A high raw score can still be capped when the specified R5/R6 consequence controls are weak.

### Result verification and feedback

Two additional questions (O1/O2) evaluate whether correctness can be checked and wrong outcomes become visible in time. They produce a hidden Observability classification, not a fourth public score. That classification determines whether monitoring or verification before unattended execution is required.

## Reading the output

The structural pattern is computed from **effective Judgment × effective Reversibility**. Legibility constrains readiness separately. Observability can require monitoring or prior verification. Key issues prioritize concrete gaps; the result is a diagnostic for discussion and design, not an authorization to deploy an agent.

See [METHODOLOGY.md](METHODOLOGY.md) for exact rules and the six pattern mappings.

## What ARWT does not claim

ARWT does not establish whether a particular AI model can perform the work, whether automation is technically or economically feasible, or whether a deployment is legally compliant or secure. It does not assess a worker's competence. Its thresholds and recommendations have not been established as scientifically validated predictions of real-world outcomes.

## Status

**Validation / experimental.** The frozen methodology is `ARWT Algorithm v1.0-rc5.1`; the instrumented client is `ARWT v1.0-rc5.1-validation.1`. The methodology and validation schema remain unchanged. Validation submissions use a same-origin Netlify Function, which forwards them to the existing Google Apps Script receiver when configured.

## Run locally

Open `index.html` directly in a modern browser, or serve this directory with any static file server (for example, `python3 -m http.server 8000`). No build step, account, external library, or AI API is required to run the diagnostic. Validation submission requires Netlify Functions; a plain static server does not provide `/api/validation`. For a configured deployment, read [README-VALIDATION-SETUP.md](README-VALIDATION-SETUP.md). Never commit a live Apps Script URL or Spreadsheet ID to this repository.

Current public application: [arwt.netlify.app](https://arwt.netlify.app/).

## Report a counterexample or problem

Open a [GitHub Issue](../../issues/new/choose) using the Counterexample, Unexpected ARWT result, Bug, or Methodology question template. Useful reports include the work tested, the expected conclusion, the ARWT conclusion, the point of disagreement, and the reasoning. Use synthetic or generalized examples; do not include personal, client, payroll, or other sensitive operational data.

## License

See [LICENSE](LICENSE). No open-source license or permission to redistribute or modify has been granted yet. A license choice is pending the project owner's approval.
