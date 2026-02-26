/**
 * Skills & Expertise Taxonomy for Linkist
 * Comprehensive list of professional skills organized by category
 */

export interface SkillCategory {
  name: string;
  skills: string[];
}

export const SKILLS_BY_CATEGORY: SkillCategory[] = [
  {
    name: "Business & Management",
    skills: [
      "Business Development",
      "Strategic Planning",
      "Leadership & Team Management",
      "Operations Management",
      "Project Management",
      "Change Management",
      "Process Optimization",
      "Product Management",
      "Risk Analysis",
      "Negotiation",
      "Business Analytics",
      "Market Research",
      "Supply Chain Management",
      "Financial Planning",
      "Stakeholder Management",
      "Corporate Governance",
      "Mergers & Acquisitions",
      "Budgeting & Forecasting",
      "Crisis Management",
      "Organizational Development",
      "Vendor Management",
      "Revenue Management",
      "Lean Management",
      "Cross-functional Leadership",
      "Workforce Planning",
    ],
  },
  {
    name: "Sales & Marketing",
    skills: [
      "Sales Strategy",
      "B2B Sales",
      "Client Relationship Management (CRM)",
      "Account Management",
      "Brand Management",
      "Digital Marketing",
      "Social Media Strategy",
      "Performance Marketing (Google/Meta Ads)",
      "SEO/SEM",
      "Marketing Automation",
      "Content Strategy",
      "Copywriting",
      "Influencer Marketing",
      "Lead Generation",
      "Public Relations",
      "Email Marketing",
      "Affiliate Marketing",
      "Conversion Rate Optimization",
      "Marketing Analytics",
      "Event Marketing",
      "Product Marketing",
      "Partnership Marketing",
      "Customer Acquisition",
      "Retention Marketing",
      "Demand Generation",
    ],
  },
  {
    name: "Technology & Engineering",
    skills: [
      "Software Development",
      "Web Development",
      "Mobile App Development",
      "Cloud Computing (AWS, Azure, GCP)",
      "DevOps",
      "Cybersecurity",
      "AI & Machine Learning",
      "Data Science",
      "Database Management",
      "Blockchain",
      "Internet of Things (IoT)",
      "UI/UX Design",
      "API Development",
      "System Architecture",
      "Edge Computing",
      "Quantum Computing",
      "AR / VR Development",
      "Microservices Architecture",
      "CI/CD Pipeline Management",
      "Site Reliability Engineering",
      "Low-Code / No-Code Platforms",
      "Embedded Systems",
      "Natural Language Processing",
      "Computer Vision",
    ],
  },
  {
    name: "Data & Analytics",
    skills: [
      "Data Analysis",
      "Business Intelligence",
      "Predictive Analytics",
      "Data Visualization",
      "SQL / Python for Data",
      "Power BI / Tableau",
      "A/B Testing",
      "Data Engineering",
      "Customer Analytics",
      "Market Intelligence",
      "Statistical Modeling",
      "Data Warehousing",
      "ETL Processes",
      "Real-Time Analytics",
      "Geospatial Analytics",
      "Sentiment Analysis",
      "Revenue Analytics",
      "Data Governance",
      "Big Data Technologies (Hadoop/Spark)",
      "Data Storytelling",
    ],
  },
  {
    name: "Creative & Design",
    skills: [
      "Graphic Design",
      "Brand Identity Design",
      "Motion Graphics",
      "Video Editing",
      "Animation",
      "Photography",
      "UI Design",
      "UX Research",
      "3D Design",
      "Product Visualization",
      "Art Direction",
      "Creative Strategy",
      "Typography",
      "Illustration",
      "Storyboarding",
      "Sound Design",
      "Interactive Design",
      "Packaging Design",
      "Environmental / Spatial Design",
      "Design Thinking",
      "Print Design",
      "Color Theory & Branding",
    ],
  },
  {
    name: "Communication & Public Relations",
    skills: [
      "Corporate Communication",
      "Public Speaking",
      "Copywriting",
      "Media Relations",
      "Internal Communications",
      "Presentation Skills",
      "Brand Storytelling",
      "Event Planning",
      "Crisis Communication",
      "Thought Leadership",
      "Reputation Management",
      "Press Release Writing",
      "Stakeholder Communication",
      "Community Engagement",
      "Podcast Hosting",
      "Government Relations",
      "Speech Writing",
      "Media Training",
    ],
  },
  {
    name: "Networking & Relationship Building",
    skills: [
      "Partnership Development",
      "Community Building",
      "Networking Strategy",
      "Event Networking",
      "Investor Relations",
      "Client Retention",
      "Collaboration Management",
      "Cross-functional Collaboration",
      "Strategic Alliances",
      "Ecosystem Development",
      "Mentorship Programs",
      "Alumni Network Management",
      "Referral Programs",
      "Influencer Relationship Management",
      "Stakeholder Engagement",
      "Industry Association Leadership",
      "Advisory Board Management",
    ],
  },
  {
    name: "Entrepreneurship & Innovation",
    skills: [
      "Startup Strategy",
      "Fundraising & Pitching",
      "Innovation Management",
      "Venture Building",
      "Product-Market Fit Analysis",
      "Scaling Strategy",
      "Go-to-Market Planning",
      "Business Model Canvas",
      "Lean Methodology",
      "Bootstrapping",
      "Intellectual Property Strategy",
      "MVP Development",
      "Growth Hacking",
      "Pivot Strategy",
      "Competitive Analysis",
      "Market Validation",
      "Angel Investing",
    ],
  },
  {
    name: "Industry Expertise",
    skills: [
      "Finance & Banking",
      "Real Estate",
      "Healthcare",
      "Education",
      "Retail & E-commerce",
      "Energy & Sustainability",
      "Logistics & Supply Chain",
      "Manufacturing",
      "Technology",
      "Media & Entertainment",
      "Legal & Compliance",
      "Automotive",
      "Aerospace & Defense",
      "Pharmaceuticals",
      "Insurance",
      "Fashion & Luxury",
      "Food & Beverage",
      "Sports & Fitness",
      "Mining & Metals",
      "Consulting",
    ],
  },
  {
    name: "AI-Specific & Future Skills",
    skills: [
      "Generative AI",
      "AI Prompt Engineering",
      "Automation Strategy",
      "Chatbot Design",
      "Data Ethics & Governance",
      "AI-Driven Marketing",
      "Predictive Personalization",
      "AI-Powered CRM Tools",
      "Computer Vision Applications",
      "Reinforcement Learning",
      "AI Ethics & Responsible AI",
      "Large Language Models (LLMs)",
      "AI Agent Development",
      "MLOps",
      "Synthetic Data Generation",
      "AI-Powered Analytics",
      "Conversational AI",
      "AI Strategy & Roadmapping",
    ],
  },
  {
    name: "Soft Skills",
    skills: [
      "Leadership",
      "Teamwork",
      "Adaptability",
      "Emotional Intelligence",
      "Creativity",
      "Problem Solving",
      "Time Management",
      "Decision Making",
      "Empathy",
      "Mentorship",
      "Conflict Resolution",
      "Critical Thinking",
      "Resilience",
      "Cultural Awareness",
      "Active Listening",
      "Growth Mindset",
      "Stress Management",
      "Persuasion & Influence",
      "Self-Motivation",
      "Accountability",
    ],
  },
];

// Flat array of all skills for quick search
export const ALL_SKILLS: string[] = SKILLS_BY_CATEGORY.flatMap(
  (category) => category.skills
);

// Helper function to search skills
export function searchSkills(query: string): Array<{ skill: string; category: string }> {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase().trim();
  const results: Array<{ skill: string; category: string }> = [];

  SKILLS_BY_CATEGORY.forEach((category) => {
    category.skills.forEach((skill) => {
      if (skill.toLowerCase().includes(lowerQuery)) {
        results.push({ skill, category: category.name });
      }
    });
  });

  return results;
}

// Helper to get category for a skill
export function getSkillCategory(skillName: string): string | null {
  for (const category of SKILLS_BY_CATEGORY) {
    if (category.skills.includes(skillName)) {
      return category.name;
    }
  }
  return null;
}
