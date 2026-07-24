import PixelMark from '@/components/PixelMark';
import Button from '@/components/Button';
import Eyebrow from '@/components/Eyebrow';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-cream text-text-primary">
      <nav className="sticky top-0 z-20 flex items-center justify-between border-b border-border-subtle bg-bg-cream/85 px-6 py-5 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <PixelMark />
          <span className="text-lg font-bold tracking-tight">Dilligent</span>
        </div>
        <span className="font-mono text-xs uppercase tracking-widest opacity-50">AI VC Analyst</span>
      </nav>

      <Hero />
      <HowItWorks />
      <Features />
      <FinalCta />
      <Footer />

      <FloatingBadge />
    </div>
  );
}

function FloatingBadge() {
  return (
    <div className="fixed bottom-5 right-5 flex items-center gap-2 rounded-xl bg-text-primary px-3 py-2 text-text-on-dark shadow-lg">
      <PixelMark className="h-3.5 w-3.5" />
      <span className="font-mono text-[10px] uppercase tracking-widest">Powered by You.com</span>
    </div>
  );
}

function Hero() {
  return (
    <section className="dot-grid relative overflow-hidden px-6 py-24 text-center">
      <HeroBackdrop />
      <div className="relative mx-auto max-w-3xl">
        <Eyebrow className="mx-auto w-fit text-accent-orange">AI Investment Research</Eyebrow>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Diligence at the speed of <span className="text-accent-orange">your dealflow.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-text-muted">
          Point Dilligent at a company and its founders. It runs three research agents in
          parallel — market, team, competitive position — weighs each against your thesis,
          and returns a fully cited memo before your next meeting.
        </p>
        <div className="mt-8 flex justify-center">
          <Button href="/analyze" size="md">
            Get Started
          </Button>
        </div>
      </div>
    </section>
  );
}

// Crisp, flat blocks echoing PixelMark's pixel motif -- deliberately not blurred
// gradient blobs, to stay in the site's blocky/technical visual language.
function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute left-[8%] top-[18%] h-14 w-14 rotate-6 rounded-2xl bg-accent-orange/15 sm:h-20 sm:w-20" />
      <div className="absolute right-[10%] top-[12%] h-10 w-10 -rotate-12 rounded-xl bg-accent-mustard/20 sm:h-16 sm:w-16" />
      <div className="absolute bottom-[15%] left-[14%] h-8 w-8 rotate-12 rounded-lg bg-accent-yellowgreen/25 sm:h-12 sm:w-12" />
      <div className="absolute bottom-[20%] right-[8%] h-16 w-16 -rotate-6 rounded-2xl bg-accent-brick/10 sm:h-24 sm:w-24" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-bg-cream" />
    </div>
  );
}

const STEPS = [
  {
    tile: 'bg-accent-orange',
    title: 'Define the deal',
    body: 'Company, website, founders, and the thesis you’re underwriting against — stage, sector, check size, risk appetite.',
  },
  {
    tile: 'bg-accent-mustard',
    title: 'Three analysts, working at once',
    body: 'Market Fit, Team Strength, and Competitive Position each run an independent deep-research pass — in parallel, not in sequence.',
  },
  {
    tile: 'bg-accent-brick',
    title: 'A memo you can defend',
    body: 'A weighted score against your thesis, per-dimension breakdowns, and a narrative where every claim traces back to its source.',
  },
];

function HowItWorks() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <Eyebrow className="text-accent-orange">How it works</Eyebrow>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <div key={i} className="rounded-2xl border border-border-subtle bg-white p-6">
            <div className={`h-10 w-10 rounded-lg ${step.tile}`} />
            <h3 className="mt-4 font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const FEATURES = [
  {
    title: 'Nothing asserted. Everything sourced.',
    body: 'Every citation resolves to its real source and a plain-language summary — verify any claim in one click, not a follow-up search.',
  },
  {
    title: 'Your thesis, not a universal score.',
    body: 'Stage, sector, check size, and risk appetite shape the composite score and recommendation — calibrated to how you actually invest.',
  },
  {
    title: 'Built for parallel diligence.',
    body: 'All three research legs run at once. Each dimension appears the moment its own research resolves — no waiting on the slowest one.',
  },
];

function Features() {
  return (
    <section className="grain-overlay rounded-2xl bg-bg-dark px-6 py-16 text-text-on-dark sm:mx-6 lg:mx-auto lg:max-w-5xl">
      <div className="grid gap-8 sm:grid-cols-3">
        {FEATURES.map((f, i) => (
          <div key={i}>
            <h3 className="font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/70">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="grain-overlay mx-6 mt-8 rounded-2xl bg-accent-orange px-6 py-14 text-center text-text-on-dark lg:mx-auto lg:max-w-5xl">
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Your next deal deserves a first read.</h2>
      <p className="mx-auto mt-3 max-w-md text-white/80">
        A company name, a website, and the founders — that's all it takes.
      </p>
      <div className="mt-6 flex justify-center">
        <Button href="/analyze" variant="secondary" size="md">
          Get Started
        </Button>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="px-6 py-10 text-center font-mono text-xs uppercase tracking-widest text-text-muted">
      Built for the You.com Agentic Hackathon — Deep Research track
    </footer>
  );
}
