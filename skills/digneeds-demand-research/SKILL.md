---
name: digneeds-demand-research
description: Analyze English Reddit product discussions with DigNeeds' transparent, source-linked demand rules. Use when a task needs pain points, recommendation requests, alternatives, buying clues, or product-validation hypotheses from Reddit-like post data; do not use it for scraping, account management, payments, or market-size claims.
---

# DigNeeds demand research

Use the executable rules in [`src/research.js`](../../src/research.js) when this skill is used from the repository root. The rules are deterministic and deliberately conservative: they produce traceable evidence, not a verdict that a product will sell.

## Workflow

1. Obtain or receive public Reddit-like post data. Keep the source URL and post ID attached to every item.
2. Normalize and deduplicate with `collectPosts`; use `collectComments` only for selected comments that add evidence.
3. Call `analyzePosts(posts, englishQuery, commentsByPostId)`.
4. Present `posts`, `signals`, `clusters`, and `summary` separately. Keep the original excerpt and URL beside every claim.
5. State what the rules cannot establish: representativeness, user identity, market size, purchase probability, landed cost, compliance, or product quality.
6. Turn the result into validation questions and counterexamples before recommending a product direction.

## Non-negotiable interpretation rules

- A price, discount, or recommendation request alone is not a buying signal.
- Do not turn `priority`, `count`, or subreddit count into market size or success probability.
- Do not invent evidence when no post matches; return the empty result.
- If the wording is ambiguous, show the excerpt and mark it for manual review.
- Do not silently replace this rules module with an LLM classifier. If a separate model is added, label it as a different analysis layer.

For the full behavior contract and known limitations, read [`docs/rules.md`](../../docs/rules.md) and [`docs/methodology.md`](../../docs/methodology.md).
