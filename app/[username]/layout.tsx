import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type Props = {
  params: Promise<{ username: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;

  let name = username;

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, profile_photo_url, avatar_url')
      .eq('custom_url', username)
      .maybeSingle();

    if (profile) {
      const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
      if (fullName) name = fullName;
    }
  } catch (error) {
    console.error('Error fetching profile metadata:', error);
  }

  const title = `Connect with ${name} on Linkist`;
  const description = `Explore ${name}'s profile and connect smarter with Linkist.`;
  const url = `https://linkist.ai/${username}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'Linkist',
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default function UsernameLayout({ children }: Props) {
  return <>{children}</>;
}
