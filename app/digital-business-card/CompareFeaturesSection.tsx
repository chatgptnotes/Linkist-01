'use client';

import { useState } from 'react';

const COMPARE_FEATURES = [
  { name: 'Digital Profile', starter: true, business: true, signature: true, founder: true, isHeader: true },
  { name: 'Unique ID link (for life)', starter: true, business: true, signature: true, founder: true },
  { name: 'Instant Share (QR, URL)', starter: true, business: true, signature: true, founder: true },
  { name: 'Multiple Profile themes', starter: true, business: true, signature: true, founder: true },
  { name: 'Customisable rich details', starter: true, business: true, signature: true, founder: true },
  { name: 'Link your social platforms', starter: true, business: true, signature: true, founder: true },
  { name: 'Add your services', starter: true, business: true, signature: true, founder: true },
  { name: 'Add Certifications', starter: true, business: true, signature: true, founder: true },
  { name: 'Update anytime', starter: true, business: true, signature: true, founder: true },

  { name: 'Digital Smart Card', starter: false, business: true, signature: true, founder: true, isHeader: true },
  { name: 'Linkist branded card', starter: false, business: true, signature: true, founder: true },
  { name: 'Multiple base materials', starter: false, business: true, signature: true, founder: true },
  { name: 'Various colour ways', starter: false, business: true, signature: true, founder: true },
  { name: 'Tap to share', starter: false, business: true, signature: true, founder: true },
  { name: 'Multiple Designs', starter: false, business: true, signature: true, founder: true },

  { name: 'Card Personalisation', starter: false, business: false, signature: true, founder: true, isHeader: true },
  { name: 'Name', starter: false, business: false, signature: true, founder: true },
  { name: 'Company Logo', starter: false, business: false, signature: true, founder: true },
  { name: 'Remove Linkist Logo', starter: false, business: false, signature: false, founder: true },

  { name: 'Linkist Pro App', starter: false, business: true, signature: true, founder: true, isHeader: true },
  { name: 'Multiple digital profiles', starter: false, business: true, signature: true, founder: true },
  { name: 'Business card scanning', starter: false, business: true, signature: true, founder: true },
  { name: 'Enchanced address book', starter: false, business: true, signature: true, founder: true },
  { name: 'Contacts enrichment', starter: false, business: true, signature: true, founder: true },
  { name: 'Network strength score', starter: false, business: true, signature: true, founder: true },
  { name: 'ICP definition and match', starter: false, business: true, signature: true, founder: true },
  { name: 'Priority Contacts', starter: false, business: true, signature: true, founder: true },
  { name: 'Tags, Notes, Groups', starter: false, business: true, signature: true, founder: true },
  { name: 'Intelligent actionable nudges', starter: false, business: true, signature: true, founder: true },
  { name: 'Contact matchmaking', starter: false, business: true, signature: true, founder: true },
  { name: '1 year Pro App subscription', starter: false, business: true, signature: true, founder: true },

  { name: 'Founding Member Benefits', starter: false, business: false, signature: false, founder: true, isHeader: true },
  { name: 'Founding Member status', starter: false, business: false, signature: false, founder: true },
  { name: 'No expiry (AI credits)', starter: false, business: false, signature: false, founder: true },
  { name: 'Upto 3 founding member invites', starter: false, business: false, signature: false, founder: true },
  { name: 'Linkist partner privileges', starter: false, business: false, signature: false, founder: true },
  { name: 'Lifetime Pro App subscription', starter: false, business: false, signature: false, founder: true },
  { name: 'AI credits (worth $50)', starter: false, business: false, signature: false, founder: true },
];

