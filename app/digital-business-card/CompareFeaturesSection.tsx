'use client';

import { useState } from 'react';

const COMPARE_FEATURES = [
  { name: 'Digital Profile', starter: true, next: true, pro: true, signature: true, founder: true, isHeader: true },
  { name: 'Unique ID link (for life)', starter: true, next: true, pro: true, signature: true, founder: true },
  { name: 'Instant Share (QR, URL)', starter: true, next: true, pro: true, signature: true, founder: true },
  { name: 'Multiple Profile themes', starter: true, next: true, pro: true, signature: true, founder: true },
  { name: 'Customisable rich details', starter: true, next: true, pro: true, signature: true, founder: true },

  { name: 'Digital Smart Card', starter: false, next: false, pro: true, signature: true, founder: true, isHeader: true },
  { name: 'Linkist branded card', starter: false, next: false, pro: true, signature: true, founder: true },
  { name: 'Multiple base materials', starter: false, next: false, pro: true, signature: true, founder: true },
  { name: 'Various colour ways', starter: false, next: false, pro: true, signature: true, founder: true },
  { name: 'Tap to share', starter: false, next: false, pro: true, signature: true, founder: true },
  { name: 'Special Edition Designs', starter: false, next: false, pro: false, signature: true, founder: true },

  { name: 'Card Personalisation', starter: false, next: false, pro: false, signature: true, founder: true, isHeader: true },
  { name: 'Name', starter: false, next: false, pro: false, signature: true, founder: true },
  { name: 'Company Logo', starter: false, next: false, pro: false, signature: true, founder: true },
  { name: 'Remove Linkist Logo', starter: false, next: false, pro: false, signature: false, founder: true },

  { name: 'Linkist Pro App', starter: false, next: true, pro: true, signature: true, founder: true, isHeader: true },
  { name: 'Multiple digital profiles', starter: false, next: true, pro: true, signature: true, founder: true },
  { name: 'Business card scanning', starter: false, next: true, pro: true, signature: true, founder: true },
  { name: 'Enhanced address book', starter: false, next: true, pro: true, signature: true, founder: true },
  { name: 'Contacts enrichment', starter: false, next: true, pro: true, signature: true, founder: true },
  { name: 'Network strength score', starter: false, next: true, pro: true, signature: true, founder: true },
  { name: 'ICP definition and match', starter: false, next: true, pro: true, signature: true, founder: true },
  { name: 'Priority Contacts', starter: false, next: true, pro: true, signature: true, founder: true },
  { name: 'Tags, Notes, Groups', starter: false, next: true, pro: true, signature: true, founder: true },
  { name: 'Intelligent actionable nudges', starter: false, next: true, pro: true, signature: true, founder: true },
  { name: 'Contact matchmaking', starter: false, next: true, pro: true, signature: true, founder: true },
  { name: 'AI credits (worth $50)', starter: false, next: true, pro: true, signature: true, founder: true },
  { name: '1 year Pro App subscription (worth $99)', starter: false, next: true, pro: true, signature: true, founder: true },
  { name: 'More (Coming Soon)', starter: false, next: true, pro: true, signature: true, founder: true },

  { name: 'Founding Member Benefits', starter: false, next: false, pro: false, signature: false, founder: true, isHeader: true },
  { name: 'Founding Member status', starter: false, next: false, pro: false, signature: false, founder: true },
  { name: 'Exclusive black designer card', starter: false, next: false, pro: false, signature: false, founder: true },
  { name: 'No expiry (AI credits)', starter: false, next: false, pro: false, signature: false, founder: true },
  { name: 'Up to 3 founding member invites', starter: false, next: false, pro: false, signature: false, founder: true },
  { name: 'Linkist partner privileges', starter: false, next: false, pro: false, signature: false, founder: true },
];

