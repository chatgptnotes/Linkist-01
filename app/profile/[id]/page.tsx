import { Avatar, AvatarFallback, AvatarImage } from "@/components/ImageAvatar";
import { UniversalLinkBtn } from "@/components/UniversalLinkBtn";
import Image from "next/image";

const randomWords = [
    "contact", "share", "connect", "exchange", "network", "profile", "card", "digital", "qr", "link",
    "social", "business", "professional", "exchange", "vcard", "contactless", "instant", "scan", "save", "sync"
];

// Generate an array of random background text spans with different positions, opacity, size, and slight rotation
function BlurredRandomTextBackground() {
    return (
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" style={{ zIndex: 0 }}>
            {Array.from({ length: 25 }).map((_, i) => {
                const word = randomWords[Math.floor(Math.random() * randomWords.length)];
                const top = Math.floor(Math.random() * 90) + "%";
                const left = Math.floor(Math.random() * 90) + "%";
                const fontSize = 32 + Math.random() * 48; // px
                const opacity = 0.15 + Math.random() * 0.25; // More visible
                const rotate = (-20 + Math.random() * 40); // -20deg to +20deg
                return (
                    <span
                        key={i}
                        style={{
                            position: "absolute",
                            top,
                            left,
                            fontSize: `${fontSize}px`,
                            opacity,
                            fontWeight: 900,
                            letterSpacing: "0.2em",
                            color: "#ffffff",
                            filter: "blur(6px)",
                            transform: `rotate(${rotate}deg)`,
                            userSelect: "none",
                            pointerEvents: "none",
                            textShadow: "0 2px 12px rgba(255,255,255,0.1)",
                            whiteSpace: "nowrap"
                        }}
                    >
                        {word}
                    </span>
                );
            })}
        </div>
    );
}

async function fetchProfileData(id: string) {
    try {
        // http://linkist-dev-alb-2049215369.me-central-1.elb.amazonaws.com
        // Construct the absolute URL for server-side fetch
        const baseUrl = `http://localhost:3001`;

        const response = await fetch(`${baseUrl}/api/public/profiles/${id}`, {
            cache: 'no-store', // Ensure fresh data on each request
        });

        if (!response.ok) {
            console.log(`Profile not found for id: ${id}`);
            return null;
        }

        const data = await response.json();
        // The API returns the profile directly
        return data;
    } catch (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
}

const ProfilePage = async ({ params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const profileData = await fetchProfileData(id);

    const fullName = profileData?.name ||
        (profileData?.firstName && profileData?.lastName
            ? `${profileData.firstName} ${profileData.lastName}`
            : profileData?.firstName || "User");
    const initials = fullName.split(" ").map((name: string) => name[0]).join("");

    const profileImage = profileData?.profileImage ? `http://linkist-staging-alb-391132334.me-central-1.elb.amazonaws.com/${profileData.profileImage}` : undefined;
    return <div className="relative flex justify-center w-full items-center bg-black text-white !h-[calc(100vh-132px)] overflow-hidden">
        <BlurredRandomTextBackground />
        <div className=" z-10 flex flex-col rounded-[25px] h-[433px] items-center justify-center gap-4 w-[315px] text-center bg-black/40 backdrop-blur-sm shadow-2xl border !border-white/55" >
            <Avatar className="w-[104px] h-[104px]">
                <AvatarImage src={profileImage} alt={fullName} />
                <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            <p className="w-[201px] font-inter font-medium text-[25px] leading-[120%] tracking-[0.03em] text-center">
                View {fullName}&apos;s Full Profile
            </p>
            <UniversalLinkBtn />
            <div className="w-full flex items-center justify-center gap-2">
                <hr className="border w-[86px] border-black" />
                <p className="text-[15px]"> or </p>
                <hr className="border w-[86px] border-black" />

            </div>
            <p className="text-[15px] gap-2">
                New to Linkist?
                <span className="text-primary font-extrabold"> Download now</span>
            </p>
            <p className="text-[10px]">
                by clicking sign in or join now you agree to
                <span className="text-primary font-extrabold"> Linkist User Agreement, Privacy Policy, </span>
                and cookie policy
            </p>
        </div>
    </div>;
};

export default ProfilePage;