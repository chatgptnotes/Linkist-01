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

            {/* Right side - Icon and text, aligned with number circle */}
            <div className="flex-1">
                {/* Icon - aligned horizontally with number circle */}
                <div className="flex items-center h-[80px] mb-0">
                    <Image
                        src={icon}
                        alt={iconAlt}
                        width={iconWidth}
                        height={iconHeight}
                        className="object-contain"
                    />
                </div>
                {/* Text */}
                <p
                    className="text-white -mt-4"
                    style={{
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: titleFontWeight,
                        fontSize: '20px',
                        lineHeight: '32px',
                        letterSpacing: '0%',
                    }}
                >
                    {title}
                    {description && (
                        <span
                            style={{
                                fontWeight: descriptionFontWeight || 600,
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
            title: 'Day 1: You Meet',
            description: undefined,
            titleFontWeight: 400,
            height: 140,
        },
        {
            number: '02',
            numberImage: '/number-02.png',
            icon: '/questionmark.png',
            iconAlt: 'Question mark icon',
            iconWidth: 40,
            iconHeight: 40,
            title: 'Day 7:',
            description: 'You forget what made them relevant.',
            titleFontWeight: 400,
            descriptionFontWeight: 400,
            height: 140,
        },
        {
            number: '03',
            numberImage: '/number-03.png',
            icon: '/spiral.png',
            iconAlt: 'Spiral icon',
            iconWidth: 40,
            iconHeight: 40,
            title: 'Day 30:',
            description: 'The lead goes cold after a generic, low-context follow-up.',
            titleFontWeight: 400,
            descriptionFontWeight: 400,
            height: 140,
        },
    ];

    return (
        <section className="relative pt-12 pb-12 overflow-hidden">
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
                            className="inline-flex items-center justify-center px-5 py-2 rounded-full border-2 border-[#F04438] bg-[#1a0a09]"
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
                        className="mb-6 text-center"
                        style={{
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 500,
                            fontSize: '32px',
                            lineHeight: '36px',
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
                        <Link href="/choose-plan" className="transition-transform hover:scale-105 active:scale-95">
                            <Image
                                src="/joinbutton.png"
                                alt="Join Linkist"
                                width={200}
                                height={52}
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
                                className="inline-flex items-center justify-center px-6 py-2.5 rounded-full border-2 border-[#F04438] bg-[#1a0a09]"
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

                        <h2 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
                            <span className="text-white">The handshake is easy.</span>
                            <br />
                            <span className="text-[#888]">Remembering is hard.</span>
                        </h2>

                        <p className="text-[#888] leading-relaxed max-w-md font-body">
                            You don't lose opportunities because you run out of business cards. You lose them when you lose context, timing, and recall.
                        </p>

                        {/* Desktop CTA */}
                        <Link href="/choose-plan" className="mt-[42px] inline-block transition-transform hover:scale-105 active:scale-95">
                            <Image
                                src="/joinbutton.png"
                                alt="Join Linkist"
                                width={220}
                                height={56}
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
