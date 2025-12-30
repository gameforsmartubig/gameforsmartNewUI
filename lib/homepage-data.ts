// Static data for homepage - can be imported by Server Components
// This separates data from client-side logic for better SSR/SSG

export const featuredCarouselData = [
  {
    id: 1,
    title: "Real-time Multiplayer",
    subtitle: "Interactive Experience",
    description:
      "Join live quiz sessions with players from around the world. Experience real-time competition with instant results and dynamic leaderboards.",
    videoSrc: "/videos/multiplayer-demo.mp4",
    mockupImage: "/images/mockup-multiplayer.png",
    bgGradient: "from-blue-500 to-cyan-500",
    icon: "👥",
  },
  {
    id: 2,
    title: "AI-Powered Questions",
    subtitle: "Smart Generation",
    description:
      "Our advanced AI generates personalized questions based on your learning progress and difficulty preferences for optimal learning.",
    videoSrc: "/videos/ai-demo.mp4",
    mockupImage: "/images/mockup-ai.png",
    bgGradient: "from-purple-500 to-pink-500",
    icon: "🤖",
  },
  {
    id: 3,
    title: "Analytics Dashboard",
    subtitle: "Performance Tracking",
    description:
      "Track your learning journey with detailed analytics, progress reports, and performance insights to improve your knowledge.",
    videoSrc: "/videos/analytics-demo.mp4",
    mockupImage: "/images/mockup-analytics.png",
    bgGradient: "from-green-500 to-emerald-500",
    icon: "📊",
  },
  {
    id: 4,
    title: "Customizable Themes",
    subtitle: "Personal Experience",
    description:
      "Customize your quiz experience with beautiful themes, colors, and layouts that match your personal style and preferences.",
    videoSrc: "/videos/themes-demo.mp4",
    mockupImage: "/images/mockup-themes.png",
    bgGradient: "from-orange-500 to-red-500",
    icon: "🎨",
  },
];

export const heroStats = [
  {
    value: "100+",
    labelKey: "hero.stats.activeUsers",
    color: "blue",
  },
  {
    value: "50+",
    labelKey: "hero.stats.quizzesCreated",
    color: "purple",
  },
  {
    value: "200+",
    labelKey: "hero.stats.gamesPlayed",
    color: "green",
  },
];

export const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "GameForSmart",
  description:
    "Interactive quiz platform for creating and playing educational games with AI-powered question generation",
  url: "https://gameforsmart.vercel.app",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web Browser",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  creator: {
    "@type": "Organization",
    name: "GameForSmart Team",
  },
  featureList: [
    "AI-powered quiz generation",
    "Multiplayer quiz games",
    "Real-time collaboration",
    "Analytics and reporting",
    "Customizable quiz templates",
  ],
};

