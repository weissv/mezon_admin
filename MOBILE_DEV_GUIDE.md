# Mobile Development Guide - Quick Reference

## Common Responsive Patterns

### 1. Page Header with Search and Action Button
```tsx
<div className="mobile-stack mb-4">
  <div className="search-container">
    <Search className="absolute left-2 top-2.5 h-4 w-4" />
    <Input
      placeholder="Search..."
      className="pl-8"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  </div>
  <Button onClick={handleAction} className="w-full sm:w-auto">
    <Plus className="mr-2 h-4 w-4" /> Add Item
  </Button>
</div>
```

### 2. Responsive Grid Layouts
```tsx
{/* 1 column on mobile, 2 on tablet, 3 on desktop, 4 on xl */}
<div className="mezon-grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {items.map(item => <Card key={item.id}>{item.name}</Card>)}
</div>
```

### 3. Responsive Typography
```tsx
{/* Scales from 1.5rem to 2.5rem */}
<h1 className="text-xl sm:text-2xl font-bold mb-4">
  Page Title
</h1>

{/* Use mezon-section-title for hero sections */}
<h1 className="mezon-section-title">
  Welcome to <span>Mezon</span>
</h1>
```

### 4. Mobile-Friendly Forms
```tsx
<form className="space-y-4">
  {/* Inputs automatically have min-height: 44px */}
  <Input 
    type="text" 
    placeholder="Full Name"
    className="w-full"
  />
  
  {/* Buttons stack on mobile, inline on desktop */}
  <div className="btn-group-mobile">
    <Button type="submit" className="w-full sm:w-auto">
      Save
    </Button>
    <Button 
      type="button" 
      variant="outline" 
      className="w-full sm:w-auto"
      onClick={onCancel}
    >
      Cancel
    </Button>
  </div>
</form>
```

### 5. Responsive Tables
```tsx
{/* DataTable is automatically responsive */}
<DataTable
  columns={columns}
  data={data}
  page={page}
  pageSize={10}
  total={total}
  onPageChange={setPage}
/>
```

### 6. Responsive Cards
```tsx
{/* Cards automatically adjust padding */}
<div className="mezon-card">
  <h3 className="text-lg font-semibold mb-2">Card Title</h3>
  <p className="text-sm text-[var(--mezon-text-soft)]">
    Card content adapts to screen size
  </p>
</div>
```

### 7. Conditional Content Display
```tsx
{/* Show on mobile only */}
<div className="block sm:hidden">
  Mobile-only content
</div>

{/* Hide on mobile */}
<div className="hidden sm:block">
  Desktop-only content
</div>
```

## Tailwind Breakpoints

```css
/* Default (mobile-first) */
.class { ... }

/* sm: >= 640px */
@media (min-width: 640px) { ... }

/* md: >= 768px */
@media (min-width: 768px) { ... }

/* lg: >= 1024px */
@media (min-width: 1024px) { ... }

/* xl: >= 1280px */
@media (min-width: 1280px) { ... }
```

## Custom Utility Classes

### .search-container
```tsx
<div className="search-container">
  {/* Full width on mobile, 1/3 width on large screens */}
</div>
```

### .mobile-stack
```tsx
<div className="mobile-stack">
  {/* Vertical stack on mobile, horizontal on sm+ */}
</div>
```

### .btn-group-mobile
```tsx
<div className="btn-group-mobile">
  {/* Stacked buttons on mobile, inline on sm+ */}
</div>
```

## Mobile Menu Integration

The mobile menu is already integrated in `MainLayout.tsx`. No additional setup needed!

### How it works:
1. Hamburger button appears on mobile (< 768px)
2. Clicking opens the sidebar from the left
3. Overlay darkens background
4. Clicking outside or navigation closes menu
5. Close (X) button in menu header

## Best Practices

### ✅ DO:
- Use mobile-first approach (default styles for mobile, add breakpoints for larger screens)
- Ensure touch targets are at least 44x44px
- Test on real devices, not just browser devtools
- Use semantic HTML for better accessibility
- Add loading states for network requests
- Optimize images for mobile bandwidth

### ❌ DON'T:
- Don't use fixed widths that break on small screens
- Don't assume hover interactions (mobile has no hover)
- Don't create tiny touch targets
- Don't forget to test in both portrait and landscape
- Don't disable user zoom without good reason
- Don't make modals taller than viewport

## Testing Checklist

- [ ] Page loads correctly on mobile
- [ ] Mobile menu opens and closes smoothly
- [ ] Forms are usable with on-screen keyboard
- [ ] Tables scroll horizontally
- [ ] Buttons are easy to tap
- [ ] Input fields are properly sized
- [ ] Modals fit on screen and scroll if needed
- [ ] Images load and scale properly
- [ ] Text is readable without zooming
- [ ] Navigation works in both orientations

## Common Issues & Solutions

### Issue: Text too small on mobile
```tsx
// ❌ Bad
<p className="text-xs">Hard to read</p>

// ✅ Good
<p className="text-sm sm:text-base">Readable</p>
```

### Issue: Button too small to tap
```tsx
// ❌ Bad
<button className="px-2 py-1">Tap me</button>

// ✅ Good - Button component already optimized
<Button size="md">Tap me</Button>
```

### Issue: Table doesn't fit on screen
```tsx
// ✅ Already handled by DataTable component!
// Tables automatically scroll horizontally
```

### Issue: Modal extends beyond viewport
```tsx
// ✅ Already fixed in Modal component!
// Modal has max-h-[90vh] and overflow-y-auto
```

## Quick Debugging

### Check responsive behavior:
```bash
# Open in browser devtools
# Toggle device toolbar (Cmd+Shift+M / Ctrl+Shift+M)
# Test different device presets
# Try both portrait and landscape
```

### Common breakpoint values to test:
- 375px (iPhone SE)
- 390px (iPhone 12/13)
- 428px (iPhone 14 Pro Max)
- 768px (iPad Mini)
- 820px (iPad Air)
- 1024px (iPad Pro)

## Resources

- Tailwind CSS Docs: https://tailwindcss.com/docs
- Mobile Web Best Practices: https://web.dev/mobile
- Touch Target Sizes: https://www.w3.org/WAI/WCAG21/Understanding/target-size.html
