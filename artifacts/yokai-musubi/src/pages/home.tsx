import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { ArrowDownRight, ArrowRight, Clock3, Instagram, MapPin, Menu, Phone, X } from 'lucide-react';

const ASSETS = {
  logo: '/assets/image_1787218194931.png',
  seaweed: '/assets/Seaweed_Salad_Onigiri!_Todays_special,_come_get_it._1787217971864.jpg',
  spicyTuna: '/assets/Spicy_Tuna_and_Kimchi_Onigiri._These_are_available_every_Frida_1787217974801.jpg',
  smores: '/assets/Smores_butter_mochi_and_Okubi_Onigiri_(wasabi_tuna,_pickled_g_1787217977055.webp',
  kappa: '/assets/The_Kappa_is_back_this_Friday_and_Saturday!_Japanese_pickle,__1787218062713.webp',
  salmon: '/assets/Teriyaki_Salmon_Onigiri._A_fan_favorite_Tuesday-_Thursday._Wh_1787218065516.webp',
  karasu: '/assets/Karasu_Tengu_Onigiri_(kimchi_rice_with_miso_tuna_mayo)_and_Ma_1787218068176.webp',
  karasu2: '/assets/Friday_+_Saturday_special_is_Karasu_Tengu_Onigiri.Kimchi_rice_1787218070990.webp',
};

const ORDER_URL = '/order';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.65 },
};

