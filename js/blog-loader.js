// Blog Loader for Netlify CMS Integration
class BlogLoader {
    constructor() {
        this.blogContainer = document.getElementById('blog-posts');
        this.loadBlogPosts();
    }

    async loadBlogPosts() {
        try {
            // This will load blog posts from your /blog folder
            const response = await fetch('/api/blog-posts');
            if (response.ok) {
                const posts = await response.json();
                this.renderBlogPosts(posts);
            } else {
                // Fallback to existing static posts if no CMS posts found
                console.log('No CMS posts found, showing static posts');
            }
        } catch (error) {
            console.log('Loading static posts (CMS not ready yet)');
        }
    }

    renderBlogPosts(posts) {
        // Clear existing posts (remove static ones)
        this.blogContainer.innerHTML = '';

        // Sort posts by date (newest first)
        posts.sort((a, b) => new Date(b.date) - new Date(a.date));

        posts.forEach(post => {
            const blogCard = this.createBlogCard(post);
            this.blogContainer.appendChild(blogCard);
        });
    }

    createBlogCard(post) {
        const article = document.createElement('article');
        article.className = 'blog-card';

        const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Create featured image HTML if image exists
        const featuredImageHtml = post.featured_image ? 
            `<div class="blog-image">
                <img src="${post.featured_image}" alt="${post.title}" loading="lazy">
            </div>` : '';

        article.innerHTML = `
            ${featuredImageHtml}
            <div class="blog-content">
                <div class="blog-meta">
                    <span class="blog-category">${post.category}</span>
                    <time datetime="${post.date}">${formattedDate}</time>
                </div>
                <h3>${post.title}</h3>
                <p class="blog-excerpt">${post.excerpt}</p>
                <a href="/blog/${post.slug}" class="read-more">Read More →</a>
            </div>
        `;

        return article;
    }
}

// Initialize blog loader when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    new BlogLoader();
});
