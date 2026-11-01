# DigNeeds Open

**Turn Reddit discussion data into traceable demand signals — locally, without an LLM API key.**

English | [简体中文](README.zh-CN.md)

A small JavaScript research engine for builders and product researchers. Find complaints, recommendation requests, alternatives and buying-language clues. Every signal carries an excerpt from the input so you can inspect why it matched.

## Try it in one minute

Requires Node.js 20+. No install step or runtime dependencies.

```sh
git clone https://github.com/xingyou1439/digneeds-open.git
cd digneeds-open
node bin/digneeds.mjs examples/portable-blender.json
npm test
```

The bundled fixture is **handwritten synthetic data**, not a live Reddit study. Its example URLs are illustrative. Expected summary:

```json
{ "samples": 2, "communities": 1, "pain": 1, "buy": 1, "signals": 2, "comments": 0 }
```

Three input posts become two relevant results: a leaking blender complaint and a recommendation request. A price-only promotion is excluded. A price alone is not buying intent.

## Analyze your own data

```sh
node bin/digneeds.mjs input.json "portable blender" > report.json
```

Supply an array of Reddit-shaped posts, an upstream JSON response, or `{ "query": "portable blender", "posts": [...] }`. Input is limited to 5 MiB. The CLI makes no network requests. Obtain data through a source you are authorized to use.

```js
import { collectPosts, analyzePosts } from './src/research.js';

const posts = collectPosts(upstreamResponse);
const report = analyzePosts(posts, 'portable blender');
console.log(report.summary);
console.log(report.posts.map(post => ({
  source: post.url,
  evidence: post.signals
})));
```

## What you get

| Output | Meaning |
| --- | --- |
| `posts[].signals` | Stable signal IDs and matching source excerpts |
| `posts[].priority` | Transparent reading-order heuristic, not a probability |
| `clusters` | Rule-based themes, supporting post IDs and validation prompts |
| `summary` | Counts within the retained sample, not market estimates |

Source URL validation checks Reddit URL structure; it does **not** prove that a post exists or that its claims are true. English keywords drive matching; display labels and validation prompts currently use Chinese. Negation, sarcasm and ambiguous product names can cause false positives. Human review is part of the workflow.

## How it fits

`Authorized data → normalization → relevance filter → evidence labels → human review → product hypothesis → real-world validation`

Use it for an auditable first pass, an Agent tool, or a regression baseline alongside model-based analysis. It does not fetch Reddit data, predict sales, calculate market size or automatically publish posts.

[DigNeeds website](https://digneeds.net/) provides a separate hosted workflow. This repository contains the open research layer, not the hosted application's accounts, database or payments. No npm registry release is claimed; run from this checkout.

## Help improve the rules

The most useful contribution is a small counterexample: a query, permission-cleared or synthetic input, and the label you expected. Include a failing test with behavior changes. See [contributing](CONTRIBUTING.md) and [roadmap](ROADMAP.md).

- [Methodology](docs/methodology.md) — evidence, interpretation and validation boundaries.
- [Rule contract](docs/rules.md) — matching, filtering, input and output.
- [Agent Skill](skills/digneeds-demand-research/SKILL.md) — reusable research instructions.
- [Examples](examples/) and [tests](tests/) — reproducible behavior.

MIT licensed. See [LICENSE](LICENSE).
