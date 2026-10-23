// Writes posts.json from the Medium RSS feed so the page never depends on a third-party API at view time.
import { readFile, writeFile } from 'node:fs/promises';

const FEED = 'https://saikumarchintada.medium.com/feed';
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

// Try the feed directly, then rss2json as a server-side proxy in case Medium blocks the runner.
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, application/json, text/xml, */*'
};

async function get(url) {
    const response = await fetch(url, { headers: HEADERS });
    if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
    return response;
}

const toDate = value => {
    const date = new Date(value);
    return isNaN(date) ? null : date.toISOString();
};

// Medium appends ?source=rss-... tracking to links.
const cleanLink = link => link.split('?')[0];

const sources = [
    async () => [...(await (await get(FEED)).text()).matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, item]) => ({
        title: field(item, 'title'), link: cleanLink(field(item, 'link')), date: toDate(field(item, 'pubDate'))
    })),
    async () => (await (await get(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(FEED)}`)).json()).items.map(post => ({
        title: decode(post.title), link: cleanLink(post.link), date: toDate(String(post.pubDate).replace(' ', 'T') + 'Z')
    }))
];

let posts = [];
for (const source of sources) {
    try {
        posts = (await source()).filter(post => post.title && post.link).slice(0, MAX_POSTS);
        if (posts.length) break;
    } catch (error) {
        console.warn(error.message);
    }
}

if (!posts.length) throw new Error('Feed had no posts; keeping the existing posts.json');

const next = JSON.stringify(posts, null, 2) + '\n';
const current = await readFile('posts.json', 'utf8').catch(() => '');
if (next !== current) await writeFile('posts.json', next);
console.log(`${posts.length} posts${next === current ? ' (unchanged)' : ' written'}`);
