// Blog Loader for Netlify CMS Integration
class BlogLoader {
    constructor() {
        this.blogContainer = document.getElementById('blog-posts');
        this.loadingIndicator = this.createLoadingIndicator();
        this.blogPosts = [];
        this.init();
    }

    createLoadingIndicator() {
        const loading = document.createElement('div');
        loading.className = 'loading';
        loading.innerHTML = '<p>Loading blog posts...</p>';
        return loading;
    }

    async init() {
        // Show loading indicator
        this.blogContainer.appendChild(this.loadingIndicator);

        try {
            await this.loadBlogPosts();
        } catch (error) {
            console.error('Failed to load blog posts:', error);
            this.showFallbackPosts();
        }
    }

    async loadBlogPosts() {
        try {
            // Fetch the list of markdown files from the _posts directory
            const postsData = await this.fetchBlogPostsFromRepo();
            
            if (postsData && postsData.length > 0) {
                this.blogPosts = postsData;
                this.renderBlogPosts(this.blogPosts);
            } else {
                throw new Error('No blog posts found');
            }
        } catch (error) {
            // Fallback to static posts if CMS posts aren't available
            throw error;
        }
    }

    async fetchBlogPostsFromRepo() {
        try {
            // This method attempts to fetch blog posts from various possible sources
            
            // Method 1: Try to fetch from Netlify's file system API (if available)
            if (window.netlifyAPI) {
                return await this.fetchFromNetlifyAPI();
            }

            // Method 2: Try to fetch from a custom endpoint (you'd need to create this)
            const response = await fetch('/api/blog-posts.json');
            if (response.ok) {
                return await response.json();
            }

            // Method 3: Try to fetch from a generated posts file
            const postsResponse = await fetch('/blog-posts.json');
            if (postsResponse.ok) {
                return await postsResponse.json();
            }

            // Method 4: For development/testing - check if posts are embedded in the page
            if (window.blogPosts) {
                return window.blogPosts;
            }

            throw new Error('No blog posts source available');
        } catch (error) {
            throw error;
        }
    }

    async fetchFromNetlifyAPI() {
        // This would be used if you set up Netlify's file API
        // For now, this is a placeholder
        throw new Error('Netlify API not configured');
    }

    parseMarkdownFrontmatter(content) {
        const parts = content.split('---');
        if (parts.length < 3) return null;

        const frontmatter = parts[1];
        const body = parts.slice(2).join('---').trim();

        // Simple YAML parser for frontmatter
        const metadata = {};
        frontmatter.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length) {
                const value = valueParts.join(':').trim().replace(/['"]/g, '');
                metadata[key.trim()] = value;
            }
        });

        return {
            ...metadata,
            body: body
        };
    }

    renderBlogPosts(posts) {
        // Remove loading indicator
        if (this.loadingIndicator.parentNode) {
            this.loadingIndicator.remove();
        }

        // Clear existing posts
        this.blogContainer.innerHTML = '';

        // Filter published posts only
        const publishedPosts = posts.filter(post => post.published !== false);

        // Sort posts by date (newest first)
        publishedPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Render each post
        publishedPosts.forEach(post => {
            const blogCard = this.createBlogCard(post);
            this.blogContainer.appendChild(blogCard);
        });

        // If no posts to show
        if (publishedPosts.length === 0) {
            this.showNoPosts();
        }
    }

    createBlogCard(post) {
        const article = document.createElement('article');
        article.className = 'blog-card';

        // Format the date
        const formattedDate = this.formatDate(post.date);

        // Create featured image HTML if image exists
        const featuredImageHtml = post.featured_image ? 
            `<div class="blog-image">
                <img src="${post.featured_image}" alt="${this.escapeHtml(post.title)}" loading="lazy" onerror="this.parentNode.style.display='none'">
            </div>` : '';

        // Create tags HTML if tags exist
        const tagsHtml = post.tags && post.tags.length > 0 ? 
            `<div class="blog-tags">
                ${post.tags.slice(0, 3).map(tag => `<span class="blog-tag">#${tag}</span>`).join('')}
            </div>` : '';

        article.innerHTML = `
            ${featuredImageHtml}
            <div class="blog-content">
                <div class="blog-meta">
                    <span class="blog-category">${this.escapeHtml(post.category || 'General')}</span>
                    <time datetime="${post.date}">${formattedDate}</time>
                </div>
                <h3>${this.escapeHtml(post.title)}</h3>
                <p class="blog-excerpt">${this.escapeHtml(post.excerpt || this.extractExcerpt(post.body))}</p>
                ${tagsHtml}
                <div class="blog-footer">
                    <span class="blog-author">By ${this.escapeHtml(post.author || 'ROSH Software Team')}</span>
                    <a href="/blog/${post.slug}" class="read-more">Read More →</a>
                </div>
            </div>
        `;

        return article;
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return 'Recently';
        }
    }

    extractExcerpt(body, maxLength = 150) {
        if (!body) return '';
        
        // Remove markdown formatting and get plain text
        const plainText = body
            .replace(/#{1,6}\s/g, '') // Remove headers
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
            .replace(/\*(.*?)\*/g, '$1') // Remove italic
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
            .replace(/`([^`]+)`/g, '$1') // Remove inline code
            .replace(/\n/g, ' ') // Replace newlines with spaces
            .trim();

        return plainText.length > maxLength 
            ? plainText.substring(0, maxLength) + '...'
            : plainText;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showFallbackPosts() {
        // Remove loading indicator
        if (this.loadingIndicator.parentNode) {
            this.loadingIndicator.remove();
        }

        console.log('Showing fallback static posts');
        // Keep the existing static HTML posts that are already in the page
        // This ensures something is always visible
    }

    showNoPosts() {
        this.blogContainer.innerHTML = `
            <div class="no-posts">
                <h3>No blog posts available yet</h3>
                <p>Check back soon for new content!</p>
            </div>
        `;
    }

    // Method to manually add posts (for testing)
    addTestPosts() {
        const testPosts = [
            {
                title: "Getting Started with Netlify CMS",
                category: "Web Development",
                date: "2024-06-03",
                excerpt: "Learn how to set up and configure Netlify CMS for your static website.",
                slug: "getting-started-netlify-cms",
                author: "ROSH Software Team",
                published: true,
                body: "This is a test post created programmatically..."
            }
        ];

        this.renderBlogPosts(testPosts);
    }
}

// Utility function to create blog posts JSON file (for development)
function generateBlogPostsJSON() {
    // This would be used to generate a blog-posts.json file from your markdown files
    // You'd typically run this as part of your build process
    console.log('Blog posts JSON generation would happen here');
}

// Initialize blog loader when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const blogLoader = new BlogLoader();
    
    // For testing purposes, uncomment the next line
    // setTimeout(() => blogLoader.addTestPosts(), 2000);
});

// Make BlogLoader available globally for debugging
window.BlogLoader = BlogLoader;
