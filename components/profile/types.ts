// Normalized profile data consumed by all shared profile components.
// Adapters below apply visibility toggles so components never deal with toggle logic.

export interface SocialLink {
  type: 'linkedin' | 'instagram' | 'facebook' | 'twitter' | 'behance' | 'dribbble' | 'github' | 'youtube';
  url: string;
  label: string;
}

export interface ContactItem {
  type: 'email' | 'secondary-email' | 'phone' | 'whatsapp' | 'website' | 'location';
  value: string;
  href?: string;
}

export interface NormalizedProfileData {
  // Identity
  salutation?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  username?: string;

  // Professional
  jobTitle?: string;
  companyName?: string;
  companyLogo?: string | null;
  companyWebsite?: string;
  companyAddress?: string;
  industry?: string;
  subDomain?: string;

  // Bio
  professionalSummary?: string;

  // Media
  profilePhoto?: string | null;
  backgroundImage?: string | null;

  // Pre-filtered by visibility
  socialLinks: SocialLink[];
  contactItems: ContactItem[];
  skills: string[];

  // Optional sections
  services?: Array<{
    id: string;
    title: string;
    description?: string;
    pricing: string;
    pricingUnit?: string;
    currency?: string;
    category: string;
  }>;
  certifications?: Array<{
    id: string;
    name: string;
    title: string;
    url: string;
    size: number;
    type: string;
  }>;
  experience?: Array<{
    title: string;
    company: string;
    duration: string;
    description?: string;
  }>;
  education?: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  portfolio?: Array<{
    id: string;
    title: string;
    image: string;
    description?: string;
    link?: string;
  }>;
  testimonials?: Array<{
    name: string;
    role: string;
    content: string;
    image?: string;
  }>;

  // Badges
  isFoundingMember?: boolean;
  foundingMemberPlan?: string | null;
}

// ─── Adapter for pages 1 & 2 (app/[username] and app/profiles/preview) ───

interface MainProfileData {
  salutation: string;
  firstName: string;
  lastName: string;
  primaryEmail: string;
  secondaryEmail: string;
  mobileNumber: string;
  whatsappNumber: string;
  jobTitle: string;
  companyName: string;
  companyWebsite: string;
  companyAddress: string;
  companyLogo: string | null;
  industry: string;
  subDomain: string;
  skills: string[];
  professionalSummary: string;
  linkedinUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  twitterUrl: string;
  behanceUrl: string;
  dribbbleUrl: string;
  githubUrl: string;
  youtubeUrl: string;
  showEmailPublicly: boolean;
  showSecondaryEmailPublicly: boolean;
  showMobilePublicly: boolean;
  showWhatsappPublicly: boolean;
  showJobTitle: boolean;
  showCompanyName: boolean;
  showCompanyWebsite: boolean;
  showCompanyAddress: boolean;
  showIndustry: boolean;
  showSkills: boolean;
  showLinkedin: boolean;
  showInstagram: boolean;
  showFacebook: boolean;
  showTwitter: boolean;
  showBehance: boolean;
  showDribbble: boolean;
  showGithub: boolean;
  showYoutube: boolean;
  profilePhoto: string | null;
  backgroundImage: string | null;
  showProfilePhoto: boolean;
  showBackgroundImage: boolean;
  services?: Array<{ id: string; title: string; description?: string; pricing: string; pricingUnit?: string; currency?: string; category: string; showPublicly?: boolean }>;
  certifications?: Array<{ id: string; name: string; title: string; url: string; size: number; type: string; showPublicly: boolean }>;
  isFoundingMember?: boolean;
  foundingMemberPlan?: string | null;
}

