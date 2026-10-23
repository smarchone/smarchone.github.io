// Latest posts, read from posts.json (synced from the Substack feed by .github/workflows/sync-posts.yml).
const MAX_POSTS = 4;

// RSS titles arrive as escaped markup; render them as plain text.
function toPlainText(value) {
    const decoder = document.createElement('textarea');
    decoder.innerHTML = String(value || '').replace(/<[^>]*>/g, '');
    return decoder.value.trim();
}

function parseDate(value) {
    const date = new Date(value || '');
    return isNaN(date) ? null : date;
}

function formatDate(date) {
    const sameYear = date.getFullYear() === new Date().getFullYear();
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: sameYear ? undefined : 'numeric'
    });
}

function renderPosts(list, items) {
    list.replaceChildren(...items.map(item => {
        const title = document.createElement('span');
        title.className = 'post-title';
        title.textContent = toPlainText(item.title) || 'Untitled';

        const link = document.createElement('a');
        link.href = item.link;
        link.target = '_blank';
        link.rel = 'noopener';
        link.append(title);

        const date = parseDate(item.date);
        if (date) {
            const time = document.createElement('time');
            time.className = 'post-date';
            time.dateTime = date.toISOString();
            time.textContent = formatDate(date);

            const leader = document.createElement('span');
            leader.className = 'post-leader';
            leader.setAttribute('aria-hidden', 'true');
            link.append(leader, time);
        }

        const row = document.createElement('li');
        row.append(link);
        return row;
    }));
}

// The "All posts" link below the list is the way out, so keep this to one line.
function renderFallback(list, message) {
    const row = document.createElement('li');
    row.className = 'empty';
    row.textContent = message;
    list.replaceChildren(row);
}

async function loadPosts() {
    const list = document.getElementById('posts');
    if (!list) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
        const response = await fetch('posts.json', { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('Unexpected posts.json');

        const items = data.filter(item => item && item.link).slice(0, MAX_POSTS);
        if (items.length) {
            renderPosts(list, items);
        } else {
            renderFallback(list, 'No posts yet.');
        }
    } catch (error) {
        console.error('Could not load posts:', error);
        renderFallback(list, 'Posts unavailable right now.');
    } finally {
        clearTimeout(timeout);
        list.removeAttribute('aria-busy');
    }
}

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

loadPosts();
