import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Choose Your Linkist Plan – Personal & Team Options",
  description: "Select the Linkist plan that fits your networking needs — individual access or team packages with savings. Start building smarter professional relationships today.",
  openGraph: {
    title: "Choose Your Linkist Plan – Personal & Team Options",
    description: "Select the Linkist plan that fits your networking needs — individual access or team packages with savings. Start building smarter professional relationships today.",
    url: "https://www.linkist.ai/choose-plan",
    siteName: "Linkist",
    type: "website",
  },
};

export default function ChoosePlanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
