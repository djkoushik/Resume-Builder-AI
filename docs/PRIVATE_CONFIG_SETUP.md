# Private Configuration Setup

## Overview
The application uses a private configuration system to manage contact information securely. This prevents sensitive contact details from being visible in the browser's developer tools or source code inspection.

## Setup Instructions

### 1. Create Private Configuration File
Copy the template file to create your private configuration:

```bash
cp src/config/privateConfig.template.ts src/config/privateConfig.ts
```

### 2. Add Your Contact Information
Edit `src/config/privateConfig.ts` and add your actual contact details:

```typescript
const privateContactConfig: PrivateContactConfig = {
  // Email contact - will show if provided
  email: "team.buildresumenow@gmail.com",
  
  // Phone number - will show if provided (leave empty to hide)
  phone: "+91 9700108960", // Add your phone number or leave empty
  
  // LinkedIn profiles - will show if array has items (leave empty array to hide)
  linkedinProfiles: [
    { name: "Your Name", linkedinId: "your-linkedin-id" },
    { name: "Team Member", linkedinId: "team-member-linkedin-id" }
  ]
};
```

### 3. Conditional Display Logic
The footer will only display contact methods that have values:

- **Email**: Shows if `email` field is not empty
- **Phone**: Shows if `phone` field is not empty  
- **LinkedIn**: Shows if `linkedinProfiles` array has items with valid `linkedinId`

### 4. Security Features

#### Git Ignored
The `privateConfig.ts` file is automatically ignored by Git, so your contact information won't be committed to version control.

#### Build-Time Processing
Contact information is processed during build time, not runtime, making it harder to extract from the client bundle.

#### Template System
The template file (`privateConfig.template.ts`) is committed to version control to help team members set up their own configuration.

## Examples

### Email Only Configuration
```typescript
const privateContactConfig: PrivateContactConfig = {
  email: "team.buildresumenow@gmail.com",
  phone: "", // Empty - won't show
  linkedinProfiles: [] // Empty - won't show
};
```

### Full Configuration
```typescript
const privateContactConfig: PrivateContactConfig = {
  email: "team.buildresumenow@gmail.com",
  phone: "+91 9700108960",
  linkedinProfiles: [
    { name: "Pranay Dasari", linkedinId: "pranay-dasari10" },
    { name: "Koushik Dasari", linkedinId: "koushik-dasari-49ab68118" }
  ]
};
```

### No Contact Information
```typescript
const privateContactConfig: PrivateContactConfig = {
  email: "",
  phone: "",
  linkedinProfiles: []
};
```
*This will result in no contact section being displayed in the footer.*

## File Structure
```
src/config/
├── footerConfig.ts           # Main footer configuration
├── privateConfig.ts          # Your private contact info (gitignored)
└── privateConfig.template.ts # Template for setup (committed)
```

## Deployment Notes

### Development
- Ensure `privateConfig.ts` exists before running `npm run dev`
- The file is automatically excluded from Git commits

### Production
- Make sure to create `privateConfig.ts` on your deployment server
- The build process will fail if the file is missing
- Consider using environment variables for deployment automation

### Team Setup
- Each team member should copy the template and add their own configuration
- The template file helps maintain consistency across team setups
- Private configurations remain local to each developer

## Troubleshooting

### Build Errors
If you get import errors, ensure:
1. `privateConfig.ts` file exists in `src/config/`
2. The file exports the `getContactItems` function
3. The file structure matches the template

### Missing Contact Information
If contact info doesn't appear:
1. Check that values are not empty strings
2. Verify the `getContactItems()` function is working
3. Ensure the build completed successfully

### Security Concerns
- Never commit `privateConfig.ts` to version control
- Regularly review what information is being displayed
- Consider using environment variables for CI/CD pipelines