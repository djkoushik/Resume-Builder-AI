# Footer Component Documentation

## Overview
The Footer component is a globally accessible, configurable footer that appears on all pages of the BuildResumeNow application. It includes team contact details and a dynamic copyright notice.

## Files Structure
```
Resume-Builder-AI/
├── src/config/footerConfig.ts          # Configuration file
├── components/layout/Footer.tsx        # Footer component
├── App.tsx                            # Updated with footer integration
└── docs/FOOTER_DOCUMENTATION.md       # This documentation
```

## Configuration

### Footer Configuration File
Location: `src/config/footerConfig.ts`

The footer content is completely configurable through the `footerConfig` object:

```typescript
export const footerConfig: FooterConfig = {
  copyright: {
    text: "BuildResumeNow",        // Company/brand name
    startYear: 2023,               // Year the project started
  },
  teamContact: [
    {
      type: "email",
      label: "Support",
      value: "support@buildresumenow.in",
      href: "mailto:support@buildresumenow.in",
    },
    {
      type: "phone", 
      label: "Call Us",
      value: "+91 9700108960",
      href: "tel:+919876543210",
    },
    // Add more contact items as needed
  ],
};
```

### Adding New Contact Types
To add new contact information:

1. Add a new object to the `teamContact` array:
```typescript
{
  type: "social",           // Custom type for styling
  label: "Follow Us",       // Display label
  value: "@buildresumenow", // Display value
  href: "https://twitter.com/buildresumenow", // Link URL
}
```

2. Optionally, add custom icons in the Footer component for new types.

## Features

### Dynamic Copyright
- Automatically calculates the current year
- Shows single year format: `© 2025 BuildResumeNow` (if start year = current year)
- Shows range format: `© 2023 - 2025 BuildResumeNow` (if start year ≠ current year)

### Responsive Design
- **Desktop (lg+)**: 4-column grid layout
- **Tablet (md)**: 2-column layout  
- **Mobile (sm)**: Single column stack
- Maintains readability from 320px to 1920px screen width

### Dark Mode Support
- Automatically adapts to the application's dark/light theme
- Uses Tailwind's dark mode classes

### Accessibility
- High contrast ratios for text readability
- Semantic HTML structure
- Proper link attributes for contact information
- Screen reader friendly icons and labels

## Integration

The Footer component is integrated into all application views:
- Landing page
- Artifact selector
- Resume builder
- Cover letter builder

Each view wraps its content in a `min-h-screen` flex container with the footer at the bottom using `mt-auto`.

## Styling

The footer uses Tailwind CSS classes and follows the application's design system:
- Consistent spacing and typography
- Border separators between sections
- Hover effects on interactive elements
- Responsive grid system

## Customization Examples

### Adding Social Media Links
```typescript
teamContact: [
  // ... existing contacts
  {
    type: "social",
    label: "LinkedIn",
    value: "BuildResumeNow",
    href: "https://linkedin.com/company/buildresumenow",
  },
  {
    type: "social", 
    label: "Twitter",
    value: "@buildresumenow",
    href: "https://twitter.com/buildresumenow",
  }
]
```

### Changing Copyright Text
```typescript
copyright: {
  text: "Your Company Name",
  startYear: 2024,
}
```

### Adding Multiple Support Channels
```typescript
teamContact: [
  {
    type: "email",
    label: "General Support",
    value: "support@buildresumenow.in", 
    href: "mailto:support@buildresumenow.in",
  },
  {
    type: "email",
    label: "Technical Support", 
    value: "tech@buildresumenow.in",
    href: "mailto:tech@buildresumenow.in",
  },
  {
    type: "phone",
    label: "Sales Inquiries",
    value: "+91 9700108960",
    href: "tel:+919876543210",
  }
]
```

## Build Compatibility

The footer implementation is fully compatible with:
- ✅ Vite build system
- ✅ TypeScript compilation
- ✅ Vercel deployment
- ✅ Production builds
- ✅ Tree shaking and code splitting

## Testing

A test suite is included at `__tests__/Footer.test.tsx` that verifies:
- Copyright notice formatting
- Contact information rendering
- Link href attributes
- Responsive behavior
- Configuration integration

## Performance

The footer component is lightweight and optimized:
- No external dependencies beyond React
- Minimal bundle size impact
- Efficient re-rendering with React.memo (if needed)
- Static configuration loading

## Maintenance

To update footer content:
1. Edit `src/config/footerConfig.ts`
2. No code changes required in the component
3. Build and deploy as normal

The separation of configuration from component code ensures easy maintenance and updates without touching the UI logic.