import { useMemo, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import TiltedIconCard from "../components/ui/TiltedIconCard";
import SpotlightCard from "../components/ui/SpotlightCard";
import SplitText from "../components/ui/SplitText";
import RotatingText from "../components/ui/RotatingText";
import FaqModal from "../components/ui/FaqModal";
import RatingButton from "../components/ui/RatingButton";
import "./LandingPage.css";

const HERO_STATS = [
  { value: "500+", label: "Active Users" },
  { value: "10K+", label: "Connections Made" },
  { value: "95%", label: "Match Success" }
];

const ORBIT_NODES = [
  { angle: 0, delay: 0.5, accent: "primary" as const },
  { angle: 90, delay: 1, accent: "secondary" as const },
  { angle: 180, delay: 1.5, accent: "primary" as const },
  { angle: 270, delay: 2, accent: "secondary" as const }
];

const FEATURES = [
  {
    icon: "psychology",
    title: "AI-Powered Matching",
    description:
      "Our proprietary algorithm analyzes skills, goals, and values to find your highest-synergy collaboration opportunities in seconds."
  },
  {
    icon: "tune",
    title: "Smart Filtering",
    description:
      "Refine your network with adaptive filters across domain expertise, startup intent, and role alignment for relevant conversations."
  },
  {
    icon: "mail",
    title: "Instant Introductions",
    description:
      "Generate context-aware AI intros that break the ice instantly and convert mutual interest into meaningful interaction."
  },
  {
    icon: "people",
    title: "Build Your Network",
    description:
      "Track and nurture high-value connections with a premium relationship flow built for founders, builders, and operators."
  }
];

const FAQS = [
  {
    question: "How does MATCH3's AI matching work?",
    answer:
      "MATCH3 uses advanced AI algorithms to analyze your skills, goals, and values. We compare your profile with thousands of other users to find the highest-synergy collaboration opportunities in the Web3 ecosystem."
  },
  {
    question: "Is my data secure on MATCH3?",
    answer:
      "Absolutely. We use blockchain technology to ensure your data is encrypted and decentralized. Your information is never shared without your explicit consent, and you maintain full control over your profile."
  },
  {
    question: "How do I connect my Web3 wallet?",
    answer:
      "Simply click the Connect Wallet button in the navigation bar. We support MetaMask and other popular Web3 wallets. Your wallet connection is used for identity verification and secure transactions."
  },
  {
    question: "Can I use MATCH3 for free?",
    answer:
      "Yes. MATCH3 offers a free tier that includes basic matching features. Premium plans with advanced filters, unlimited connections, and priority support are available for power users."
  },
  {
    question: "What types of connections can I find?",
    answer:
      "MATCH3 helps you find co-founders, investors, developers, marketers, and other Web3 professionals. Our AI matches you based on complementary skills and shared goals."
  },
  {
    question: "How do I improve my match quality?",
    answer:
      "Complete your profile with detailed information about your skills, experience, and goals. The more information you provide, the better our AI can match you with relevant connections."
  }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const connectionLines = useMemo(() => {
    const centerX = 300;
    const centerY = 300;
    const distance = 150;

    return ORBIT_NODES.map((node) => {
      const radians = (node.angle * Math.PI) / 180;
      return {
        angle: node.angle,
        x: centerX + distance * Math.cos(radians),
        y: centerY + distance * Math.sin(radians)
      };
    });
  }, []);

  const navigateToRegister = () => navigate("/register");

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="landing-page">
      <nav className="landing-fixed-nav" id="landing-nav">
        <div className="landing-nav-backdrop">
          <div className="landing-shell landing-nav-inner">
            <div className="landing-brand" onClick={() => navigate("/")}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  navigate("/");
                }
              }}
            >
              MATCH
              <RotatingText
                texts={["NETWORK", "CONNECT", "BUILD", "LINK", "GROW"]}
                mainClassName="landing-rotating-text landing-rotating-text--header"
                splitLevelClassName="landing-rotating-split"
                elementLevelClassName="landing-rotating-element landing-rotating-element--header"
                rotationInterval={2500}
                staggerDuration={0.03}
                staggerFrom="last"
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
              />
            </div>
            <button onClick={navigateToRegister} className="landing-button landing-button--primary">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <section className="landing-hero-section">
        <div className="landing-video-background">
          <video autoPlay loop muted playsInline className="landing-video-element">
            <source src="/assets/landing-video.mp4" type="video/mp4" />
          </video>
          <div className="landing-video-dim" />
        </div>

        <div className="landing-orb landing-orb--one" />
        <div className="landing-orb landing-orb--two" />

        <div className="landing-shell landing-hero-grid">
          <div className="landing-hero-copy">
            <SplitText
              text="Find Your Perfect Match"
              tag="h1"
              className="landing-title"
              delay={50}
              duration={0.8}
              splitType="chars"
              from={{ opacity: 0, y: 50 }}
              to={{ opacity: 1, y: 0 }}
              textAlign="left"
            />
            <p className="landing-subtitle">AI-Powered Networking for Web3 Builders</p>
            <p className="landing-description">
              Discover meaningful connections in seconds using cutting-edge AI. MATCH3 analyzes skills, goals, and
              values to connect you with the right people in the startup ecosystem.
            </p>

            <div className="landing-actions">
              <button onClick={navigateToRegister} className="landing-button landing-button--primary landing-button--large">
                Get Started
              </button>
              <button onClick={scrollToFeatures} className="landing-button landing-button--ghost landing-button--large">
                Learn More
              </button>
            </div>

            <div className="landing-stats">
              {HERO_STATS.map((stat, index) => (
                <div key={stat.label} className="landing-stat-block">
                  <div className="landing-stat-value">{stat.value}</div>
                  <p className="landing-stat-label">{stat.label}</p>
                  {index < HERO_STATS.length - 1 ? <div className="landing-stat-divider" /> : null}
                </div>
              ))}
            </div>
          </div>

          <div className="landing-visual" id="3d-container">
            <div className="landing-orbit-stage">
              <div className="landing-center-node">
                <span className="material-symbols-outlined">hub</span>
              </div>

              {ORBIT_NODES.map((node) => (
                <div
                  key={node.angle}
                  className="landing-orbit-node"
                  style={
                    {
                      "--angle": `${node.angle}deg`,
                      "--distance": "150px",
                      "--delay": `${node.delay}s`
                    } as CSSProperties
                  }
                >
                  <div className={`landing-mini-card landing-mini-card--${node.accent}`}>
                    <div className="landing-mini-avatar" />
                    <div className="landing-mini-line landing-mini-line--wide" />
                    <div className="landing-mini-line" />
                  </div>
                </div>
              ))}

              <svg className="landing-lines" viewBox="0 0 600 600" aria-hidden="true">
                {connectionLines.map((line) => (
                  <line
                    key={line.angle}
                    x1="300"
                    y1="300"
                    x2={line.x}
                    y2={line.y}
                    stroke="rgba(176, 127, 241, 0.28)"
                    strokeWidth="2"
                  />
                ))}
              </svg>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="landing-features-section">
        <div className="landing-shell">
          <div className="landing-section-header">
            <SplitText
              text="How MATCH3 Works"
              tag="h2"
              delay={50}
              duration={0.8}
              splitType="chars"
              from={{ opacity: 0, y: 30 }}
              to={{ opacity: 1, y: 0 }}
              textAlign="center"
            />
            <p>
              Powered by advanced AI models to connect you with the right people, at the right time, for the right
              reasons.
            </p>
          </div>

          <div className="landing-features-grid">
            {FEATURES.map((feature) => (
              <SpotlightCard key={feature.title} spotlightColor="rgba(176, 127, 241, 0.2)">
                <TiltedIconCard
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  containerHeight="280px"
                  containerWidth="100%"
                  rotateAmplitude={12}
                  scaleOnHover={1.05}
                  showMobileWarning={false}
                />
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-cta-section">
        <div className="landing-shell landing-cta-inner">
          <SplitText
            text="Ready to Find Your Match?"
            tag="h2"
            delay={50}
            duration={0.8}
            splitType="chars"
            from={{ opacity: 0, y: 30 }}
            to={{ opacity: 1, y: 0 }}
            textAlign="center"
          />
          <p>Join innovators, builders, and founders already finding meaningful connections on MATCH3.</p>
          <button onClick={navigateToRegister} className="landing-button landing-button--primary landing-button--large">
            Get Started for Free
          </button>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-shell landing-footer-inner">
          <div className="landing-footer-content">
            <div className="landing-footer-brand">
              <div className="landing-brand">
                MATCH
                <RotatingText
                  texts={["NETWORK", "CONNECT", "BUILD", "LINK", "GROW"]}
                  mainClassName="landing-rotating-text"
                  splitLevelClassName="landing-rotating-split"
                  elementLevelClassName="landing-rotating-element"
                  rotationInterval={2500}
                  staggerDuration={0.03}
                  staggerFrom="last"
                  transition={{ type: "spring", damping: 30, stiffness: 400 }}
                />
              </div>
              <p>AI-Powered Networking for Web3 Builders</p>
            </div>

            <div className="landing-footer-links">
              <div className="landing-footer-link-group">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#faq">FAQ</a>
                <Link to="/register">Pricing</Link>
              </div>

              <div className="landing-footer-link-group">
                <h4>Company</h4>
                <Link to="/dashboard">About</Link>
                <Link to="/dashboard">Blog</Link>
                <Link to="/dashboard">Careers</Link>
              </div>

              <div className="landing-footer-link-group">
                <h4>Legal</h4>
                <a href="#">Privacy</a>
                <a href="#">Terms</a>
                <a href="#">Security</a>
              </div>

              <div className="landing-footer-link-group">
                <h4>Connect</h4>
                <a href="#">Twitter</a>
                <a href="#">Discord</a>
                <a href="#">GitHub</a>
              </div>
            </div>
          </div>

          <div className="landing-footer-bottom">
            <small>© 2026 MATCH3. All rights reserved.</small>
            <div className="landing-footer-social">
              <a href="#" className="landing-footer-social-link" aria-label="Website">
                <span className="material-symbols-outlined">language</span>
              </a>
              <a href="#" className="landing-footer-social-link" aria-label="Email">
                <span className="material-symbols-outlined">mail</span>
              </a>
            </div>
          </div>
        </div>
      </footer>

      <FaqModal faqs={FAQS} />
      <RatingButton />
    </main>
  );
}
