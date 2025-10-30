# Neon Color Reference

## Primary Colors (from fv_logo.png)

### Neon Pink (Primary Brand)
- **Hex**: `#FF1493`
- **Usage**: Logo text, primary buttons, main CTAs, hover states
- **Tailwind**: `text-neon-pink`, `bg-neon-pink`, `border-neon-pink`
- **Glow**: `shadow-glow-pink`

### Neon Purple
- **Hex**: `#9D4EDD` (default), `#A855F7` (light), `#7B2CBF` (dark)
- **Usage**: Borders, secondary accents, author links
- **Tailwind**: `text-neon-purple`, `bg-neon-purple`, `border-neon-purple`
- **Glow**: `shadow-glow-purple`

### Neon Cyan
- **Hex**: `#06B6D4` (default), `#22D3EE` (light), `#0891B2` (dark)
- **Usage**: Search focus, category links, featured badges
- **Tailwind**: `text-neon-cyan`, `bg-neon-cyan`, `border-neon-cyan`
- **Glow**: `shadow-glow-cyan`

### Neon Blue
- **Hex**: `#3B82F6` (default), `#60A5FA` (light), `#2563EB` (dark)
- **Usage**: Tag links, interactive elements
- **Tailwind**: `text-neon-blue`, `bg-neon-blue`, `border-neon-blue`
- **Glow**: `shadow-glow-blue`

## Background Colors

### Dark Navy (Main Background)
- **Hex**: `#0A0E27`
- **Usage**: Body background, header background
- **Tailwind**: `bg-dark-navy`

### Dark Navy Light
- **Hex**: `#0F0F23`
- **Usage**: Secondary backgrounds
- **Tailwind**: `bg-dark-navy-light`

### Dark Purple
- **Hex**: `#1A0B2E`
- **Usage**: Accent backgrounds
- **Tailwind**: `bg-dark-purple`

## Utility Classes

### Gradient Text
```tsx
<h1 className="gradient-text">
  Animated gradient: pink → purple → cyan
</h1>
```

### Glow on Hover
```tsx
<div className="glow-on-hover">
  Glows pink on hover
</div>
```

### Neon Borders
```tsx
<div className="border border-neon-purple/30 hover:border-neon-pink">
  Border glows on hover
</div>
```

### Shadow Glows
```tsx
<button className="shadow-glow-pink hover:shadow-glow-pink-lg">
  Button with glow effect
</button>
```

## Usage Examples

### Button with Glow
```tsx
<button className="px-4 py-2 bg-neon-pink hover:bg-pink-600 rounded-lg shadow-glow-pink hover:shadow-glow-pink-lg transition-all duration-300">
  Sign Up
</button>
```

### Card with Neon Border
```tsx
<div className="card border border-neon-purple/20 hover:border-neon-pink/50 hover:shadow-glow-pink">
  Card content
</div>
```

### Input with Cyan Focus
```tsx
<input
  type="text"
  className="bg-dark-300 border border-neon-purple/30 focus:border-neon-cyan focus:shadow-glow-cyan transition-all"
/>
```

### Link with Color-Specific Hover
```tsx
<Link href="/categories" className="hover:text-neon-cyan">
  Categories
</Link>
```

## Animation Classes

### Pulse Glow
```tsx
<div className="animate-pulse-glow">
  Pulsing glow effect (2s loop)
</div>
```

### Floating Grid
```tsx
<div className="animate-grid-float">
  Slow upward float (20s loop)
</div>
```

### Scanline
```tsx
<div className="animate-scan">
  Scanning effect (8s loop)
</div>
```

## Opacity Levels
- `/10` - Very subtle (10%)
- `/20` - Subtle (20%)
- `/30` - Light (30%)
- `/50` - Medium (50%)
- `/80` - Strong (80%)
- Default - Full opacity (100%)

Example: `border-neon-purple/30` = 30% opacity purple border
