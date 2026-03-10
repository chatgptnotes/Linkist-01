import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Digital Business Card & Smart Contact Sharing | Linkist",
  description: "Get your smart NFC business card and unique Linkist ID for instant sharing, context-rich profiles, and intelligent networking that goes beyond a traditional digital card.",
  openGraph: {
    title: "Digital Business Card & Smart Contact Sharing | Linkist",
    description: "Get your smart NFC business card and unique Linkist ID for instant sharing, context-rich profiles, and intelligent networking that goes beyond a traditional digital card.",
    url: "https://linkist.ai/digital-business-card",
    siteName: "Linkist",
    type: "website",
  },
};

export default function DigitalBusinessCardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