export function normalizeMainProfile(data: MainProfileData, username?: string): NormalizedProfileData {
  const socialLinks: SocialLink[] = [];
  if (data.showLinkedin && data.linkedinUrl) socialLinks.push({ type: 'linkedin', url: data.linkedinUrl, label: 'LinkedIn' });
  if (data.showInstagram && data.instagramUrl) socialLinks.push({ type: 'instagram', url: data.instagramUrl, label: 'Instagram' });
  if (data.showFacebook && data.facebookUrl) socialLinks.push({ type: 'facebook', url: data.facebookUrl, label: 'Facebook' });
  if (data.showTwitter && data.twitterUrl) socialLinks.push({ type: 'twitter', url: data.twitterUrl, label: 'X' });
  if (data.showBehance && data.behanceUrl) socialLinks.push({ type: 'behance', url: data.behanceUrl, label: 'Behance' });
  if (data.showDribbble && data.dribbbleUrl) socialLinks.push({ type: 'dribbble', url: data.dribbbleUrl, label: 'Dribbble' });
  if (data.showGithub && data.githubUrl) socialLinks.push({ type: 'github', url: data.githubUrl, label: 'GitHub' });
  if (data.showYoutube && data.youtubeUrl) socialLinks.push({ type: 'youtube', url: data.youtubeUrl, label: 'YouTube' });

  const contactItems: ContactItem[] = [];
  if (data.showEmailPublicly && data.primaryEmail?.trim()) {
    contactItems.push({ type: 'email', value: data.primaryEmail.trim(), href: `mailto:${data.primaryEmail.trim()}` });
  }
  if (data.showSecondaryEmailPublicly && data.secondaryEmail?.trim()) {
    contactItems.push({ type: 'secondary-email', value: data.secondaryEmail.trim(), href: `mailto:${data.secondaryEmail.trim()}` });
  }
  if (data.showMobilePublicly && data.mobileNumber?.trim()) {
    contactItems.push({ type: 'phone', value: data.mobileNumber.trim(), href: `tel:${data.mobileNumber.trim()}` });
  }
  if (data.showWhatsappPublicly && data.whatsappNumber?.trim()) {
    contactItems.push({ type: 'whatsapp', value: data.whatsappNumber.trim(), href: `https://wa.me/${data.whatsappNumber.replace(/[^0-9]/g, '')}` });
  }
  if (data.showCompanyWebsite && data.companyWebsite?.trim()) {
    contactItems.push({ type: 'website', value: data.companyWebsite.trim(), href: data.companyWebsite.trim() });
  }
  if (data.showCompanyAddress && data.companyAddress?.trim()) {
    contactItems.push({ type: 'location', value: data.companyAddress.trim() });
  }

  return {
    salutation: data.salutation,
    firstName: data.firstName,
    lastName: data.lastName,
    fullName: `${data.salutation ? data.salutation + ' ' : ''}${data.firstName} ${data.lastName}`,
    username: username ? `@${username}.Linkist.ai` : undefined,
    jobTitle: data.showJobTitle ? data.jobTitle : undefined,
    companyName: data.showCompanyName ? data.companyName : undefined,
    companyLogo: data.companyLogo,
    companyWebsite: data.showCompanyWebsite ? data.companyWebsite : undefined,
    companyAddress: data.showCompanyAddress ? data.companyAddress : undefined,
    industry: data.showIndustry ? data.industry : undefined,
    subDomain: data.subDomain,
    professionalSummary: data.professionalSummary,
    profilePhoto: data.showProfilePhoto ? data.profilePhoto : null,
    backgroundImage: data.showBackgroundImage ? data.backgroundImage : null,
    socialLinks,
    contactItems,
    skills: data.showSkills ? (data.skills || []) : [],
    services: data.services?.filter(s => s.showPublicly !== false).map(({ showPublicly, ...rest }) => rest),
    certifications: data.certifications?.filter(c => c.showPublicly).map(({ showPublicly, ...rest }) => rest),
    isFoundingMember: data.isFoundingMember,
    foundingMemberPlan: data.foundingMemberPlan,
  };
}

// ─── Adapter for page 3 (app/p/[id]) ───

interface AlternateProfileData {
  fullName: string;
  title: string;
  company: string;
  bio: string;
  profileImage: string;
  coverImage?: string;
  email: string;
  phone: string;
  website?: string;
  location?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  github?: string;
  experience?: Array<{ title: string; company: string; duration: string; description?: string }>;
  education?: Array<{ degree: string; institution: string; year: string }>;
  skills?: string[];
  achievements?: string[];
  portfolio?: Array<{ id: string; title: string; image: string; description?: string; link?: string }>;
  testimonials?: Array<{ name: string; role: string; content: string; image?: string }>;
  services?: Array<{ id: string; title: string; description?: string; pricing: string; category: string; showPublicly?: boolean }>;
}

export function normalizeAlternateProfile(data: AlternateProfileData): NormalizedProfileData {
  const nameParts = data.fullName.trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const socialLinks: SocialLink[] = [];
  if (data.linkedin) socialLinks.push({ type: 'linkedin', url: data.linkedin, label: 'LinkedIn' });
  if (data.instagram) socialLinks.push({ type: 'instagram', url: data.instagram, label: 'Instagram' });
  if (data.facebook) socialLinks.push({ type: 'facebook', url: data.facebook, label: 'Facebook' });
  if (data.twitter) socialLinks.push({ type: 'twitter', url: data.twitter, label: 'X' });
  if (data.youtube) socialLinks.push({ type: 'youtube', url: data.youtube, label: 'YouTube' });
  if (data.github) socialLinks.push({ type: 'github', url: data.github, label: 'GitHub' });

  const contactItems: ContactItem[] = [];
  if (data.email) contactItems.push({ type: 'email', value: data.email, href: `mailto:${data.email}` });
  if (data.phone) contactItems.push({ type: 'phone', value: data.phone, href: `tel:${data.phone}` });
  if (data.website) contactItems.push({ type: 'website', value: data.website, href: data.website });
  if (data.location) contactItems.push({ type: 'location', value: data.location });

  return {
    firstName,
    lastName,
    fullName: data.fullName,
    jobTitle: data.title,
    companyName: data.company,
    professionalSummary: data.bio,
    profilePhoto: data.profileImage,
    backgroundImage: data.coverImage || null,
    socialLinks,
    contactItems,
    skills: data.skills || [],
    services: data.services?.filter(s => s.showPublicly !== false).map(({ showPublicly, ...rest }) => rest),
    experience: data.experience,
    education: data.education,
    portfolio: data.portfolio,
    testimonials: data.testimonials,
  };
}
