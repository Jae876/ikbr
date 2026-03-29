# Quick Start Guide

Get the Interactive Brokers replica up and running in 5 minutes.

## Prerequisites

- Node.js 16+ ([Download](https://nodejs.org/))
- npm 8+ (comes with Node.js)
- Text editor (VS Code recommended)

## Step 1: Install Dependencies

```bash
npm install
```

This installs all required packages from `package.json`.

## Step 2: Start Development Server

```bash
npm run dev
```

Your browser will automatically open to `http://localhost:3000`

## Step 3: Explore the App

The app includes these pages:

- **Home** (`/`) - Landing page with features and testimonials
- **Trading** (`/trading`) - Trading products overview
- **Platforms** (`/platforms`) - Available platforms comparison
- **Features** (`/features`) - Detailed features list
- **Pricing** (`/pricing`) - Pricing tiers
- **Market Data** (`/market-data`) - Real-time market data
- **Login** (`/login`) - Example login page
- **Dashboard** (`/dashboard`) - Trading dashboard

## Step 4: Make Your First Change

Edit `src/pages/HomePage.tsx` and change the hero title:

```tsx
// Find this line:
<h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
  Professional Trading. <span className="text-blue-200">Competitive Advantages.</span>
</h1>

// Change it to:
<h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
  Your Trading Title <span className="text-blue-200">Here</span>
</h1>
```

The page updates instantly with hot reload!

## Step 5: Build for Production

```bash
npm run build
```

Creates an optimized `dist/` folder ready for deployment.

## Common Tasks

### Add a New Page

1. Create `src/pages/MyPage.tsx`:
```tsx
export default function MyPage() {
  return (
    <div className="bg-white">
      <div className="container-max py-20">
        <h1 className="section-title">My Page</h1>
        {/* Your content */}
      </div>
    </div>
  )
}
```

2. Add route in `src/App.tsx`:
```tsx
import MyPage from '@pages/MyPage'

// In Routes component:
<Route path="/my-page" element={<MyPage />} />
```

3. Add link in `src/components/layout/Navbar.tsx`:
```tsx
<Link to="/my-page" className="px-3 py-2 rounded text-gray-700 font-medium hover:bg-gray-100">
  My Page
</Link>
```

### Add a New Component

1. Create `src/components/MyComponent.tsx`:
```tsx
export default function MyComponent() {
  return (
    <div className="card p-6">
      <h3 className="font-bold text-gray-900">My Component</h3>
      {/* Content */}
    </div>
  )
}
```

2. Import and use in pages:
```tsx
import MyComponent from '@components/MyComponent'

// In your page:
<MyComponent />
```

### Style Elements

Use Tailwind CSS classes:

```tsx
// Text styles
<h1 className="text-4xl font-bold text-gray-900">Title</h1>
<p className="text-gray-600">Description</p>

// Spacing
<div className="mb-6 p-4">Content</div>

// Colors (using IBKR blue)
<button className="bg-ibkr-blue text-white rounded">Button</button>

// Responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

### Format Data

Use utility functions from `src/utils/helpers.ts`:

```tsx
import { formatCurrency, formatPercent, formatNumber } from '@utils/helpers'

// Format money: $1,234.56
<span>{formatCurrency(1234.56)}</span>

// Format percent: +2.50%
<span>{formatPercent(2.50)}</span>

// Format numbers: 1.2M, 500K, etc
<span>{formatNumber(1200000)}</span>
```

### Fetch Data

Use the API client:

```tsx
import { apiClient } from '@services/apiClient'

// In your component:
const [data, setData] = useState(null)

useEffect(() => {
  apiClient.getMarketData('AAPL').then(setData)
}, [])
```

Or use custom hooks:

```tsx
import { useAccounts, usePositions } from '@hooks/index'

export default function MyComponent() {
  const { accounts, loading, error } = useAccounts()
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  
  return <div>{accounts.length} accounts</div>
}
```

## File Structure Quick Reference

```
src/
├── pages/          → Full page components
├── components/     → Reusable components
├── services/       → API client and services
├── hooks/          → Custom React hooks
├── utils/          → Helper functions
├── types/          → TypeScript definitions
├── App.tsx         → Main routing
└── index.css       → Global styles
```

## Styling System

The app uses a custom Tailwind-based component system:

| Class | Purpose |
|-------|---------|
| `.btn-primary` | Blue action button |
| `.btn-secondary` | Gray secondary button |
| `.btn-tertiary` | Text-only button |
| `.card` | White card with shadow |
| `.section-title` | Large section heading |
| `.container-max` | Centered content wrapper |
| `.input-field` | Styled input field |
| `.grid-auto-fit` | Responsive 3-column grid |

## Useful Tools

### VS Code Extensions (Recommended)

```
Tailwind CSS IntelliSense
Prettier - Code formatter
ES7+ React/Redux/React-Native snippets
```

### Commands Reference

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run type-check   # Check TypeScript errors
npm run lint         # Lint code
npm install          # Install packages
```

## Deployment Checklist

Before deploying:

- [ ] Run `npm run build` successfully
- [ ] Test all pages and routes
- [ ] Check responsive design on mobile
- [ ] Set API endpoint in environment
- [ ] Update domain URL in browser
- [ ] Test API integration
- [ ] Clear browser cache

## Next Steps

1. **Customize Colors**: Edit `tailwind.config.js`
2. **Add More Pages**: Follow "Add a New Page" section
3. **Connect Backend**: Configure `VITE_API_URL` in `.env.local`
4. **Deploy**: Follow [cPanel Deployment Guide](CPANEL_DEPLOYMENT.md)
5. **Monitor**: Set up error tracking and analytics

## Troubleshooting

### Port Already in Use
```bash
npm run dev -- --port 3001
```

### Cache Issues
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### TypeScript Errors
Check the error message and review the file. Or run:
```bash
npm run type-check
```

## Support Resources

- [React Documentation](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)

---

**You're ready to build!** Start modifying the app and have fun! 🚀