export default function CompareFeatures() {
  const [showAll, setShowAll] = useState(false);
  const displayFeatures = showAll ? COMPARE_FEATURES : COMPARE_FEATURES.slice(0, 5);

  return (
    <section className="w-full bg-black py-12 md:py-20 text-white font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap');
        
        .font-poppins {
            font-family: 'Poppins', sans-serif;
        }
        .font-roboto {
          font-family: 'Roboto', sans-serif;
        }
        .compare-table-sticky {
          position: sticky;
          left: 0;
          background-color: #0A0A0A;
          z-index: 20;
          isolation: isolate;
        }
        .compare-table-sticky::after {
          content: '';
          position: absolute;
          top: 0;
          right: -1px;
          bottom: 0;
          width: 1px;
          background: rgba(255,255,255,0.1);
        }
        tr:hover .compare-table-sticky {
          background-color: #111111;
        }
      `}} />
      
      <div className="w-full lg:w-[75vw] mx-auto px-6">
        
        {/* Header styling */}
        <div className="text-center max-w-3xl mx-auto mb-6 md:mb-10 px-4 relative z-20">
          <div className="mb-6 flex justify-center">
            <span className="text-[#FF3A29] text-sm md:text-base font-medium uppercase tracking-wider">
              Compare Features
            </span>
          </div>
          <h2
            className="text-[28px] leading-[34px] min-[390px]:text-[32px] min-[390px]:leading-[38px] md:text-[52px] md:leading-[66px] font-medium font-inter tracking-[-0.04em] text-center md:text-center mb-6"
            style={{
              background: 'linear-gradient(180deg, #FFFFFF 25.5%, #999999 118.5%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            See exactly what&apos;s included in every plan
          </h2>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0A0A0A] no-scrollbar shadow-2xl transition-all duration-500">
          <table className="w-full text-left border-collapse min-w-[600px] font-poppins">
            <thead>
              <tr>
                <th className="compare-table-sticky py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-400 border-b w-[35vw] md:w-auto">
                  Features
                </th>
                {['Starter', 'Business', 'Signature', "Founder's Circle"].map((plan) => (
                  <th key={plan} className="py-3 px-4 text-center text-xs md:text-sm font-semibold text-white border-b border-white/10 min-w-[80px] md:min-w-[120px]">
                    {plan}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayFeatures.map((row, idx) => (
                <tr key={idx} className="group hover:bg-[#111] transition-colors">
                  <td className={`compare-table-sticky py-2 px-2 md:px-4 text-xs md:text-sm border-b font-roboto w-[35vw] md:w-auto ${row.isHeader ? 'font-semibold text-[#FF3A29] pt-5' : 'text-gray-300'}`}>
                    {row.name}
                  </td>
                  {[row.starter, row.business, row.signature, row.founder].map((val, i) => (
                    <td key={i} className={`py-2 px-4 text-center border-b border-white/10 font-roboto ${row.isHeader ? 'pt-5' : ''}`}>
                      {!row.isHeader && val ? (
                        <div className="flex justify-center items-center">
                          <svg className="w-[14px] h-[14px] text-[#FF3A29]" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                        </div>
                      ) : !row.isHeader ? (
                        <span className="text-gray-600 font-medium">-</span>
                      ) : null}
                    </td>
                  ))}
                </tr>
              ))}

              {/* View More / Less Toggle Row */}
              <tr 
                onClick={() => setShowAll(!showAll)}
                className="group hover:bg-[#111] transition-colors cursor-pointer"
              >
                <td className="compare-table-sticky py-2 px-2 md:px-4 text-xs md:text-sm border-b">
                  <div className="flex items-center gap-2 text-[#FF3A29] font-semibold">
                    {showAll ? 'View Less' : 'View All Features'}
                    <svg className={`w-4 h-4 transition-transform duration-300 ${showAll ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </td>
                <td colSpan={4} className="py-2 px-4 border-b border-white/10 bg-[#0A0A0A] group-hover:bg-[#111] transition-colors"></td>
              </tr>

              {/* Action Buttons Row */}
              <tr>
                <td className="compare-table-sticky py-3 px-2 md:px-4"></td>
                {['Starter', 'Business', 'Signature', "Founder's Circle"].map((plan, i) => (
                  <td key={plan} className="py-3 pt-5 pb-5 px-4">
                    <a
                      href="https://linkist.ai/choose-plan"
                      className={`block w-full max-w-[160px] mx-auto py-2 px-3 rounded-lg font-semibold text-xs text-center transition-all duration-300 no-underline whitespace-nowrap ${
                        i === 1
                          ? 'bg-[#FF3A29] text-white shadow-[0_4px_14px_rgba(255,58,41,0.3)] hover:bg-[#e8321f]'
                          : 'bg-[#FF3A29]/15 text-[#FF3A29] hover:bg-[#FF3A29] hover:text-white'
                      }`}
                    >
                      See How Linkist Fixes This
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
