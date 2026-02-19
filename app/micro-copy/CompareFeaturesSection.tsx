'use client';

const COMPARE_FEATURES = [
  { name: 'Digital Profile', starter: true, next: true, pro: true, founder: true },
  { name: 'Unique ID link (for life)', starter: true, next: true, pro: true, founder: true },
  { name: 'Instant Share (QR, URL)', starter: true, next: true, pro: true, founder: true },
  { name: 'Linkist Pro App (1 year)', starter: false, next: true, pro: true, founder: true },
  { name: 'AI Credits ($50, 1-yr validity)', starter: false, next: true, pro: true, founder: true },
  { name: 'Smart Card Customisation', starter: false, next: false, pro: false, founder: true },
  { name: 'Founding Member Badge', starter: false, next: false, pro: false, founder: true },
  { name: 'Referral Invites (up to 3)', starter: false, next: false, pro: false, founder: true },
  { name: 'Linkist Partner Privileges', starter: false, next: false, pro: false, founder: true },
];

const PLAN_COLUMNS = [
  { key: 'starter', label: 'Starter' },
  { key: 'next', label: 'Next' },
  { key: 'pro', label: 'Pro' },
  { key: 'founder', label: "Founder's Circle" },
] as const;

type PlanKey = typeof PLAN_COLUMNS[number]['key'];

function CheckIcon() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 18,
        height: 18,
        borderRadius: '50%',
        border: '1.5px solid rgba(255,255,255,0.4)',
        fontSize: 10,
        color: 'rgba(255,255,255,0.85)',
        flexShrink: 0,
      }}
    >
      ✓
    </span>
  );
}

function DashIcon() {
  return (
    <span className="text-white/20 text-base font-medium">—</span>
  );
}

export default function CompareFeaturesSection() {
  return (
    <section className="bg-black w-full">
      <div className="w-full lg:w-[75vw] mx-auto px-6 py-16 md:py-24">

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-12 md:mb-16">
          <div className="mb-4">
            <span className="text-[#ff0000] text-sm md:text-base font-medium">
              Compare Plans
            </span>
          </div>
          <h2 className="text-[32px] md:text-[56px] font-bold text-white tracking-tight leading-[1.1]">
            Compare all features
          </h2>
        </div>

        {/* Table Container */}
        <div
          className="rounded-3xl overflow-x-auto"
          style={{ background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <table className="w-full min-w-[520px] border-collapse">
            <thead>
              <tr>
                <th className="text-left text-white/50 text-xs font-semibold uppercase tracking-wider py-5 px-6 w-[40%]">
                  Feature
                </th>
                {PLAN_COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className="text-center text-white text-sm font-semibold py-5 px-3"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_FEATURES.map((row, idx) => (
                <tr
                  key={row.name}
                  style={{
                    background: idx % 2 === 1 ? 'rgba(255,255,255,0.02)' : 'transparent',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <td className="text-white/80 text-sm py-4 px-6 font-medium">
                    {row.name}
                  </td>
                  {PLAN_COLUMNS.map((col) => (
                    <td key={col.key} className="text-center py-4 px-3">
                      {row[col.key as PlanKey] ? <CheckIcon /> : <DashIcon />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </section>
  );
}