export default function Home() {
  return (
    <div className="bg-texture min-h-[100dvh] overflow-hidden bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <Navbar />
      <main>
        <HeroSection />
        <IntroSection />
        <FavoritesGallery />
        <CounterNotes />
        <SpecialsSection />
        <VisitSection />
      </main>
      <Footer />
    </div>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  return (
    <>
      <div className="announcement-bar">
        <div className="mx-auto flex max-w-[1440px] items-center justify-center gap-3 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.24em] sm:text-[11px]">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="announcement-hours">Tuesday – Saturday · 9:00 AM – 4:00 PM</span>
          <span className="hidden text-foreground/40 sm:inline">/</span>
          <span className="hidden text-foreground/70 sm:inline">2190 W Burnside, Portland</span>
        </div>
      </div>
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        className={`fixed left-0 right-0 top-[31px] z-50 border-b transition-all duration-300 ${
          scrolled
            ? 'border-border/80 bg-background/95 shadow-[0_6px_22px_rgba(57,37,27,0.06)] backdrop-blur-md'
            : 'border-transparent bg-background/88 backdrop-blur-[3px]'
        }`}
      >
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <a href="#top" className="group flex items-center gap-3.5" aria-label="Yokai Musubi home">
            <img src={ASSETS.logo} alt="Yokai Musubi Tengu logo" className="h-11 w-11 object-contain transition-transform duration-300 group-hover:rotate-[-4deg]" />
            <span className="font-display text-[17px] font-extrabold tracking-[0.16em] text-foreground">YOKAI <span className="text-primary">MUSUBI</span></span>
          </a>
          <div className="hidden items-center gap-8 lg:flex">
            <a href="#about" className="nav-link">Our story</a>
            <a href="#menu" className="nav-link">The counter</a>
            <a href="#visit" className="nav-link">Find us</a>
            <a href={ORDER_URL} className="button button-dark px-5 py-3 text-[11px]" data-testid="link-order-nav">
              Order online <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <button type="button" className="rounded-full p-2 text-foreground transition-colors hover:bg-secondary lg:hidden" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </motion.nav>
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex flex-col bg-background px-6 pb-8 pt-8"
          >
            <div className="flex items-center justify-between">
              <a href="#top" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3">
                <img src={ASSETS.logo} alt="Yokai Musubi Tengu logo" className="h-11 w-11 object-contain" />
                <span className="font-display text-[16px] font-extrabold tracking-[0.13em]">YOKAI <span className="text-primary">MUSUBI</span></span>
              </a>
              <button type="button" onClick={() => setMobileMenuOpen(false)} className="rounded-full p-2 hover:bg-secondary" aria-label="Close menu">
                <X className="h-7 w-7" />
              </button>
            </div>
            <div className="mt-20 flex flex-col gap-7 font-display text-4xl font-semibold">
              <a href="#about" onClick={() => setMobileMenuOpen(false)} className="transition-colors hover:text-primary">Our story</a>
              <a href="#menu" onClick={() => setMobileMenuOpen(false)} className="transition-colors hover:text-primary">The counter</a>
              <a href="#visit" onClick={() => setMobileMenuOpen(false)} className="transition-colors hover:text-primary">Find us</a>
            </div>
            <div className="mt-auto border-t border-border pt-6">
              <p className="font-japanese text-sm tracking-[0.2em] text-muted-foreground">おむすびを、どうぞ</p>
              <a href={ORDER_URL} className="button button-primary mt-5 w-full justify-center py-4 text-sm" data-testid="link-order-mobile">
                Order online <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function HeroSection() {
  const { scrollY } = useScroll();
  const imageY = useTransform(scrollY, [0, 850], [0, 72]);

  return (
    <section id="top" className="hero-section relative isolate pt-[136px]">
        <div className="mx-auto grid max-w-[1440px] items-center gap-12 px-5 pb-16 sm:px-8 md:min-h-[calc(100dvh-103px)] md:grid-cols-[0.95fr_1.05fr] md:gap-10 md:px-12 md:pb-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div className="relative z-10 max-w-[620px]">
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="mb-7 flex items-center gap-3 text-primary">
            <span className="font-japanese text-[15px] tracking-[0.2em]">ポートランド</span>
            <span className="h-px w-10 bg-primary/60" />
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-foreground/55">Since 2016</span>
          </motion.div>
          <motion.h1 {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.18 }} className="font-display text-[clamp(2.75rem,4.8vw,4.5rem)] font-extrabold leading-[0.9] tracking-[-0.06em] text-foreground">
            <span className="block">PORTLAND'S</span>
            <span className="block text-primary">LONGEST-RUNNING</span>
            <span className="block">SPECIALTY MUSUBI SHOP.</span>
          </motion.h1>
          <motion.p {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 }} className="mt-8 max-w-[530px] text-[17px] leading-[1.7] text-muted-foreground sm:text-[19px]">
            Specialty musubi, scratch-made butter mochi, and made-to-order taiyaki watched over by a mischievous Tengu. Food made to take somewhere.
          </motion.p>
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.42 }} className="mt-9 flex flex-wrap items-center gap-3">
            <a href={ORDER_URL} className="button button-primary px-6 py-4 text-xs sm:px-7" data-testid="link-order-hero">
              Order online <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#about" className="button button-outline px-6 py-4 text-xs sm:px-7">
              Read our story <ArrowDownRight className="h-4 w-4" />
            </a>
          </motion.div>
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.55 }} className="mt-12 flex items-center gap-3 border-l-2 border-primary/50 pl-4">
            <span className="font-japanese text-sm tracking-[0.14em] text-foreground/65">毎日手作り</span>
            <span className="text-xs text-muted-foreground">made fresh daily</span>
          </motion.div>
        </div>
        <div className="relative mx-auto h-[470px] w-full max-w-[630px] sm:h-[570px] md:h-[630px]">
          <div className="absolute right-0 top-0 h-[82%] w-[73%] overflow-hidden border-[8px] border-card bg-card shadow-[0_22px_45px_rgba(57,37,27,0.18)] sm:border-[11px]">
            <img src={ASSETS.salmon} alt="Teriyaki salmon onigiri" className="h-full w-full object-cover object-center" />
          </div>
          <motion.div style={{ y: imageY }} className="absolute bottom-0 left-0 z-10 h-[57%] w-[55%] overflow-hidden border-[8px] border-card bg-card shadow-[0_18px_35px_rgba(57,37,27,0.2)] sm:border-[11px]">
            <img src={ASSETS.spicyTuna} alt="Spicy tuna and kimchi musubi" className="h-full w-full object-cover object-center" />
          </motion.div>
          <div className="absolute bottom-[20%] right-[4%] z-20 flex h-[105px] w-[105px] items-center justify-center rounded-full bg-primary p-3 text-center text-primary-foreground shadow-lg sm:h-[128px] sm:w-[128px]">
            <span className="font-japanese text-[11px] leading-[1.8] tracking-[0.14em]">おいしい<br />もの</span>
          </div>
          <div className="absolute right-[2%] top-[84%] z-20 hidden border border-foreground/20 bg-background px-4 py-3 shadow-[4px_4px_0_hsl(var(--foreground)/0.12)] sm:block">
            <p className="font-display text-sm font-bold tracking-[0.08em]">RICE · SEAWEED · ALOHA</p>
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1440px] items-center gap-4 border-t border-border/80 px-5 py-4 text-[10px] font-bold uppercase tracking-[0.26em] text-muted-foreground sm:px-8 md:px-12">
        <span className="h-px w-12 bg-primary/60" /><span>West Burnside, Portland OR</span>
        <span className="ml-auto hidden sm:inline">Scroll to explore</span><ArrowDownRight className="ml-auto h-4 w-4 sm:ml-0" />
      </div>
    </section>
  );
}

