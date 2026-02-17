"use client";

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

// Timeline Item Component
interface TimelineItemProps {
    number: string;
    numberImage: string;
    icon: string;
    iconAlt: string;
    iconWidth: number;
    iconHeight: number;
    title: string;
    description?: string;
    titleFontWeight: number;
    descriptionFontWeight?: number;
    height: number;
    isLast?: boolean;
}

function TimelineItem({ numberImage, icon, iconAlt, iconWidth, iconHeight, title, description, titleFontWeight, descriptionFontWeight, height, isLast }: TimelineItemProps) {
    return (
        <div className="flex items-stretch" style={{ minHeight: `${height}px` }}>
            {/* Left side - Number and vertical line */}
            <div className="flex flex-col items-center mr-4 relative">
                {/* Number circle - 80x80 */}
                <div className="relative w-[80px] h-[80px] flex-shrink-0 z-10">
                    <Image
                        src={numberImage}
                        alt="Step number"
                        fill
                        className="object-contain"
                    />
                </div>
                {/* Vertical line connecting to next item */}
                {!isLast && (
                    <div
                        className="w-[4px] bg-[#F04438] absolute left-1/2 -translate-x-1/2"
                        style={{ top: '80px', bottom: '-40px' }}
                    />
                )}
            </div>

            {/* Right side - Icon and text, vertically centered to number */}
            <div className="flex-1 flex items-center gap-3">
                {/* Icon - centered with number */}
                <div className="flex items-center justify-center flex-shrink-0">
                    <Image
                        src={icon}
                        alt={iconAlt}
                        width={iconWidth}
                        height={iconHeight}
                        className="object-contain"
                    />
                </div>
                {/* Text - appears to the right of icon */}
                <p
                    className="text-white flex-1"
                    style={{
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: titleFontWeight,
                        fontSize: '16px',
                        lineHeight: '24px',
                        letterSpacing: '0%',
                    }}
                >
                    {title}
                    {description && (
                        <span
                            style={{
                                fontWeight: descriptionFontWeight || 400,
                            }}
                        >
                            {' '}{description}
                        </span>
                    )}
                </p>
            </div>
        </div>
    );
}

export default function WhyTimelineSection() {
    const timelineItems = [
        {
            number: '01',
            numberImage: '/number-1.png',
            icon: '/handshake.png',
            iconAlt: 'Handshake icon',
            iconWidth: 36,
            iconHeight: 33,
            title: 'Day 1: You meet potential leads.',
            description: undefined,
            titleFontWeight: 400,
            height: 100,
        },
        {
            number: '02',
            numberImage: '/Layer 11.png',
            icon: '/questionmark.png',
            iconAlt: 'Question mark icon',
            iconWidth: 40,
            iconHeight: 40,
            title: 'Day 7:',
            description: 'You forget what made them relevant.',
            titleFontWeight: 400,
            descriptionFontWeight: 400,
            height: 100,
        },
        {
            number: '03',
            numberImage: '/number-03.png',
            icon: '/spiral.png',
            iconAlt: 'Spiral icon',
            iconWidth: 40,
            iconHeight: 40,
            title: 'Day 30:',
            description: 'The lead goes cold after a low context, generic follow up.',
            titleFontWeight: 400,
            descriptionFontWeight: 400,
            height: 100,
        },
    ];

    return (
        <section className="relative pt-16 pb-16 md:pt-20 md:pb-20 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Mobile Layout */}
                <div className="lg:hidden flex flex-col items-center">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-6"
                    >
                        <span
                            className="inline-flex items-center justify-center"
                            style={{
                                fontFamily: 'Inter, sans-serif',
                                fontWeight: 500,
                                fontSize: '12px',
                                color: '#F04438',
                            }}
                        >
                            WHERE NETWORKING BREAKS
                        </span>
                    </motion.div>

                    {/* Heading - 350x72 with 24px gap */}
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-6 text-center text-[28px] leading-[34px] min-[390px]:text-[32px] min-[390px]:leading-[36px]"
                        style={{
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 500,
                            letterSpacing: '-0.02em',
                            maxWidth: '350px',
                            background: 'linear-gradient(180deg, #FFFFFF 25.5%, #999999 118.5%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}
                    >
                        The handshake is easy.
                        <br />
                        Remembering is hard.
                    </motion.h2>

                    {/* Mobile Timeline - Component based */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="relative w-full max-w-[350px]"
                    >
                        <div className="flex flex-col">
                            {timelineItems.map((item, index) => (
                                <TimelineItem
                                    key={item.number}
                                    {...item}
                                    isLast={index === timelineItems.length - 1}
                                />
                            ))}
                        </div>
                    </motion.div>

                    {/* Mobile CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mt-[42px]"
                    >
                        <Link href="https://www.linkist.ai/choose-plan" className="transition-transform hover:scale-105 active:scale-95">
                            <Image
                                src="/product-hunt-label-2.png"
                                alt="Join Linkist"
                                width={276}
                                height={62}
                                className="w-auto h-[48px] object-contain"
                            />
                        </Link>
                    </motion.div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden lg:grid lg:grid-cols-2 gap-16 items-start">
                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="sticky top-24"
                    >
                        {/* Badge */}
                        <div className="mb-8">
                            <span
                                className="inline-flex items-center justify-center"
                                style={{
                                    fontFamily: 'Inter, sans-serif',
                                    fontWeight: 500,
                                    fontSize: '12px',
                                    color: '#F04438',
                                }}
                            >
                                WHERE NETWORKING BREAKS
                            </span>
                        </div>

                        <h2 className="font-inter font-medium text-[56px] leading-[72px] tracking-[-0.04em] mb-8">
                            <span className="text-white whitespace-nowrap">The handshake is easy.</span>
                            <br />
                            <span className="text-[#888]">Remembering is hard.</span>
                        </h2>

                        {/* Desktop CTA */}
                        <Link href="https://www.linkist.ai/choose-plan" className="mt-[42px] inline-block transition-transform hover:scale-105 active:scale-95">
                            <Image
                                src="/product-hunt-label-2.png"
                                alt="Join Linkist"
                                width={276}
                                height={62}
                                className="w-auto h-[52px] object-contain"
                            />
                        </Link>
                    </motion.div>

                    {/* Right Timeline Visual - Component based */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative max-w-[450px]"
                    >
                        <div className="flex flex-col">
                            {timelineItems.map((item, index) => (
                                <TimelineItem
                                    key={item.number}
                                    {...item}
                                    isLast={index === timelineItems.length - 1}
                                />
                            ))}
                        </div>
                    </motion.div>
                </div>

            </div>
        </section>
    );
}
