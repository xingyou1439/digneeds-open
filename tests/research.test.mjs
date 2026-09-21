import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzePosts, collectPosts, refreshAnalysis, redditUrl, ANALYSIS_VERSION } from '../src/research.js';

test('只接受真实 Reddit 帖子路径，按 ID 去重并剔除推广帖', () => {
  const raw = { items: [
    { title: 'Portable blender leaking', permalink: '/r/test/comments/abc123/blender/', body: 'My portable blender leaks.' },
    { title: 'Duplicate', permalink: '/r/test/comments/abc123/blender/', body: 'short' },
    { title: 'Wrong domain', url: 'https://reddit.com.evil.test/r/test/comments/foo/bar/', body: 'hi' },
    { title: 'Promotion', permalink: '/r/test/comments/prom123/ad/', isSponsored: true }
  ] };
  const items = collectPosts(raw);
  assert.equal(items.length, 1);
  assert.equal(items[0].id, 'abc123');
  assert.equal(redditUrl('javascript:alert(1)'), '');
  assert.equal(redditUrl('https://www.reddit.com/search?q=test'), '');
});

test('信号标签保留原文片段，主题不虚构数量', () => {
  const items = collectPosts([
    { title: 'Portable blender leaking', body: 'My portable blender is leaking. Looking for a replacement. My budget is $50.', url: 'https://www.reddit.com/r/test/comments/abc123/blender/', subreddit: 'test' },
    { title: 'Cat food', body: 'looking to buy cat food', url: 'https://www.reddit.com/r/pets/comments/xyz123/cat/' }
  ]);
  const report = analyzePosts(items, 'portable blender');
  assert.equal(report.posts.length, 1);
  assert.equal(report.summary.pain, 1);
  assert.equal(report.summary.buy, 1);
  assert.equal(report.clusters[0].count, 1);
  assert(report.posts[0].signals.every(signal => signal.excerpt.includes('blender')));
});

test('没有匹配时返回空证据，不回退到演示内容', () => {
  const report = analyzePosts([{ id: 'a', title: 'Unrelated gardening', body: 'flowers and soil', subreddit: 'gardening' }], 'travel pillow');
  assert.equal(report.posts.length, 0);
  assert.equal(report.summary.buy, 0);
});

test('相关性规则拒绝子串和相距太远的关键词，同时保留复数和自然语序', () => {
  const items = [
    { id: 'plural', title: 'Portable blenders for smoothies', body: '' },
    { id: 'reversed', title: 'Small appliance', body: 'Looking for a blender that is portable.' },
    { id: 'substring', title: 'Portable blender3d tools', body: '' },
    { id: 'software', title: 'Portable 3d modeling work', body: 'I built a portable computer for work which runs several programs including Blender.' },
    { id: 'distant', title: 'Portable upgrade stations', body: 'I need portable stations for the game. I use Blender to model my creations.' },
    { id: 'url', title: 'Unrelated link collection', body: 'See https://example.test/portable-blender for details.' }
  ];
  assert.deepEqual(analyzePosts(items, 'portable blender').posts.map(post => post.id).sort(), ['plural', 'reversed']);
  assert.equal(analyzePosts([{ title: 'Stainless steel pan', body: '' }], 'stainless steel bottle').posts.length, 0);
  assert.equal(analyzePosts(items, 'the best').posts.length, 0);
  assert.equal(analyzePosts([{ id: 'dress', title: 'Looking for dog dresses', body: '' }], 'dog dress').posts.length, 1);
});

test('单独的促销价格不算购买意向，旧证据可按新版本重算', () => {
  const items = [
    { id: 'deal', title: 'Portable blender just $22.99', body: 'On sale today.', subreddit: 'deals' },
    { id: 'listing', title: 'Portable Blender USB Rechargeable - Blend on the Go', body: '', subreddit: 'WEYGSHOP', comments: 0 },
    { id: 'buyer', title: 'Portable blender advice', body: 'My budget is $50 and I want to buy one.', subreddit: 'smoothies' }
  ];
  const report = refreshAnalysis({
    query: 'portable blender', fetchedAt: '2026-09-19T00:00:00Z', liveData: true,
    posts: items.map(post => ({ ...post, commentEvidence: post.id === 'buyer' ? [{ id: 'c1', body: 'Mine broke after two uses.' }] : [] }))
  });
  assert.equal(report.analysisVersion, ANALYSIS_VERSION);
  assert.equal(report.summary.buy, 1);
  assert.deepEqual(report.posts.map(post => post.id), ['buyer']);
  assert.equal(report.summary.comments, 1);
  assert.equal(report.fetchedAt, '2026-09-19T00:00:00Z');
  assert.equal(report.liveData, true);
});

test('促销社区中的真实购买问题仍然保留', () => {
  const report = analyzePosts([{ id: 'question', title: 'Is this portable blender on sale worth buying?', body: 'Looking for one for work.', subreddit: 'Deals', comments: 4 }], 'portable blender');
  assert.equal(report.posts.length, 1);
  assert(report.posts[0].signals.some(signal => signal.id === 'recommend'));
});
