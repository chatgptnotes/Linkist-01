'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import WorkIcon from '@mui/icons-material/Work';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MessageIcon from '@mui/icons-material/Message';
import SendIcon from '@mui/icons-material/Send';
import { normalizeAlternateProfile } from '@/components/profile/types';
import ProfileBackground from '@/components/profile/ProfileBackground';
import BottomSheetCard from '@/components/profile/BottomSheetCard';
import ActionButtons from '@/components/profile/ActionButtons';
import ProfileHeader from '@/components/profile/ProfileHeader';
import SocialIconsRow from '@/components/profile/SocialIconsRow';
import AboutSection from '@/components/profile/AboutSection';
import ContactInfoSection from '@/components/profile/ContactInfoSection';
import SkillsSection from '@/components/profile/SkillsSection';

interface ProfileData {
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
  theme?: 'default' | 'dark' | 'minimal' | 'creative';
  accentColor?: string;
}

export default function PublicProfilePage() {
  const params = useParams();
  const profileId = params.id as string;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      // In production, this would fetch from API. For now, using mock data
      setProfile({
        fullName: 'John Doe',
        title: 'CEO & Founder',
        company: 'Tech Innovations Inc.',
        bio: 'Passionate entrepreneur and technology enthusiast with over 10 years of experience in building innovative solutions. Specializing in AI, blockchain, and sustainable technology.',
        profileImage: '/api/placeholder/400/400',
        coverImage: '/api/placeholder/1200/300',
        email: 'john.doe@techinnovations.com',
        phone: '+1 (555) 123-4567',
        website: 'www.techinnovations.com',
        location: 'San Francisco, CA',
        linkedin: 'linkedin.com/in/johndoe',
        twitter: 'twitter.com/johndoe',
        instagram: 'instagram.com/johndoe',
        experience: [
          { title: 'CEO & Founder', company: 'Tech Innovations Inc.', duration: '2020 - Present', description: 'Leading the company vision and strategy for next-generation technology solutions.' },
          { title: 'Senior Product Manager', company: 'Global Tech Corp', duration: '2018 - 2020', description: 'Managed product lifecycle for enterprise AI solutions.' }
        ],
        education: [
          { degree: 'MBA in Technology Management', institution: 'Stanford University', year: '2018' },
          { degree: 'BS in Computer Science', institution: 'MIT', year: '2014' }
        ],
        skills: ['Leadership', 'Strategy', 'AI/ML', 'Blockchain', 'Product Management', 'Public Speaking'],
        portfolio: [
          { id: '1', title: 'AI Assistant Platform', image: '/api/placeholder/400/300', description: 'Revolutionary AI platform for business automation', link: '#' },
          { id: '2', title: 'Blockchain Supply Chain', image: '/api/placeholder/400/300', description: 'Transparent supply chain management system', link: '#' }
        ],
        testimonials: [
          { name: 'Sarah Johnson', role: 'CTO at TechCorp', content: 'John is an exceptional leader with a unique vision for technology innovation.', image: '/api/placeholder/60/60' }
        ],
        services: [
          { id: '1', title: 'UX/UI Design Consultation', description: 'Expert consultation on user experience and interface design for your digital products.', pricing: 'AED 850/hr', category: 'Design', showPublicly: true },
          { id: '2', title: 'Mobile App Design', description: 'Complete mobile application design from wireframes to final UI.', pricing: 'Starting at AED 5,000', category: 'Design', showPublicly: true },
          { id: '3', title: 'Design System Creation', description: 'Build comprehensive design systems for scalable product development.', pricing: 'Contact for pricing', category: 'Design', showPublicly: true }
        ],
        theme: 'default',
        accentColor: '#EF4444'
      });
      setLoading(false);
      trackProfileView(profileId);
    };

    loadProfile();
  }, [profileId]);

  const trackProfileView = async (id: string) => {
    console.log('Tracking view for profile:', id);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: profile?.fullName,
        text: `Check out ${profile?.fullName}'s profile`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    }
  };

  const handleDownloadVCard = async () => {
    if (!profile) return;

    const vcard = `BEGIN:VCARD\r\nVERSION:3.0\r\nFN:${profile.fullName}\r\nORG:${profile.company}\r\nTITLE:${profile.title}\r\nTEL:${profile.phone}\r\nEMAIL:${profile.email}\r\nURL:${profile.website}\r\nADR;TYPE=WORK:;;${profile.location};;;;\r\nNOTE:${profile.bio?.replace(/\n/g, '\\n') || ''}\r\nEND:VCARD`;

    const blob = new Blob([vcard], { type: 'text/vcard' });
    const fileName = `${profile.fullName.replace(' ', '_')}.vcf`;

    try {
      const file = new File([blob], fileName, { type: 'text/vcard' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
        return;
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error('Share failed, falling back:', error);
    }

    // Fallback: blob URL navigation
    const url = URL.createObjectURL(blob);
    window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
          <p className="text-gray-600">This profile does not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const normalized = normalizeAlternateProfile(profile);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-100 md:flex md:items-center md:justify-center">
      <div className="relative w-full md:max-w-[430px] md:h-[932px] md:rounded-3xl md:overflow-hidden md:shadow-2xl">
        <ProfileBackground
          profilePhoto={normalized.profilePhoto}
          backgroundImage={normalized.backgroundImage}
          firstName={normalized.firstName}
          lastName={normalized.lastName}
        />

        <BottomSheetCard>
          <div className="flex items-start justify-between gap-3">
            <ProfileHeader data={normalized} />
            <ActionButtons
              onShare={handleShare}
              onSaveContact={handleDownloadVCard}
            />
          </div>
          <SocialIconsRow links={normalized.socialLinks} />
          <AboutSection summary={normalized.professionalSummary} />
          <ContactInfoSection items={normalized.contactItems} />
          <SkillsSection skills={normalized.skills} />

          {/* Experience */}
          {normalized.experience && normalized.experience.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <WorkIcon className="w-5 h-5 text-red-500" />
                Experience
              </h3>
              <div className="space-y-4">
                {normalized.experience.map((exp, index) => (
                  <div key={index} className="relative pl-6 before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:bg-red-500 before:rounded-full">
                    <h4 className="font-semibold text-white text-sm">{exp.title}</h4>
                    <p className="text-sm text-white/60">{exp.company}</p>
                    <p className="text-xs text-white/40 mt-0.5">{exp.duration}</p>
                    {exp.description && <p className="text-sm text-white/60 mt-1">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {normalized.education && normalized.education.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MenuBookIcon className="w-5 h-5 text-red-500" />
                Education
              </h3>
              <div className="space-y-3">
                {normalized.education.map((edu, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center">
                      <EmojiEventsIcon className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">{edu.degree}</h4>
                      <p className="text-sm text-white/60">{edu.institution}</p>
                      <p className="text-xs text-white/40">{edu.year}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio */}
          {normalized.portfolio && normalized.portfolio.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Portfolio</h3>
              <div className="space-y-3">
                {normalized.portfolio.map((item) => (
                  <div key={item.id} className="group relative overflow-hidden rounded-xl">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-36 object-cover rounded-xl"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                        <h4 className="font-semibold text-sm">{item.title}</h4>
                        {item.link && (
                          <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center mt-1 text-xs hover:underline">
                            View <OpenInNewIcon className="w-3 h-3 ml-1" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Testimonials */}
          {normalized.testimonials && normalized.testimonials.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Testimonials</h3>
              <div className="space-y-3">
                {normalized.testimonials.map((t, index) => (
                  <div key={index} className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                    <p className="text-sm text-white/70 italic mb-3">&ldquo;{t.content}&rdquo;</p>
                    <div className="flex items-center gap-2">
                      {t.image && <img src={t.image} alt={t.name} className="w-8 h-8 rounded-full object-cover" />}
                      <div>
                        <p className="text-sm font-semibold text-white">{t.name}</p>
                        <p className="text-xs text-white/50">{t.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Form */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Get in Touch</h3>
            <button
              onClick={() => setShowContactForm(!showContactForm)}
              className="w-full py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 text-white"
              style={{ backgroundColor: '#dc2626' }}
            >
              <MessageIcon className="w-5 h-5" />
              Send Message
            </button>

            {showContactForm && (
              <form className="mt-4 space-y-3">
                <input type="text" placeholder="Your Name" className="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-white placeholder-white/40 bg-white/10" />
                <input type="email" placeholder="Your Email" className="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-white placeholder-white/40 bg-white/10" />
                <textarea rows={3} placeholder="Your Message" className="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-white placeholder-white/40 bg-white/10" />
                <button type="submit" className="w-full bg-white/15 text-white py-3 rounded-lg hover:bg-white/20 transition flex items-center justify-center gap-2 text-sm border border-white/20">
                  <SendIcon className="w-4 h-4" />
                  Send Message
                </button>
              </form>
            )}
          </div>
        </BottomSheetCard>
      </div>

      {/* Toast notification */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-white/15 backdrop-blur-md text-white text-sm font-medium shadow-lg animate-fade-in">
          Link copied to clipboard
        </div>
      )}
    </div>
  );
}
