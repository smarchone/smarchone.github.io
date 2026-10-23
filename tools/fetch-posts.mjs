// Writes posts.json from the Substack RSS feed so the page never depends on a third-party API at view time.
import { readFile, writeFile } from 'node:fs/promises';

const FEED = 'https://smarchone.substack.com/feed';
const MAX_POSTS = 10;

const decode = text => text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'").replace(/&amp;/g, '&')
    .trim();

const field = (item, tag) => {
    const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
    return match ? decode(match[1]) : '';
};

const response = await fetch(FEED, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; posts-sync)' } });
if (!response.ok) throw new Error(`Feed returned HTTP ${response.status}`);

const posts = [...(await response.text()).matchAll(/<item>([\s\S]*?)<\/item>/g)]
    .map(([, item]) => {
        const date = new Date(field(item, 'pubDate'));
        return {
            title: field(item, 'title'),
            link: field(item, 'link'),
            date: isNaN(date) ? null : date.toISOString()
        };
    })
    .filter(post => post.title && post.link)
    .slice(0, MAX_POSTS);

if (!posts.length) throw new Error('Feed had no posts; keeping the existing posts.json');

const next = JSON.stringify(posts, null, 2) + '\n';
const current = await readFile('posts.json', 'utf8').catch(() => '');
if (next !== current) await writeFile('posts.json', next);
console.log(`${posts.length} posts${next === current ? ' (unchanged)' : ' written'}`);