function IntroSection() {
  return (
    <section id="about" className="story-section relative overflow-hidden py-24 text-background sm:py-32 lg:py-40">
      <div className="absolute left-0 top-0 h-full w-2 bg-primary" />
      <div className="mx-auto grid max-w-[1440px] items-center gap-14 px-5 sm:px-8 md:grid-cols-[1fr_0.86fr] md:gap-20 md:px-12">
        <motion.div {...fadeUp}>
          <div className="mb-7 flex items-center gap-4 text-primary">
            <span className="font-japanese text-lg tracking-[0.12em]">家の味</span>
            <span className="h-px w-14 bg-primary/60" />
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-background/50">A taste of home</span>
          </div>
          <h2 className="max-w-[720px] font-display text-[clamp(2.8rem,6vw,6.4rem)] font-bold leading-[0.95] tracking-[-0.05em]">
            FOOD WITH<br /><em className="font-serif not-italic text-primary">A MEMORY.</em>
          </h2>
          <div className="mt-9 max-w-[640px] space-y-5 text-[17px] leading-[1.75] text-background/70 sm:text-lg">
            <p>Born and raised in Hawaii, our founder grew up on the musubi, onigiri, and warm kitchen memories shared by a Japanese father and aunty.</p>
            <p>Yokai Musubi brings those beloved foods to Portland as an affordable, delicious alternative to fast food—made to fuel your workday, family outing, or next day trip.</p>
          </div>
          <div className="mt-10 flex items-center gap-4 text-background/55">
            <span className="font-japanese text-sm tracking-[0.18em]">思い出をむすぶ</span>
            <span className="h-px w-16 bg-background/20" />
            <span className="text-xs uppercase tracking-[0.18em]">binding memories</span>
          </div>
        </motion.div>
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }} className="relative mx-auto w-full max-w-[500px]">
          <div className="relative aspect-[0.92] overflow-hidden border-[10px] border-background/10 bg-primary shadow-2xl">
            <img src={ASSETS.smores} alt="Scratch-made butter mochi and Okubi onigiri" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/35 to-transparent" />
          </div>
          <div className="absolute -bottom-7 -left-3 max-w-[250px] border border-foreground/10 bg-background p-5 text-foreground shadow-xl sm:-left-9">
            <p className="font-display text-lg font-bold leading-tight">Scratch-made butter mochi & banana bread.</p>
            <p className="mt-3 font-japanese text-[11px] tracking-[0.12em] text-muted-foreground">毎日手作り · made fresh daily</p>
          </div>
          <span className="absolute -right-2 -top-7 font-japanese text-5xl text-primary sm:-right-8">む</span>
        </motion.div>
      </div>
    </section>
  );
}

