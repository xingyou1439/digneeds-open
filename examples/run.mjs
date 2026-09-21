import { readFile } from 'node:fs/promises';
import { analyzePosts } from '../src/research.js';

const input = JSON.parse(await readFile(new URL('./portable-blender.json', import.meta.url)));
const report = analyzePosts(input.posts, input.query);

console.log(JSON.stringify({
  analysisVersion: report.analysisVersion,
  summary: report.summary,
  clusters: report.clusters,
  evidence: report.posts.map(({ id, title, signals, priority }) => ({ id, title, signals, priority }))
}, null, 2));
