// Template for private configuration file
// Copy this file to 'privateConfig.ts' and add your actual contact information
// The actual privateConfig.ts file is gitignored for security

export interface PrivateContactConfig {
  email?: string;
  phone?: string;
  linkedinProfiles?: {
    name: string;
    linkedinId: string;
  }[];
}

// Private contact configuration template
// Only add values here that you want to display in the footer
const privateContactConfig: PrivateContactConfig = {
  // Email contact - will show if provided
  email: "", // Example: "team.buildresumenow@gmail.com"
  
  // Phone number - will show if provided (leave empty to hide)
  phone: "", // Example: "+91 9700108960"
  
  // LinkedIn profiles - will show if array has items (leave empty array to hide)
  linkedinProfiles: [
    // Example entries (add your LinkedIn IDs here):
    // { name: "Your Name", linkedinId: "your-linkedin-id" },
    // { name: "Team Member", linkedinId: "team-member-linkedin-id" }
  ]
};

// Function to get processed contact items (only non-empty values)
export const getContactItems = () => {
  const items = [];

  // Add email if provided
  if (privateContactConfig.email) {
    items.push({
      type: "email",
      label: "Support",
      value: privateContactConfig.email,
      href: `mailto:${privateContactConfig.email}`,
    });
  }

  // Add phone if provided
  if (privateContactConfig.phone) {
    items.push({
      type: "phone",
      label: "Call Us",
      value: privateContactConfig.phone,
      href: `tel:${privateContactConfig.phone.replace(/\s+/g, '')}`,
    });
  }

  // Add LinkedIn profiles if provided
  if (privateContactConfig.linkedinProfiles && privateContactConfig.linkedinProfiles.length > 0) {
    privateContactConfig.linkedinProfiles.forEach(profile => {
      if (profile.linkedinId) {
        items.push({
          type: "linkedin",
          label: profile.name,
          value: `linkedin.com/in/${profile.linkedinId}`,
          href: `https://www.linkedin.com/in/${profile.linkedinId}`,
        });
      }
    });
  }

  return items;
};