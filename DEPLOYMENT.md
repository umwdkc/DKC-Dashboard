# Deployment Guide

> **Copyright DKC UMW, All rights reserved**

Comprehensive guide for deploying the DKC Booking Dashboard to production.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Vercel Deployment](#vercel-deployment)
- [Environment Configuration](#environment-configuration)
- [Build Configuration](#build-configuration)
- [Domain Setup](#domain-setup)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)
- [Rollback Procedures](#rollback-procedures)

## 🎯 Overview

The DKC Booking Dashboard is deployed using **Vercel**, which provides:

- **Automatic deployments** from Git
- **Serverless functions** for the API
- **Edge network** for fast global delivery
- **Preview deployments** for pull requests
- **Zero-config** setup for Vite applications

### Deployment Architecture

```
┌─────────────────┐
│   GitHub Repo   │
│   (main branch) │
└────────┬────────┘
         │ Push/Merge
         ▼
┌─────────────────┐
│     Vercel      │
│  Auto Deploy    │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐  ┌──────────┐
│Frontend│  │   API    │
│  (CDN) │  │(Serverless)│
└────────┘  └──────────┘
```

## ✅ Prerequisites

Before deploying, ensure you have:

- [ ] Vercel account (free tier is sufficient)
- [ ] GitHub repository access
- [ ] Admin access to deploy settings
- [ ] SimplyBook.me API credentials

## 🚀 Vercel Deployment

### Initial Setup

#### 1. Connect to Vercel

**Option A: Using Vercel Dashboard**

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Select the repository from the list
5. Click "Import"

**Option B: Using Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel
```

#### 2. Configure Project Settings

**Framework Preset:** Vite

**Build & Development Settings:**

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Build Command | `cd web && npm install && npm run build` |
| Output Directory | `web/dist` |
| Install Command | `npm install` |
| Development Command | `cd web && npm run dev` |

**Root Directory:**
- Leave as `.` (root)
- The build command handles the `web` subdirectory

#### 3. Configure Serverless Functions

The API is deployed as serverless functions. Vercel automatically detects the `api/` directory.

**API Configuration (vercel.json):**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    },
    {
      "src": "web/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/web/$1"
    }
  ]
}
```

#### 4. Deploy

Click "Deploy" in Vercel dashboard or run:

```bash
vercel --prod
```

Deployment typically takes 2-3 minutes.

### Automatic Deployments

Vercel automatically deploys when you:

1. **Push to main branch** → Production deployment
2. **Open a pull request** → Preview deployment
3. **Update a pull request** → Updated preview deployment

### Preview Deployments

Each PR gets a unique preview URL:
```
https://dkc-booking-dashboard-git-feature-xyz-username.vercel.app
```

Benefits:
- Test changes before merging
- Share with stakeholders for review
- No impact on production

## ⚙️ Environment Configuration

### Production Environment Variables

If needed in the future, set environment variables in Vercel:

1. Go to Project Settings → Environment Variables
2. Add variables:
   - `API_URL` - API endpoint URL
   - `SIMPLYBOOK_COMPANY` - SimplyBook company ID
   - etc.

**Note:** Currently, all configuration is hardcoded in the source code. For production use, consider moving sensitive data to environment variables.

### Updating API Credentials

**Current location:** `api/index.js` lines 33-37

```javascript
const COMPANY = "umwdkc";
const USER = "rabbas";
const PASS = "RusulAbbas123.";
```

**Security best practice:** Move to environment variables:

```javascript
const COMPANY = process.env.SIMPLYBOOK_COMPANY;
const USER = process.env.SIMPLYBOOK_USER;
const PASS = process.env.SIMPLYBOOK_PASS;
```

Then set in Vercel dashboard.

## 🔧 Build Configuration

### Frontend Build

The frontend uses Vite with the following configuration:

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Set to true for debugging
    minify: 'esbuild',
  },
})
```

### Build Commands

**Local production build:**
```bash
cd web
npm run build
npm run preview  # Preview production build locally
```

**Build output:**
- Location: `web/dist/`
- Contains: Minified HTML, CSS, JS, and assets
- Size: ~500KB gzipped

### API Build

The API doesn't require a build step - Node.js code runs directly on Vercel serverless functions.

**Requirements:**
- Node.js 18.x runtime
- Dependencies installed automatically
- Cold start time: ~500ms

## 🌐 Domain Setup

### Using Vercel Domain

By default, your app is available at:
```
https://your-project-name.vercel.app
```

### Custom Domain

#### 1. Add Domain in Vercel

1. Go to Project Settings → Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `dkc-dashboard.umw.edu`)

#### 2. Configure DNS

**Option A: Use Vercel Nameservers**
1. Point your domain's nameservers to Vercel
2. Vercel manages all DNS records

**Option B: Use External DNS**
1. Add a CNAME record:
   ```
   CNAME  dkc-dashboard  cname.vercel-dns.com
   ```

#### 3. SSL Certificate

Vercel automatically provisions SSL certificates via Let's Encrypt.

- No configuration needed
- Auto-renewal
- HTTPS enforced by default

## 📊 Monitoring

### Vercel Analytics

Enable Vercel Analytics for:
- Page views
- Performance metrics
- User demographics

**Setup:**
1. Go to Project Settings → Analytics
2. Enable Web Analytics
3. Deploy changes

### Error Tracking

#### Using Vercel Logs

View logs in Vercel Dashboard:
1. Go to Deployments
2. Click on a deployment
3. View "Functions" tab for API logs
4. View "Build Logs" for build issues

#### Log Retention

- Free tier: 24 hours
- Pro tier: 7 days

### Performance Monitoring

**Key metrics to track:**

| Metric | Target | Check |
|--------|--------|-------|
| Initial load time | <3s | Vercel Analytics |
| API response time | <2s | Function logs |
| Lighthouse score | >90 | Chrome DevTools |
| Largest Contentful Paint | <2.5s | Vercel Analytics |
| Time to Interactive | <5s | Vercel Analytics |

## 🔍 Troubleshooting

### Common Issues

#### Build Failures

**Error: "Module not found"**

```bash
# Solution: Clear build cache
vercel --prod --force
```

**Error: "Build exceeded time limit"**

```bash
# Solution: Optimize dependencies
cd web
npm prune
npm install --production=false
```

#### Runtime Errors

**Error: "Function timeout"**

API functions timeout after 10s (free tier) or 60s (pro tier).

```javascript
// Solution: Add timeout handling
const timeout = setTimeout(() => {
  res.status(504).json({ error: 'Request timeout' });
}, 9000); // 9 seconds

try {
  const data = await fetchData();
  clearTimeout(timeout);
  res.json(data);
} catch (error) {
  clearTimeout(timeout);
  res.status(500).json({ error: error.message });
}
```

**Error: "Cannot read property of undefined"**

Check API responses:
```javascript
// Add defensive checks
if (!response.data || !Array.isArray(response.data.data)) {
  console.error('Invalid API response:', response.data);
  return [];
}
```

#### CORS Issues

If frontend can't reach API:

```javascript
// In api/index.js
const cors = require('cors');
app.use(cors({
  origin: ['https://your-domain.vercel.app'],
  methods: ['GET', 'POST'],
  credentials: true
}));
```

### Debugging in Production

#### Enable Source Maps

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    sourcemap: true, // Enable for debugging
  },
})
```

**Security note:** Disable source maps in production after debugging.

#### Check Function Logs

```bash
vercel logs <deployment-url>
```

### Health Checks

Create a monitoring script:

```bash
#!/bin/bash
# check-health.sh

API_URL="https://rusul-dkc.vercel.app"

# Check API health
response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/bookings")

if [ $response -eq 200 ]; then
  echo "✅ API is healthy"
else
  echo "❌ API returned status: $response"
  # Send alert (email, Slack, etc.)
fi
```

Run via cron or CI/CD pipeline.

## ⏪ Rollback Procedures

### Immediate Rollback

#### Using Vercel Dashboard

1. Go to Deployments
2. Find the last working deployment
3. Click "..." menu
4. Click "Promote to Production"

Rollback completes in ~30 seconds.

#### Using Vercel CLI

```bash
# List deployments
vercel ls

# Promote a specific deployment
vercel promote <deployment-url>
```

### Git Rollback

For code-level rollbacks:

```bash
# Revert last commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <commit-hash>
git push origin main --force  # Use with caution!
```

Vercel will auto-deploy the reverted code.

### Database Rollback

**Note:** This project doesn't have a database. Data is fetched from SimplyBook API.

If issues with SimplyBook data:
1. Contact SimplyBook support
2. Use cached data as fallback
3. Display error message to users

## 📋 Deployment Checklist

Use this checklist for each deployment:

### Pre-Deployment

- [ ] All tests pass locally
- [ ] No console errors in browser
- [ ] No errors in terminal
- [ ] Tested on Chrome and Firefox
- [ ] Tested on mobile viewport
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] CHANGELOG.md updated (if applicable)

### Deployment

- [ ] Merge PR to main branch
- [ ] Monitor deployment in Vercel
- [ ] Check build logs for errors
- [ ] Wait for deployment to complete

### Post-Deployment

- [ ] Test production URL
- [ ] Test all main features:
  - [ ] Homepage loads
  - [ ] Bookings page displays data
  - [ ] Dashboard charts render
  - [ ] Filters work
  - [ ] Date range selection works
  - [ ] Dark/light mode toggles
- [ ] Check Vercel function logs
- [ ] Monitor error rates (if analytics enabled)
- [ ] Notify team of deployment

### If Issues Occur

- [ ] Check error logs
- [ ] Attempt quick fix
- [ ] If not fixable in 10 minutes → Rollback
- [ ] Fix in development
- [ ] Re-deploy when ready

## 🔐 Security Considerations

### API Keys

- **Never commit** API keys to Git
- Store in environment variables
- Rotate keys periodically

### HTTPS

- Always use HTTPS (enforced by Vercel)
- HSTS enabled by default

### Dependencies

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# For breaking changes
npm audit fix --force
```

Run audit before each deployment.

### Rate Limiting

Consider adding rate limiting to API:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## 📞 Support

### Vercel Support

- **Documentation:** [vercel.com/docs](https://vercel.com/docs)
- **Support:** [vercel.com/support](https://vercel.com/support)
- **Community:** [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)

### Project Support

- **Email:** rabbas@mail.umw.edu
- **Documentation:** See [README.md](README.md) and other docs

---

## 📝 Deployment History Template

Keep a log of deployments:

```markdown
## Deployment Log

### 2025-01-15 - v1.2.0
- **Deployed by:** John Doe
- **Commit:** abc123
- **Changes:** Added CSV export feature
- **Issues:** None
- **Rollback:** N/A

### 2025-01-10 - v1.1.0
- **Deployed by:** Jane Smith
- **Commit:** def456
- **Changes:** Fixed pagination bug
- **Issues:** Temporary CORS issue (fixed in 5 min)
- **Rollback:** No
```

---

**Last Updated:** January 2025

