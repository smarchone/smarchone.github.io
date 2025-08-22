// Share functionality
// document.querySelector('.share-btn').addEventListener('click', async () => {
//     if (navigator.share) {
//         try {
//             await navigator.share({
//                 title: 'Saikumar Chintada - Profile',
//                 text: 'Check out my profile!',
//                 url: window.location.href
//             });
//         } catch (err) {
//             console.log('Error sharing:', err);
//         }
//     } else {
//         // Fallback - copy URL to clipboard
//         navigator.clipboard.writeText(window.location.href);
//         showToast('Link copied to clipboard!');
//     }
// });

// Link menu functionality
document.querySelectorAll('.link-menu').forEach(menu => {
    menu.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // You can add a dropdown menu here
        showToast('Menu options coming soon!');
    });
});

// Smooth hover effects for links
document.querySelectorAll('.link-item').forEach(link => {
    link.addEventListener('mouseenter', function() {
        this.style.transition = 'all 0.3s ease';
    });
});

// Toast notification function
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #333;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 1000;
        animation: slideUp 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 2000);
}

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from {
            transform: translateX(-50%) translateY(100%);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }
    
    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        to {
            transform: translateX(-50%) translateY(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Add ripple effect on link click
document.querySelectorAll('.link-item').forEach(link => {
    link.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: radial-gradient(circle, rgba(142, 155, 184, 0.3) 0%, transparent 70%);
            border-radius: 50%;
            left: ${x}px;
            top: ${y}px;
            pointer-events: none;
            transform: scale(0);
            animation: ripple 0.8s ease-out;
        `;
        
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 800);
    });
});


// Add ripple animation
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyle);

// RSS Feed functionality
async function fetchRSSFeed() {
    const rssContainer = document.getElementById('rss-feed');
    const rssUrl = 'https://smarchone.substack.com/feed';
    
    try {
        // Use RSS to JSON API service to fetch and parse RSS
        const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
            throw new Error('Failed to fetch RSS feed');
        }
        
        const data = await response.json();
        
        if (data.status !== 'ok') {
            throw new Error('RSS service error');
        }
        
        displayRSSItems(data.items.slice(0, 4)); // Show latest 5 posts
        
    } catch (error) {
        console.error('Error fetching RSS feed:', error);
        rssContainer.innerHTML = `
            <div class="rss-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Unable to load latest posts</p>
                <a href="https://smarchone.substack.com/" target="_blank" class="visit-substack">
                    Visit Substack →
                </a>
            </div>
        `;
    }
}

function displayRSSItems(items) {
    const rssContainer = document.getElementById('rss-feed');
    
    if (!items || items.length === 0) {
        rssContainer.innerHTML = `
            <div class="rss-empty">
                <p>No posts found</p>
                <a href="https://smarchone.substack.com/" target="_blank" class="visit-substack">
                    Visit Substack →
                </a>
            </div>
        `;
        return;
    }
    
    const rssHTML = items.map(item => {
        const pubDate = new Date(item.pubDate);
        const formattedDate = pubDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
        
        return `
            <div class="rss-item">
                <div class="rss-item-title">
                    <a href="${item.link}" target="_blank">${item.title}</a>
                </div>
                <div class="rss-item-date">${formattedDate}</div>
            </div>
        `;
    }).join('');
    
    rssContainer.innerHTML = rssHTML;
}

// Load RSS feed when page loads
document.addEventListener('DOMContentLoaded', () => {
    fetchRSSFeed();
});