function FavoritesGallery() {
  const items = [
    { title: 'Teriyaki Salmon', japanese: '照り焼きサーモン', desc: 'A fan favorite Tuesday–Thursday.', img: ASSETS.salmon, tall: true },
    { title: 'Seaweed Salad', japanese: '海藻サラダ', desc: "Today's special, fresh and vibrant.", img: ASSETS.seaweed, tall: false },
    { title: 'Spicy Tuna & Kimchi', japanese: 'スパイシーツナ', desc: 'Available every Friday.', img: ASSETS.spicyTuna, tall: false },
    { title: 'Okubi', japanese: 'おくび', desc: 'Wasabi tuna and pickled ginger.', img: ASSETS.smores, tall: true },
  ];

  return (
    <section id="menu" className="menu-section relative py-24 sm:py-32">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 md:px-12">
        <div className="mb-12 flex flex-col justify-between gap-7 md:mb-16 md:flex-row md:items-end">
          <motion.div {...fadeUp}>
            <p className="mb-4 font-japanese text-sm tracking-[0.26em] text-primary">人気のむすび</p>
            <h2 className="font-display text-[clamp(2.7rem,5.8vw,6rem)] font-bold leading-[0.92] tracking-[-0.05em]">THE COUNTER<br /><span className="text-primary">FAVORITES.</span></h2>
          </motion.div>
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="max-w-[280px] md:pb-1">
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">Triangular, portable, and made with a little more care than your average lunch.</p>
            <a href={ORDER_URL} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary transition-[gap] hover:gap-4" data-testid="link-full-menu">
              View full menu <ArrowRight className="h-4 w-4" />
            </a>
          </motion.div>
        </div>
        <div className="gallery-grid">
          {items.map((item, i) => (
            <motion.article key={item.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.08 }} className={`group ${item.tall ? 'gallery-tall' : ''}`}>
              <div className="relative aspect-[0.88] overflow-hidden bg-secondary sm:aspect-[0.9]">
                <img src={item.img} alt={item.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                <div className="absolute inset-0 bg-foreground/0 transition-colors duration-500 group-hover:bg-foreground/10" />
                <span className="absolute left-4 top-4 bg-background/90 px-3 py-2 font-japanese text-[11px] tracking-[0.12em] text-foreground">{item.japanese}</span>
              </div>
              <div className="border-b border-border pb-5 pt-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-xl font-bold">{item.title}</h3>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CounterNotes() {
  return (
    <section className="counter-notes-section py-12 sm:py-16">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-5 sm:px-8 md:grid-cols-3 md:px-12">
        {[
          ['Rice, held with care', 'おむすび', 'A good onigiri is humble food. Warm rice, a thoughtful filling, and hands that know when to stop.'],
          ['A little island in Portland', 'アロハ', 'Hawaii raised our founder. Portland gave us a home. Both places know the best meals are meant to be shared.'],
          ['Come as you are', 'いらっしゃいませ', 'Take one for the road, bring a few to the office, or stay a while. There is always room at the counter.'],
        ].map(([title, japanese, copy], index) => (
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: index * 0.1 }} key={title} className="counter-note relative md:pl-7">
            <p className="font-japanese text-xs tracking-[0.18em] text-primary">{japanese}</p>
            <h3 className="mt-2 font-display text-xl font-bold">{title}</h3>
            <p className="mt-3 max-w-[340px] text-sm leading-[1.7] text-muted-foreground">{copy}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function SpecialsSection() {
  return (
    <section className="specials-section relative overflow-hidden py-24 text-primary-foreground sm:py-32">
      <div className="absolute inset-y-0 right-0 hidden w-[37%] bg-foreground/10 lg:block" />
      <div className="specials-sun" aria-hidden="true" />
      <div className="mx-auto grid max-w-[1440px] items-center gap-14 px-5 sm:px-8 md:px-12 lg:grid-cols-[0.83fr_1.17fr] lg:gap-20">
        <motion.div {...fadeUp} className="relative mx-auto w-full max-w-[490px]">
          <div className="relative z-10 rotate-[-2deg] overflow-hidden border-[9px] border-primary-foreground/90 bg-primary-foreground shadow-[14px_18px_0_rgba(57,37,27,0.18)] sm:border-[12px]">
            <img src={ASSETS.karasu} alt="Karasu Tengu onigiri special" className="aspect-square w-full object-cover" />
          </div>
          <div className="absolute -bottom-8 -right-3 z-20 w-[44%] rotate-[6deg] overflow-hidden border-[7px] border-primary-foreground bg-primary-foreground shadow-xl sm:-right-10 sm:border-[9px]">
            <img src={ASSETS.kappa} alt="Kappa onigiri special" className="aspect-square w-full object-cover" />
          </div>
          <span className="absolute -left-3 -top-9 font-japanese text-6xl text-primary-foreground/50 sm:-left-8">週</span>
        </motion.div>
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.12 }} className="relative z-10 lg:pl-4">
          <div className="mb-6 flex items-center gap-3">
            <span className="border border-primary-foreground/35 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.22em]">Rotating weekends</span>
            <span className="font-japanese text-xs tracking-[0.2em] text-primary-foreground/70">週末の特別</span>
          </div>
          <h2 className="max-w-[740px] font-display text-[clamp(3rem,6.4vw,7rem)] font-extrabold leading-[0.9] tracking-[-0.06em]">FRIDAY &<br /><span className="font-serif font-normal italic">SATURDAY</span><br />SPECIALS.</h2>
          <p className="mt-8 max-w-[650px] text-[17px] leading-[1.7] text-primary-foreground/85 sm:text-xl">Every weekend, the Tengu brings something new. From the spicy <strong>Karasu Tengu</strong> (kimchi rice with miso tuna mayo) to the refreshing <strong>Kappa</strong> (Japanese pickle and cucumber).</p>
           <a href={ORDER_URL} className="button button-light mt-9 px-6 py-4 text-xs sm:px-7" data-testid="link-order-specials">
            Check this week's menu <ArrowRight className="h-4 w-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

function VisitSection() {
  return (
    <section id="visit" className="bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 md:px-12">
        <div className="visit-panel relative z-[31] overflow-hidden bg-foreground px-6 py-12 text-background sm:px-10 sm:py-16 lg:px-16">
          <div className="absolute right-[-5%] top-[-15%] hidden h-[560px] w-[500px] opacity-[0.07] lg:block">
            <img src={ASSETS.logo} alt="" className="h-full w-full object-contain rotate-12" />
          </div>
          <div className="relative z-10 grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-24">
            <motion.div {...fadeUp}>
              <p className="mb-5 font-japanese text-sm tracking-[0.3em] text-primary">ようこそ</p>
              <h2 className="font-display text-[clamp(3rem,5.5vw,6rem)] font-bold leading-[0.9] tracking-[-0.05em]">COME<br /><span className="text-primary">GET IT.</span></h2>
              <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-1">
                <InfoItem icon={<MapPin className="h-5 w-5" />} label="Location"><p>2190 W Burnside St<br />Portland, OR 97210</p></InfoItem>
                <InfoItem icon={<Clock3 className="h-5 w-5" />} label="Hours"><p>Tuesday – Saturday<br />9:00 AM – 4:00 PM</p></InfoItem>
                <InfoItem icon={<Phone className="h-5 w-5" />} label="Contact"><a href="tel:503-915-7499" className="transition-colors hover:text-primary">(503) 915-7499</a></InfoItem>
              </div>
            </motion.div>
            <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.14 }} className="flex items-center">
              <div className="visit-order-card w-full p-7 text-foreground sm:p-9 lg:rotate-[2deg]">
                <div className="relative z-10">
                  <p className="mb-4 font-japanese text-sm tracking-[0.2em] text-primary">できたて</p>
                  <h3 className="font-display text-3xl font-bold tracking-[-0.03em]">Made to order.</h3>
                  <p className="mt-4 max-w-[420px] text-[15px] leading-[1.75] text-muted-foreground">Whether it&apos;s a quick lunch, a picnic spread, or warm taiyaki for the road, we make it fresh. Pre-order online to skip the line.</p>
                   <a href={ORDER_URL} className="button button-primary mt-7 w-full justify-center py-4 text-xs" data-testid="link-order-visit">Order ahead</a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoItem({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-primary/40 text-primary">{icon}</div>
      <div className="text-[15px] leading-[1.65]">
        <h3 className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{label}</h3>
        <div className="font-medium text-background/80">{children}</div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer-section relative overflow-hidden pb-8 pt-14 text-background">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 md:px-12">
        <div className="flex flex-col justify-between gap-8 pb-14 md:flex-row md:items-center">
          <a href="#top" className="flex items-center gap-3">
            <img src={ASSETS.logo} alt="Yokai Musubi Tengu logo" className="h-12 w-12 object-contain" />
            <span className="font-display text-xl font-extrabold tracking-[0.14em]">YOKAI <span className="text-primary">MUSUBI</span></span>
          </a>
          <div className="flex items-center gap-5">
            <a href="https://www.instagram.com/yokaimusubi/" target="_blank" rel="noopener noreferrer" aria-label="Yokai Musubi on Instagram" className="flex h-11 w-11 items-center justify-center border border-background/30 transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"><Instagram className="h-4 w-4" /></a>
            <a href={ORDER_URL} className="text-xs font-bold uppercase tracking-[0.16em] transition-colors hover:text-primary" data-testid="link-order-footer">Order online <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></a>
          </div>
        </div>
        <div className="relative flex justify-center border-t border-background/20 pt-7 text-center text-xs text-background/55">
          <p className="font-watermark">Built by Studio 1801</p>
          <p className="absolute left-0 hidden md:block">© {new Date().getFullYear()} Yokai Musubi. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}