#!/usr/bin/env node
import { readFile, stat } from 'node:fs/promises';
import { analyzePosts, collectPosts } from '../src/research.js';

const args = process.argv.slice(2);
if (args.length === 1 && ['--help', '-h'].includes(args[0])) {
  console.log('Usage: digneeds <input.json> [query]\nInput: { query, posts: [...] } or a Reddit response (query argument required).\nOffline analysis only. Input must be <= 5 MiB. Output is JSON on stdout.');
} else {
  try {
    if (!args.length || args.length > 2) throw new Error('Usage: digneeds <input.json> [query]');
    if ((await stat(args[0])).size > 5 * 1024 * 1024) throw new Error('Input exceeds 5 MiB');
    const input = JSON.parse(await readFile(args[0], 'utf8'));
    const query = args[1] ?? input?.query;
    if (typeof query !== 'string' || !query.trim() || query.length > 200) throw new Error('Provide a query of 1–200 characters');
    const posts = collectPosts(input?.posts ?? input);
    const report = analyzePosts(posts, query.trim());
    console.log(JSON.stringify({ query: query.trim(), inputNotice: input?.synthetic === true ? 'Synthetic fixture; not live Reddit evidence.' : 'User-supplied data; source existence and usage rights are not verified.', ...report }, null, 2));
  } catch (error) {
    console.error('digneeds: ' + error.message);
    process.exitCode = 1;
  }
}
