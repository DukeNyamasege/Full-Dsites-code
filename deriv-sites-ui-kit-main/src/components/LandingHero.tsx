import { ArrowRight, Check, Globe, Infinity, ShieldCheck, Sparkles, TrendingDown, Wallet, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LandingHeroProps {
  onGetStarted: () => void;
}

const LandingHero = ({ onGetStarted }: LandingHeroProps) => {
  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-12">
      {/* HERO */}
      <section className="relative max-w-6xl mx-auto pt-6 sm:pt-10">
        {/* Decorative background graphics */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
          <div className="absolute -top-24 -left-24 w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute top-20 -right-24 w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-purple-500/20 blur-3xl" />
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.06]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-foreground">
              Own your Deriv third-party site — pay once, run for 12 months
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight mb-5">
            Stop paying monthly cuts.
            <span className="block bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-400 to-primary">
              Own your website outright.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 px-2">
            With <span className="text-foreground font-semibold">DerivSites</span>, launch your own
            Deriv third-party website with a single one-time payment of{" "}
            <span className="text-foreground font-semibold">KES 25,000</span> per site.
            No recurring monthly fees. No commission percentages eating into your earnings.
            Just a website you actually own.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <Button
              onClick={onGetStarted}
              className="btn-primary h-12 px-8 text-base group"
              size="lg"
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
            <a
              href="#how-it-works"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              See how it works ↓
            </a>
          </div>

          {/* Comparison graphic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-left">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">
                  Other platforms
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">
                10–30% <span className="text-sm font-normal text-muted-foreground">monthly</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Endless monthly percentage cuts on every commission you earn.
              </p>
            </div>
            <div className="rounded-2xl border border-primary/40 bg-primary/10 p-5 text-left relative overflow-hidden">
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary/20 text-[10px] font-semibold text-primary">
                BEST VALUE
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                  DerivSites
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">
                KES 25,000{" "}
                <span className="text-sm font-normal text-muted-foreground">one-time</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Pay once. Keep 100% of your commissions for the next 12 months.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY OWN IT */}
      <section id="how-it-works" className="max-w-6xl mx-auto mt-20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Why own a website instead of renting one?
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Most platforms lock you into monthly fees or take a percentage of your commissions
            forever. DerivSites flips the model — you pay once, and the website is yours to run.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <FeatureCard
            icon={<Wallet className="w-5 h-5" />}
            title="One-time payment"
            description="A single KES 25,000 fee per website. No surprise charges, no monthly invoices."
          />
          <FeatureCard
            icon={<Infinity className="w-5 h-5" />}
            title="Keep 100% of commissions"
            description="Every shilling your community generates stays with you. We take zero percentage."
          />
          <FeatureCard
            icon={<Globe className="w-5 h-5" />}
            title="Custom domain included"
            description="Launch on your own branded domain — your name, your website, your business."
          />
          <FeatureCard
            icon={<Zap className="w-5 h-5" />}
            title="Live in minutes"
            description="Our guided setup wizard takes you from payment to a live site without code."
          />
          <FeatureCard
            icon={<ShieldCheck className="w-5 h-5" />}
            title="Deriv-powered"
            description="Built on top of Deriv's official APIs — secure, reliable, and trader-ready."
          />
          <FeatureCard
            icon={<Sparkles className="w-5 h-5" />}
            title="XML bots ready"
            description="Upload and share your trading bots directly through your own website."
          />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-6xl mx-auto mt-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            From payment to live site in 4 steps
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            The whole process is automated — no waiting, no back-and-forth.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { n: "01", t: "Make payment", d: "Pay KES 25,000 securely via M-Pesa STK push." },
            { n: "02", t: "Pick your domain", d: "Choose and register your custom domain." },
            { n: "03", t: "Configure your site", d: "Add your Deriv App ID, token and XML bots." },
            { n: "04", t: "Go live", d: "Your site activates automatically — start earning." },
          ].map((s) => (
            <div
              key={s.n}
              className="relative rounded-2xl panel-bg border border-white/10 p-5 hover:border-primary/40 transition-colors"
            >
              <div className="text-4xl font-bold text-primary/30 mb-2">{s.n}</div>
              <h3 className="text-base font-semibold text-foreground mb-1">{s.t}</h3>
              <p className="text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHAT'S INCLUDED */}
      <section className="max-w-4xl mx-auto mt-20">
        <div className="rounded-3xl panel-bg border border-primary/20 p-6 sm:p-10 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl gradient-purple flex items-center justify-center">
                <Check className="w-5 h-5 text-foreground" />
              </div>
              <span className="text-sm font-semibold text-primary uppercase tracking-wide">
                Everything you get
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
              KES 25,000 — one-time, per website
            </h2>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {[
                "Full ownership for 12 months",
                "Custom branded domain",
                "Keep 100% of your commissions",
                "Automated site activation",
                "XML bot hosting & sharing",
                "Deriv API integration",
                "Email & dashboard support",
                "No hidden recurring fees",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={onGetStarted}
              className="btn-primary h-12 px-8 text-base w-full sm:w-auto group"
              size="lg"
            >
              Get Started — Pay KES 25,000 Once
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-3xl mx-auto mt-16 text-center">
        <h3 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
          Ready to own your Deriv site?
        </h3>
        <p className="text-muted-foreground text-sm mb-5">
          Skip the monthly cuts. Launch on DerivSites today.
        </p>
        <Button
          onClick={onGetStarted}
          className="btn-primary h-12 px-8 text-base group"
          size="lg"
        >
          Get Started
          <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
        </Button>
      </section>
    </div>
  );
};

const FeatureCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="rounded-2xl panel-bg border border-white/10 p-5 hover:border-primary/40 transition-colors group">
    <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-3 group-hover:bg-primary/25 transition-colors">
      {icon}
    </div>
    <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

export default LandingHero;