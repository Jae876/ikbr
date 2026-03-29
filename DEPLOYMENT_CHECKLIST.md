# Deployment Checklist - cPanel Quick Reference

## Pre-Deployment (5 minutes)

- [ ] All code committed to git
- [ ] Environment variables configured (.env.local)
- [ ] API endpoints verified
- [ ] Run `npm run build` successfully
- [ ] `dist/` folder created

## Build Verification (2 minutes)

```bash
# Verify build completed
ls -la dist/

# Should show:
# - index.html
# - assets/ folder
# - .htaccess (if created locally)

# Check build size
du -sh dist/
# Should be ~2-5MB uncompressed
```

## Upload to cPanel (10 minutes)

### Option 1: File Manager (Easiest)

1. Login to cPanel
2. Click "File Manager"
3. Navigate to `public_html/`
4. Click "Upload"
5. Select all files from local `dist/` folder
6. Click "Upload Files"
7. Wait for completion

### Option 2: FTP/SFTP

1. Open FTP client (FileZilla, WinSCP, etc.)
2. Connect with:
   - Host: yourdomain.com
   - Username: cPanel username
   - Password: cPanel password
   - Port: 22 (SFTP) or 21 (FTP)
3. Navigate to `public_html/`
4. Drag `dist/` contents to `public_html/`
5. Verify upload complete

### Option 3: Terminal/SSH

```bash
# SSH into cPanel
ssh cpanelusername@yourdomain.com

# Navigate to public_html
cd public_html

# Upload files (from your local machine)
scp -r dist/* cpanelusername@yourdomain.com:/home/cpanelusername/public_html/

# Verify
ls -la
# Should show index.html files
```

## Post-Upload Configuration (5 minutes)

### Create .htaccess File

1. In cPanel File Manager, go to `public_html/`
2. Click "Create New File"
3. Name it: `.htaccess`
4. Click "Create New File"
5. Open it and paste:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain text/html text/xml text/css text/javascript application/xml application/xhtml+xml application/rss+xml application/javascript application/x-javascript
</IfModule>

<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/html "access plus 0 seconds"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType font/ttf "access plus 1 year"
  ExpiresByType font/woff "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
  ExpiresDefault "access plus 2 days"
</IfModule>
```

## SSL Configuration (2 minutes)

1. In cPanel, go to "AutoSSL"
2. Click "Check & Install"
3. Wait for certificate installation
4. Verify green padlock on domain

## Connectivity Test (5 minutes)

### Test Website Access

```bash
# From your local machine
curl https://yourdomain.com

# Should return HTML (index.html content)
# Not: 404, blank page, or error
```

### Test Routing

1. Visit: `https://yourdomain.com` (should load)
2. Click "Products" → "Platforms" → Should show platforms page
3. Refresh the platforms page - should NOT show 404
4. Directly visit: `https://yourdomain.com/platforms` - should work

### Test API Integration (if backend ready)

1. Check browser console (F12)
2. Go to Network tab
3. Trigger an API call (e.g., try login)
4. Look for network requests to API
5. Check for CORS errors or 404s

## Performance Verification (5 minutes)

```bash
# Check file permissions (should be 644)
ls -l public_html/index.html
# Output should show: -rw-r--r--

# Check if gzip is enabled
curl -I -H "Accept-Encoding: gzip" https://yourdomain.com

# Should show: Content-Encoding: gzip
```

## Error Checking (5 minutes)

### Check Error Logs

1. In cPanel, go to "Error Log"
2. Look for any errors related to your domain
3. Common errors:
   - `.htaccess` permission denied → Fix file permissions
   - 404 errors → Verify routing config
   - 500 errors → Check file contents

### Check Access Logs

1. In cPanel, go to "Access Log"
2. Verify requests are being served
3. Should see: `200 OK` for index.html
4. Should see: `200 OK` for assets (js, css)

## Monitoring Setup (10 minutes)

### cPanel Monitoring

1. Go to "Metrics" in cPanel
2. Monitor bandwidth and visitor stats
3. Set up email alerts for high usage

### Log Monitoring

1. Check error logs daily first week
2. Monitor access logs for 404s
3. Set up log rotation if needed

## Troubleshooting Commands

```bash
# Clear browser cache (client-side)
# Ctrl+Shift+Delete (Windows/Linux)
# Cmd+Shift+Delete (Mac)

# Check if server allows rewrites
curl -I https://yourdomain.com/nonexistent-page
# Should return 200 (not 404) if .htaccess working

# Test gzip compression
curl -s -H "Accept-Encoding: gzip" https://yourdomain.com | gunzip | head

# Check SSL certificate
curl -I https://yourdomain.com
# Should show: HTTP/2 200
```

## Common Issues & Fixes

### Issue: Blank Page or 404 After Upload

**Solution**:
1. Verify `index.html` directly in `public_html/`
2. Check `.htaccess` syntax (paste fresh copy)
3. Clear browser cache
4. Check cPanel error logs

### Issue: Routes Not Working (page refresh = 404)

**Solution**:
1. Verify `.htaccess` is in `public_html/`
2. Check `.htaccess` file permissions (644)
3. Verify `mod_rewrite` is enabled
4. Test with curl:
   ```bash
   curl https://yourdomain.com/platforms
   # Should return index.html, not 404
   ```

### Issue: CSS/JS Not Loading

**Solution**:
1. Open browser console (F12)
2. Check Network tab for failed assets
3. Verify `assets/` folder is in `public_html/`
4. Clear browser cache
5. Check file permissions (644)

### Issue: API Calls Failing

**Solution**:
1. Check `VITE_API_URL` in environment
2. Verify CORS headers from backend
3. Check browser Network tab for error details
4. Verify API server is running and accessible

### Permanent Fix: Update .env

1. If using environment variables on cPanel:
   - Edit `.env.local` in `public_html/`
   - Or set via cPanel Node.js module

## Post-Deployment Verification (15 minutes)

- [ ] Homepage loads (https://yourdomain.com)
- [ ] Navigation links work
- [ ] Page refresh doesn't show 404
- [ ] All routes work directly (copy from address bar)
- [ ] Mobile view responsive
- [ ] CSS/JS files loading (browser console clean)
- [ ] No errors in cPanel error logs
- [ ] SSL certificate is valid (green padlock)
- [ ] Performance is adequate (< 3 sec load time)
- [ ] Monitoring is set up

## Go-Live Checklist

- [ ] Website URL added to project documentation
- [ ] Team notified of deployment
- [ ] Error monitoring set up (Sentry, etc.)
- [ ] Analytics tracking active
- [ ] Regular backup configured
- [ ] Support process documented
- [ ] Maintenance window scheduled
- [ ] Rollback plan in place

## Rollback Plan

If something goes wrong:

```bash
# Backup current version
mkdir public_html_OLD
cp -r public_html/* public_html_OLD/

# Restore previous version (if you have backup)
rm -rf public_html/*
cp -r previous_backup/* public_html/

# Test
curl https://yourdomain.com
```

## Maintenance

### Daily
- Monitor error logs
- Check performance metrics

### Weekly
- Verify backups completed
- Review access logs for anomalies

### Monthly
- Update dependencies (`npm update`)
- Run security scan
- Review performance metrics
- Plan feature updates

### Quarterly
- Major security updates
- Backup data export
- Performance optimization review

---

**Estimated Total Time**: 45 minutes to go live  
**Success Indicator**: Website loads at https://yourdomain.com with no console errors

**Need Help?** 
- Check full guides: README.md, CPANEL_DEPLOYMENT.md
- Contact cPanel support for hosting issues
- Review API_INTEGRATION.md for backend issues
