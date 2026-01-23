"use client";

import { useEffect, useState } from "react";

interface UniversalLinkBtnProps {
    profileId?: string;
}

export const UniversalLinkBtn = ({ profileId }: UniversalLinkBtnProps) => {
    const [isMobile, setIsMobile] = useState(false);
    const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('ios');
    const [universalLink, setUniversalLink] = useState<string>('');

    useEffect(() => {
        // Detect platform
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
        const isAndroid = /android/i.test(userAgent);
        
        setIsMobile(isIOS || isAndroid);
        if (isIOS) {
            setPlatform('ios');
        } else if (isAndroid) {
            setPlatform('android');
        } else {
            setPlatform('desktop');
        }

        // Construct universal link URL
        // Use current page URL if profileId not provided, otherwise construct it
        if (profileId) {
            const baseUrl = typeof window !== 'undefined' 
                ? `${window.location.protocol}//${window.location.host}`
                : '';
            setUniversalLink(`${baseUrl}/profile/${profileId}`);
        } else {
            // Use current page URL as universal link
            setUniversalLink(typeof window !== 'undefined' ? window.location.href : '');
        }
    }, [profileId]);

    const handleOpenApp = () => {
        // App Store and Play Store URLs - temporarily using WhatsApp, will replace with Linkist app URLs later
        const appStoreUrl = 'https://apps.apple.com/app/whatsapp-messenger/id310633997';
        const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.whatsapp';

        if (!universalLink) {
            console.error('Universal link not available');
            return;
        }

        if (platform === 'ios' || platform === 'android') {
            // Try to open the app using universal link
            // On mobile, clicking a universal link will try to open the app
            // If the app is installed, it will open. If not, it stays on the web page.
            
            // Track if we should redirect to store
            let shouldRedirectToStore = true;
            const startTime = Date.now();
            
            // Try to open the universal link
            window.location.href = universalLink;
            
            // Use Page Visibility API to detect if app opened
            const handleVisibilityChange = () => {
                if (document.hidden) {
                    // Page became hidden, app likely opened
                    shouldRedirectToStore = false;
                }
            };
            
            document.addEventListener('visibilitychange', handleVisibilityChange);
            
            // Fallback: If page is still visible after timeout, redirect to store
            setTimeout(() => {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                
                // Check if page is still visible and enough time has passed
                if (shouldRedirectToStore && !document.hidden && Date.now() - startTime > 2000) {
                    if (platform === 'ios') {
                        window.location.href = appStoreUrl;
                    } else {
                        window.location.href = playStoreUrl;
                    }
                }
            }, 1000);
        } else {
            // Desktop - do nothing, button is disabled
            return;
        }
    };

    return (
        <button
            onClick={handleOpenApp}
            type="button"
            disabled={!isMobile}
            className={`btn-primary w-[268px] h-[48px] !rounded-[30px] opacity-100 pt-[12px] pr-[94px] pb-[12px] pl-[94px] flex items-center justify-center gap-[10px] ${
                !isMobile ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title={!isMobile ? 'Available only on mobile devices' : ''}
        >
            {isMobile ? 'Open App' : 'Available only on mobile'}
        </button>
    );
};