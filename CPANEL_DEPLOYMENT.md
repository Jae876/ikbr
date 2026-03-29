# Interactive Brokers Replica - cPanel Deployment Guide

This guide provides step-by-step instructions for deploying the Interactive Brokers replica frontend on cPanel.

## Table of Contents

1. [Local Build](#local-build)
2. [cPanel Access](#cpanel-access)
3. [Uploading Files](#uploading-files)
4. [Configuration](#configuration)
5. [Optimization](#optimization)
6. [Troubleshooting](#troubleshooting)

## Local Build

### Step 1: Prepare Your Project

```bash
# Navigate to project directory
cd c:\Users\jae.jojo\Downloads\ikbr

# Install dependencies (if not done)
npm install

# Build the project
npm run build
```

After running `npm run build`, the `dist/` folder contains all files needed for deployment.

### Step 2: Verify Build Output

```bash
# Check the dist folder contents
dir dist

# Should see:
# - index.html
# - assets/ folder (with JS and CSS files)
```

## cPanel Access

### Via File Manager (Easiest)

1. Login to your cPanel account
2. Navigate to "File Manager"
3. Open the `public_html` directory

### Via FTP/SFTP

**FTP Details** (from cPanel):
- Host: `yourdomain.com` or IP address
- Username: Your cPanel username
- Password: Your cPanel password
- Port: 21 (FTP) or 22 (SFTP)

**FTP Client Tools**:
- FileZilla (Free & cross-platform)
- WinSCP (Windows)
- Cyberduck (Mac)

## Uploading Files

### Method 1: Using File Manager (Recommended for Beginners)

1. In cPanel File Manager, go to `public_html/`
2. Click "Upload" button
3. Select all files from your `dist/` folder
4. Wait for upload to complete
5. Result: Files should be directly in `public_html/` (not in a subfolder)

**Important**: Upload files FROM the `dist/` folder, not the folder itself.

### Method 2: Using FTP Client

1. Connect to your cPanel FTP account
2. Navigate to `public_html/` folder
3. Drag-and-drop entire `dist/` folder contents into `public_html/`
4. Ensure `index.html` is directly in `public_html/`

### Method 3: Using git (Advanced)

```bash
# In your cPanel account, via SSH/Terminal
cd public_html

# Clone or pull your repository
git clone <repo-url> .
npm install
npm run build

# Copy dist contents to public_html
cp -r dist/* .
```

## Configuration

### Step 1: Create .htaccess for Routing

This is **CRITICAL** for React Router to work properly on cPanel.

1. In File Manager, navigate to `public_html/`
2. Create a new file called `.htaccess`
3. Paste the following content:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Don't rewrite files or directories
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  
  # Rewrite all other requests to index.html
  RewriteRule . /index.html [L]
</IfModule>

# Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/xml
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE text/javascript
  AddOutputFilterByType DEFLATE application/xml
  AddOutputFilterByType DEFLATE application/xhtml+xml
  AddOutputFilterByType DEFLATE application/rss+xml
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Caching
<IfModule mod_expires.c>
  ExpiresActive On
  
  # HTML
  ExpiresByType text/html "access plus 0 seconds"
  
  # CSS and JavaScript  
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType text/javascript "access plus 1 year"
  
  # Images
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  
  # Fonts
  ExpiresByType font/ttf "access plus 1 year"
  ExpiresByType font/otf "access plus 1 year"
  ExpiresByType font/woff "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
  ExpiresByType application/font-woff "access plus 1 year"
  
  # Default
  ExpiresDefault "access plus 2 days"
</IfModule>
```

### Step 2: SSL/TLS Certificate

1. In cPanel, go to "AutoSSL" or "SSL/TLS Status"
2. Install a free SSL certificate (usually automatic with AutoSSL)
3. Ensure HTTPS is enabled for your domain
4. Update your `.env` to use `https://`

### Step 3: Configure API Endpoint

If your backend API is on the same cPanel account (different port):

1. Contact your hosting provider for the API port number
2. Create a `.htaccess` rule to proxy API requests

Add to `.htaccess`:

```apache
# Proxy API requests to backend (if on same server, different port)
<IfModule mod_proxy.c>
  ProxyPassMatch ^/api/(.*)$ http://localhost:3000/api/$1 [P,L]
  ProxyPassReverse ^/api/(.*)$ http://localhost:3000/api
</IfModule>
```

Or, if API is on different domain, update environment variable:

1. In cPanel, go to "Node.js Selector" or environment variables
2. Set: `VITE_API_URL=https://api.yourdomain.com`

## Optimization

### Enable gzip Compression

The `.htaccess` file above includes gzip configuration. To enable:

1. In cPanel, check if `mod_deflate` is enabled
2. If using EasyApache, ensure "mod_deflate" is selected

### DNS/CDN Configuration

1. Consider using a CDN (CloudFlare, BunnyCD)
2. Enable caching for static assets
3. Cache static files with 1-year expiration (already in .htaccess)

### Performance Monitoring

1. In cPanel, go to "Metrics" to check traffic and performance
2. Monitor error logs: `public_html/error_log`
3. Monitor access logs: `public_html/access_log`

## Troubleshooting

### Issue: Blank Page After Upload

**Symptoms**: Visit domain, see blank page or 404

**Solutions**:
1. Verify `index.html` is in `public_html/` (not in subdirectory)
2. Check `.htaccess` file is present and readable
3. Review error logs in cPanel
4. Clear browser cache (Ctrl+Shift+Delete)

### Issue: Routes Not Working (404 on page refresh)

**Symptoms**: Links work, but page refresh shows 404

**Solutions**:
1. Verify `.htaccess` file with routing rules is in place
2. Check mod_rewrite is enabled in cPanel
3. Restart Apache (cPanel > Restart Services)

### Issue: Static Assets Not Loading (CSS/JS missing)

**Symptoms**: Page loads but no styling or functionality

**Solutions**:
1. Check browser console for 404 errors
2. Verify assets are in `public_html/assets/` folder
3. Check file permissions (should be 644)
4. Clear browser cache

### Issue: API Calls Failing

**Symptoms**: "Cannot fetch data" or API errors

**Solutions**:
1. Check `VITE_API_URL` environment variable
2. Verify CORS headers from backend
3. Check if API server is running
4. Look at browser console Network tab for error details

### Issue: SSL/HTTPS Certificate

**Symptoms**: Green padlock not showing, or security warnings

**Solutions**:
1. In cPanel, go to "AutoSSL"
2. Run AutoSSL installation
3. Force HTTPS redirect in `.htaccess`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>
```

### Issue: High Memory or CPU Usage

**Symptoms**: Site slow, hosting provider warnings

**Solutions**:
1. Review cPanel error logs
2. Enable caching in `.htaccess`
3. Optimize images in `dist/` folder
4. Check for memory leaks in API integration
5. Contact hosting provider to upgrade plan

### Issue: Email Not Sending

If your app needs email notifications:

1. In cPanel, go to "Email Accounts"
2. Create an email account
3. For backend API, use PHP mailer or similar
4. Configure SMTP settings in backend

## Monitoring After Deployment

### Check Site is Running

```bash
# Verify from your local machine
curl https://yourdomain.com

# Should return HTML content of index.html
```

### Monitor Error Logs

1. In cPanel File Manager, show hidden files
2. Look for `error_log` in `public_html/`
3. Check for errors related to your app

### Test All Features

1. Visit homepage
2. Test all navigation links
3. Navigate directly to URLs (test routing)
4. Test login form
5. Test API integration (if applicable)
6. Test on mobile (responsive design)

## Advanced Deployment

### Using Git with Webhooks

Set up automatic deployment on git push:

1. In cPanel, enable git repositories
2. Create a webhook in your git provider (GitHub, GitLab, etc.)
3. Point webhook to a script in `public_html/`
4. Script pulls latest code and runs `npm run build`

### Load Balancing (Multiple Servers)

If scaling to multiple servers:

1. Deploy same `dist/` folder to all servers
2. Use cPanel's load balancing (if available)
3. Point domain to load balancer
4. Ensure backend API is accessible from all servers

### Database Connection

If your frontend needs direct database access (not recommended):

1. Use environment variables for credentials
2. Never expose credentials in code
3. Prefer API calls to backend instead

## Support

For issues specific to your cPanel hosting:

1. Contact your hosting provider's support
2. Provide them with:
   - Error messages from logs
   - Steps to reproduce issue
   - Browser console errors
   - cPanel error logs

## Checklist Before Going Live

- [ ] Build successful locally
- [ ] All files uploaded to `public_html/`
- [ ] `.htaccess` file in place
- [ ] SSL certificate installed
- [ ] Domain points to cPanel
- [ ] Routes working (refresh doesn't show 404)
- [ ] Static assets loading
- [ ] API endpoints configured
- [ ] Forms validating
- [ ] Mobile responsive tested
- [ ] Error logs checked
- [ ] Performance monitoring enabled
- [ ] Regular backups configured

## Next Steps

After deployment:
1. Set up monitoring and error tracking
2. Configure analytics
3. Set up regular backups
4. Monitor logs regularly
5. Plan updates and maintenance windows
6. Test API integration thoroughly
7. Consider CDN for static assets
8. Implement proper error boundaries in app
9. Set up automated deployment pipeline

---

**Important**: Always test on a staging/development domain first before going to production!