export default function CompareFeatures() {
  const [showAll, setShowAll] = useState(false);
  const displayFeatures = showAll ? COMPARE_FEATURES : COMPARE_FEATURES.slice(0, 5);

  return (
    <section className="w-full bg-black py-12 md:py-20 text-white overflow-hidden font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        
        .font-poppins {
            font-family: 'Poppins', sans-serif;
        }
      `}} />
      
      <div className="w-full lg:w-[75vw] mx-auto px-6">
        
        {/* Header styling */}
        <div className="text-center max-w-3xl mx-auto mb-6 md:mb-10 px-4 relative z-20">
          <div className="mb-6 flex justify-center">
            <span className="text-[#FF3A29] text-sm md:text-base font-medium uppercase tracking-wider font-poppins">
              Compare Features
            </span>
          </div>
          <h2 className="text-[32px] md:text-[56px] font-bold text-white tracking-tight leading-[1.1] mb-6 font-poppins">
            See exactly what's included in every plan.
          </h2>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0A0A0A] no-scrollbar shadow-2xl transition-all duration-500">
          <table className="w-full text-left border-collapse min-w-[800px] font-poppins">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 bg-[#0A0A0A] py-3 px-4 text-xs md:text-sm font-semibold text-gray-400 border-b border-r border-white/10 w-[30%] shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
                  Features
                </th>
                {['Starter', 'Next', 'Pro', 'Signature', "Founder's Circle"].map((plan) => (
                  <th key={plan} className="py-3 px-4 text-center text-xs md:text-sm font-semibold text-white border-b border-white/10 w-[14%]">
                    {plan}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayFeatures.map((row, idx) => (
                <tr key={idx} className="group hover:bg-[#111] transition-colors">
                  <td className={`sticky left-0 z-10 bg-[#0A0A0A] group-hover:bg-[#111] py-2 px-4 text-xs md:text-sm border-b border-r border-white/10 shadow-[4px_0_12px_rgba(0,0,0,0.5)] transition-colors ${row.isHeader ? 'font-semibold text-white pt-5' : 'text-gray-300'}`}>
                    {row.name}
                  </td>
                  {[row.starter, row.next, row.pro, row.signature, row.founder].map((val, i) => (
                    <td key={i} className={`py-2 px-4 text-center border-b border-white/10 ${row.isHeader ? 'pt-5' : ''}`}>
                      {val ? (
                        <div className="flex justify-center items-center">
                          <svg className="w-[14px] h-[14px] text-[#FF3A29]" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                        </div>
                      ) : (
                        <span className="text-gray-600 font-medium">-</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}

              {/* View More / Less Toggle Row */}
              <tr 
                onClick={() => setShowAll(!showAll)}
                className="group hover:bg-[#111] transition-colors cursor-pointer"
              >
                <td className="sticky left-0 z-10 bg-[#0A0A0A] group-hover:bg-[#111] py-2 px-4 text-xs md:text-sm border-b border-r border-white/10 shadow-[4px_0_12px_rgba(0,0,0,0.5)] transition-colors">
                  <div className="flex items-center gap-2 text-[#FF3A29] font-semibold">
                    {showAll ? 'View Less' : 'View All Features'}
                    <svg className={`w-4 h-4 transition-transform duration-300 ${showAll ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </td>
                <td colSpan={5} className="py-2 px-4 border-b border-white/10 bg-[#0A0A0A] group-hover:bg-[#111] transition-colors"></td>
              </tr>

              {/* Action Buttons Row */}
              <tr>
                <td className="sticky left-0 z-10 bg-[#0A0A0A] py-3 px-4 border-r border-white/10 shadow-[4px_0_12px_rgba(0,0,0,0.5)]"></td>
                {['Starter', 'Next', 'Pro', 'Signature', "Founder's Circle"].map((plan, i) => (
                  <td key={plan} className="py-3 pt-5 pb-5 px-4">
                    <a
                      href="https://linkist.ai/choose-plan"
                      className={`flex items-center justify-center gap-2 w-full max-w-[160px] mx-auto py-2 px-3 rounded-lg font-semibold text-xs transition-all duration-300 no-underline ${
                        i === 2
                          ? 'bg-[#FF3A29] text-white shadow-[0_4px_14px_rgba(255,58,41,0.3)] hover:bg-[#e8321f]'
                          : 'bg-[#FF3A29]/15 text-[#FF3A29] hover:bg-[#FF3A29] hover:text-white'
                      }`}
                    >
                      Get Started
                      <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 12h16M13 5l7 7-7 7" />
                      </svg>
                    </a>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
