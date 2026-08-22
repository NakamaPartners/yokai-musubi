import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Info,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Truck,
  Utensils,
  X,
} from 'lucide-react';
import { Link } from 'wouter';

const ASSETS = {
  seaweed: '/assets/Seaweed_Salad_Onigiri!_Todays_special,_come_get_it._1787217971864.jpg',
  spicyTuna: '/assets/Spicy_Tuna_and_Kimchi_Onigiri._These_are_available_every_Frida_1787217974801.jpg',
  smores: '/assets/Smores_butter_mochi_and_Okubi_Onigiri_(wasabi_tuna,_pickled_g_1787217977055.webp',
  kappa: '/assets/The_Kappa_is_back_this_Friday_and_Saturday!_Japanese_pickle,__1787218062713.webp',
  salmon: '/assets/Teriyaki_Salmon_Onigiri._A_fan_favorite_Tuesday-_Thursday._Wh_1787218065516.webp',
  karasu: '/assets/Karasu_Tengu_Onigiri_(kimchi_rice_with_miso_tuna_mayo)_and_Ma_1787218068176.webp',
};

type MenuItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  availability: string;
  priceCents: number;
};

type CartItem = {
  item: MenuItem;
  quantity: number;
};

type Fulfillment = 'pickup' | 'delivery';

const menuItem = (
  id: string,
  title: string,
  description: string,
  category: string,
  image: string,
  availability: string,
  priceCents: number,
): MenuItem => ({ id, title, description, category, image, availability, priceCents });

const MENU: MenuItem[] = [
  menuItem('spam-musubi', 'Spam Musubi', 'Hawaiian steak. Cooked perfect. No sauce, full nori wrap.', 'Rectangle musubi', ASSETS.salmon, 'Available Tue–Sat', 350),
  menuItem('miso-tofu-musubi', 'Miso Tofu Musubi', 'Local air-fried tofu, Tengu sauce, and furikake on premium rice.', 'Rectangle musubi', ASSETS.smores, 'Vegan', 475),
  menuItem('spam-egg-musubi', 'Spam Egg Musubi', 'Breakfast on the go, wrapped in crisp nori.', 'Rectangle musubi', ASSETS.spicyTuna, 'Available Tue–Sat', 475),
  menuItem('tuna-mayo-onigiri', 'Tuna Mayo Onigiri', 'Seasoned tuna salad tucked into premium rice with crisp nori.', 'Triangle onigiri', ASSETS.spicyTuna, 'Counter favorite', 450),
  menuItem('ume-onigiri', 'Ume Onigiri', 'Umeboshi, shiso furikake, and a salty-sour finish.', 'Triangle onigiri', ASSETS.seaweed, 'Vegetarian', 399),
  menuItem('spicy-tuna', 'Spicy Tuna', 'Chili mayo tuna salad with fresh, crisp nori.', 'Triangle onigiri', ASSETS.spicyTuna, 'A little spicy', 450),
  menuItem('butter-mochi', 'Butter Mochi', 'Strawberry matcha flavor, baked fresh every morning.', 'Baked goods', ASSETS.smores, 'Made fresh daily', 450),
  menuItem('banana-bread', 'Banana Bread', 'A soft, sweet slice for the road.', 'Baked goods', ASSETS.smores, 'Made fresh daily', 399),
  menuItem('808-cheesecake', '808 Cheesecake', 'Please specify preferred cheesecake flavor in your notes.', 'Baked goods', ASSETS.smores, 'Call for availability', 650),
  menuItem('strawberry-layered-cake', 'Strawberry Layered Cake', 'A bright, celebratory slice.', 'Baked goods', ASSETS.smores, 'Call for availability', 750),
  menuItem('lilikoi-passion', 'Lilikoi Passion', "Hawaii's best canned juice.", 'Hawaiian Sun', ASSETS.kappa, 'Cold', 250),
  menuItem('guava-nectar', 'Guava Nectar', 'Smooth tropical guava refreshment.', 'Hawaiian Sun', ASSETS.kappa, 'Cold', 250),
  menuItem('pass-o-guava', 'Pass-O-Guava', 'A tropical passionfruit and guava blend.', 'Hawaiian Sun', ASSETS.kappa, 'Cold', 250),
  menuItem('passion-orange', 'Passion Orange', 'Bright citrus with passionfruit.', 'Hawaiian Sun', ASSETS.kappa, 'Cold', 250),
  menuItem('pineapple-orange-nectar', 'Pineapple Orange Nectar', 'A sunny pineapple and orange blend.', 'Hawaiian Sun', ASSETS.kappa, 'Cold', 250),
  menuItem('luau-punch', 'Luau Punch', 'A nostalgic tropical fruit punch.', 'Hawaiian Sun', ASSETS.kappa, 'Cold', 250),
  menuItem('mango-orange', 'Mango Orange', 'Mango sweetness with fresh orange.', 'Hawaiian Sun', ASSETS.kappa, 'Cold', 250),
  menuItem('island-iced-tea', 'Island Iced Tea', 'A refreshing island-style iced tea.', 'Hawaiian Sun', ASSETS.kappa, 'Cold', 250),
  menuItem('green-tea-hawaiian-sun', 'Green Tea Hawaiian Sun', 'Green tea with a tropical lift.', 'Hawaiian Sun', ASSETS.kappa, 'Cold', 250),
  menuItem('strawberry-lilikoi', 'Strawberry Lilikoi', 'Strawberry sweetness with passionfruit.', 'Hawaiian Sun', ASSETS.kappa, 'Cold', 250),
  menuItem('tropical-tea', 'Tropical Tea', 'Tea with pineapple and lemon juice.', 'Hawaiian Sun', ASSETS.kappa, 'Cold', 250),
  menuItem('pineapple-orange', 'Pineapple Orange', 'A classic pineapple and orange blend.', 'Hawaiian Sun', ASSETS.kappa, 'Cold', 250),
  menuItem('strawberry-guava', 'Strawberry Guava', 'Sweet strawberry and guava refreshment.', 'Hawaiian Sun', ASSETS.kappa, 'Cold', 250),
  menuItem('lilikoi-lychee', 'Lilikoi Lychee', 'Floral lychee with passionfruit.', 'Hawaiian Sun', ASSETS.kappa, 'Cold', 250),
  menuItem('strawberry-ramune', 'Strawberry Ramune', 'Japanese soda in a glass bottle with a marble.', 'Ramune', ASSETS.kappa, 'Cold', 400),
  menuItem('peach-ramune', 'Peach Ramune', 'Japanese soda in a glass bottle with a marble.', 'Ramune', ASSETS.kappa, 'Cold', 400),
  menuItem('lychee-ramune', 'Lychee Ramune', 'Japanese soda in a glass bottle with a marble.', 'Ramune', ASSETS.kappa, 'Cold', 400),
  menuItem('grape-ramune', 'Grape Ramune', 'Japanese soda in a glass bottle with a marble.', 'Ramune', ASSETS.kappa, 'Cold', 400),
  menuItem('orange-ramune', 'Orange Ramune', 'Japanese soda in a glass bottle with a marble.', 'Ramune', ASSETS.kappa, 'Cold', 400),
  menuItem('melon-ramune', 'Melon Ramune', 'Japanese soda in a glass bottle with a marble.', 'Ramune', ASSETS.kappa, 'Cold', 400),
  menuItem('original-ramune', 'Original Ramune', 'Japanese soda in a glass bottle with a marble.', 'Ramune', ASSETS.kappa, 'Cold', 400),
  menuItem('li-hing-cherry', 'Li Hing Cherry', 'Jade brand crack seed and li hing candy from Oahu. 2.25 oz.', 'Crack seed', ASSETS.smores, 'Pantry favorite', 450),
  menuItem('sweet-li-hing-mui', 'Sweet Li Hing Mui White', 'Sweet and salty crack seed. 1.25 oz.', 'Crack seed', ASSETS.smores, 'Pantry favorite', 450),
  menuItem('rock-salt-plum', 'Rock Salt Plum', 'Salty-sour plum crack seed. 1.75 oz.', 'Crack seed', ASSETS.smores, 'Pantry favorite', 450),
  menuItem('li-hing-candy', 'Li Hing Candy', 'A sweet li hing treat. 2 oz.', 'Crack seed', ASSETS.smores, 'Pantry favorite', 450),
  menuItem('li-hing-sour-gummy-apple', 'Li Hing Sour Gummy Apple', 'Sour gummy apple with li hing. 2.25 oz.', 'Crack seed', ASSETS.smores, 'Pantry favorite', 450),
  menuItem('li-hing-sour-gummy-worms', 'Li Hing Sour Gummy Worms', 'Sour gummy worms with li hing. 2.5 oz.', 'Crack seed', ASSETS.smores, 'Pantry favorite', 450),
  menuItem('li-hing-guava', 'Li Hing Guava', 'Guava crack seed with a li hing finish. 2 oz.', 'Crack seed', ASSETS.smores, 'Pantry favorite', 450),
  menuItem('li-hing-gummy-peach', "Li Hing Gummy Peach O's", 'Peach gummies with li hing. 2.5 oz.', 'Crack seed', ASSETS.smores, 'Pantry favorite', 450),
  menuItem('li-hing-powder', 'Li Hing Powder', 'A pantry staple for sprinkling over fruit and snacks. 2 oz.', 'Crack seed', ASSETS.smores, 'Pantry favorite', 450),
  menuItem('sour-pineapple-gummy', 'Sour Pineapple Gummy', 'Sour pineapple gummies with li hing packet. 2.25 oz.', 'Crack seed', ASSETS.smores, 'Pantry favorite', 450),
  menuItem('rainbow-sour-belts', 'Rainbow Sour Belts', 'Rainbow sour belts with li hing packet.', 'Crack seed', ASSETS.smores, 'Pantry favorite', 450),
  menuItem('kona-coffee', 'Kona Coffee', 'Iced canned coffee.', 'Cold beverages', ASSETS.kappa, 'Cold', 300),
  menuItem('royal-milk-tea', 'Royal Milk Tea', 'Canned milk tea.', 'Cold beverages', ASSETS.kappa, 'Cold', 300),
  menuItem('strawberry-milk', 'Strawberry Milk', 'Canned strawberry milk.', 'Cold beverages', ASSETS.kappa, 'Cold', 300),
  menuItem('water-bottle', 'Water Bottle', 'Crystal Geyser bottled water.', 'Cold beverages', ASSETS.kappa, 'Cold', 100),
  menuItem('coke', 'Coke', 'Classic canned soda.', 'Cold beverages', ASSETS.kappa, 'Cold', 200),
  menuItem('ginger-ale', 'Ginger Ale', 'Canada Dry canned ginger ale.', 'Cold beverages', ASSETS.kappa, 'Cold', 200),
  menuItem('squirt', 'Squirt', 'Bright citrus soda.', 'Cold beverages', ASSETS.kappa, 'Cold', 200),
  menuItem('root-beer', 'Root Beer', "A&W canned root beer.", 'Cold beverages', ASSETS.kappa, 'Cold', 200),
  menuItem('ito-en-jasmine', 'Ito En Jasmine Tea', 'Unsweetened bottled jasmine iced tea.', 'Cold beverages', ASSETS.kappa, 'Cold', 350),
  menuItem('ito-en-oolong', 'Ito En Oolong Tea', 'Unsweetened 16 oz bottled oolong tea.', 'Cold beverages', ASSETS.kappa, 'Cold', 350),
  menuItem('ito-en-green-tea', 'Ito En Green Tea', 'Unsweetened bottled green tea.', 'Cold beverages', ASSETS.kappa, 'Cold', 350),
  menuItem('ito-en-hojicha', 'Ito En Hojicha', 'Unsweetened roasted tea.', 'Cold beverages', ASSETS.kappa, 'Cold', 350),
  menuItem('ito-en-matcha', 'Ito En Matcha', 'Unsweetened bottled matcha tea.', 'Cold beverages', ASSETS.kappa, 'Cold', 450),
  menuItem('ito-en-milk-tea', 'Ito En Black Milk Tea', '12 oz bottled black milk tea.', 'Cold beverages', ASSETS.kappa, 'Cold', 350),
  menuItem('ucc-cafe-latte', 'UCC Cafe Latte', '8 oz canned cafe latte.', 'Cold beverages', ASSETS.kappa, 'Cold', 350),
  menuItem('ucc-matcha-latte', 'UCC Matcha Latte', '8 oz canned matcha latte.', 'Cold beverages', ASSETS.kappa, 'Cold', 350),
  menuItem('ucc-black-coffee', 'UCC Black Coffee', '8 oz canned black coffee.', 'Cold beverages', ASSETS.kappa, 'Cold', 350),
  menuItem('yokai-sauce', 'Yokai Sauce', 'House teriyaki sauce.', 'Sauce', ASSETS.salmon, 'Add to your order', 75),
  menuItem('oni-sauce', 'Oni Sauce', 'Chili-based spicy mayo.', 'Sauce', ASSETS.spicyTuna, 'A little spicy', 75),
  menuItem('tengu-sauce', 'Tengu Sauce', 'Miso and tamari sauce. Vegan and gluten-free.', 'Sauce', ASSETS.smores, 'Vegan · gluten-free', 75),
  menuItem('yokai-t-shirt', 'Yokai T-shirt', 'Please specify size in your order notes.', 'Merch!', ASSETS.karasu, 'Call for availability', 2500),
  menuItem('yokai-sticker', 'Yokai Sticker', 'A little Tengu for your water bottle or notebook.', 'Merch!', ASSETS.karasu, 'In stock', 300),
  menuItem('sakeru-long', 'Sakeru Long', 'A chewy Japanese snack for the road.', 'Other candy and snacks', ASSETS.smores, 'Pantry favorite', 399),
  menuItem('sakeru-original', 'Sakeru Original', 'A classic Japanese snack.', 'Other candy and snacks', ASSETS.smores, 'Pantry favorite', 299),
];

const CATEGORY_ORDER = [
  'Rectangle musubi',
  'Triangle onigiri',
  'Baked goods',
  'Hawaiian Sun',
  'Ramune',
  'Crack seed',
  'Cold beverages',
  'Sauce',
  'Merch!',
  'Other candy and snacks',
];
const TIME_SLOTS = ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM'];

const emptyDetails = {
  name: '',
  phone: '',
  date: '',
  time: '',
  address: '',
  city: 'Portland',
  zip: '',
  notes: '',
};

const formatPrice = (priceCents: number) => `$${(priceCents / 100).toFixed(2)}`;
const categoryId = (category: string) => `category-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

export default function OrderPage() {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = window.localStorage.getItem('yokai-musubi-cart');
      return saved ? JSON.parse(saved) as CartItem[] : [];
    } catch {
      return [];
    }
  });
  const [step, setStep] = useState<'menu' | 'checkout' | 'ready'>('menu');
  const [fulfillment, setFulfillment] = useState<Fulfillment>('pickup');
  const [details, setDetails] = useState(emptyDetails);
  const menuEndRef = useRef<HTMLDivElement>(null);
  const [atMenuEnd, setAtMenuEnd] = useState(false);

  const itemCount = useMemo(() => cart.reduce((sum, entry) => sum + entry.quantity, 0), [cart]);
  const subtotalCents = useMemo(() => cart.reduce((sum, entry) => sum + entry.item.priceCents * entry.quantity, 0), [cart]);
  const hasItems = cart.length > 0;

  useEffect(() => {
    window.localStorage.setItem('yokai-musubi-cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (step !== 'menu' || !menuEndRef.current) {
      setAtMenuEnd(false);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setAtMenuEnd(entry.isIntersecting), { rootMargin: '0px 0px -24px 0px' });
    observer.observe(menuEndRef.current);
    return () => observer.disconnect();
  }, [step]);

  const addItem = (item: MenuItem) => {
    setCart((current) => {
      const existing = current.find((entry) => entry.item.id === item.id);
      if (existing) {
        return current.map((entry) =>
          entry.item.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry,
        );
      }
      return [...current, { item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, direction: 'increase' | 'decrease') => {
    setCart((current) =>
      current
        .map((entry) => {
          if (entry.item.id !== id) return entry;
          const quantity = direction === 'increase' ? entry.quantity + 1 : entry.quantity - 1;
          return { ...entry, quantity };
        })
        .filter((entry) => entry.quantity > 0),
    );
  };

  const removeItem = (id: string) => {
    setCart((current) => current.filter((entry) => entry.item.id !== id));
  };

  const updateDetail = (field: keyof typeof emptyDetails, value: string) => {
    setDetails((current) => ({ ...current, [field]: value }));
  };

  const submitDetails = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStep('ready');
  };

  return (
    <div className="order-page min-h-[100dvh] bg-background text-foreground">
      <header className="border-b border-border/80 bg-background/95">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-5 sm:px-8 md:px-12">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to Yokai Musubi
          </Link>
          <div className="flex items-center gap-2 font-display text-sm font-extrabold tracking-[0.14em]">
            <ShoppingBag className="h-4 w-4 text-primary" />
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-5 pb-20 pt-10 sm:px-8 sm:pt-14 md:px-12 lg:pt-16">
        <div className="mb-10 max-w-4xl">
          <p className="mb-4 font-japanese text-sm tracking-[0.25em] text-primary">おむすびを、どうぞ</p>
          <h1 className="font-display text-[clamp(3.5rem,7vw,7.5rem)] font-extrabold leading-[0.87] tracking-[-0.06em]">
            ORDER DIRECT.<br /><span className="text-primary">FEEL GOOD.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-[1.75] text-muted-foreground sm:text-lg">
            Choose what sounds good, tell us when you&apos;ll be here, and we&apos;ll have it ready. A simple way to order your favorites for pickup or local delivery.
          </p>
          <div className="mt-8 grid gap-3 border-y border-border py-5 text-xs sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-3"><MapPin className="h-4 w-4 shrink-0 text-primary" /><span><strong className="block font-bold text-foreground">2190 W Burnside St</strong><span className="text-muted-foreground">Portland, Oregon</span></span></div>
            <div className="flex items-center gap-3"><Clock3 className="h-4 w-4 shrink-0 text-primary" /><span><strong className="block font-bold text-foreground">Pickup Tue–Sat · 9:00–3:30</strong><span className="text-muted-foreground">Delivery · 9:45–3:30</span></span></div>
            <div className="flex items-center gap-3"><Check className="h-4 w-4 shrink-0 text-primary" /><span><strong className="block font-bold text-foreground">Made with care</strong><span className="text-muted-foreground">Your favorites, ready when you are</span></span></div>
          </div>
        </div>

        {step === 'menu' && (
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
            <section aria-labelledby="menu-heading">
              <div className="mb-6 flex items-end justify-between gap-4 border-b border-border pb-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">The counter</p>
                  <h2 id="menu-heading" className="mt-2 font-display text-3xl font-bold tracking-[-0.04em]">Choose your favorites</h2>
                </div>
                <span className="hidden text-right text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:block">Made in Portland<br />Clear item pricing</span>
              </div>

              <nav aria-label="Menu categories" className="mb-10 flex gap-2 overflow-x-auto pb-2">
                {CATEGORY_ORDER.map((category) => (
                  <a key={category} href={`#${categoryId(category)}`} className="whitespace-nowrap border border-border bg-card px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                    {category}
                  </a>
                ))}
              </nav>

              <div className="space-y-12">
                {CATEGORY_ORDER.map((category) => (
                  <div key={category} id={categoryId(category)} className="scroll-mt-8">
                    <div className="mb-4 flex items-center gap-3">
                      <h3 className="font-display text-xl font-bold">{category}</h3>
                      <span className="h-px flex-1 bg-border" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {MENU.filter((item) => item.category === category).map((item) => (
                        <article
                          key={item.id}
                          role="button"
                          tabIndex={0}
                          aria-label={`Add ${item.title} to your order`}
                          onClick={(event) => {
                            if ((event.target as HTMLElement).closest('button')) return;
                            addItem(item);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              addItem(item);
                            }
                          }}
                          className="group flex min-w-0 cursor-pointer gap-4 border border-border bg-card p-3 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-[6px_6px_0_hsl(var(--primary)/.14)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                        >
                          <div className="h-24 w-24 shrink-0 overflow-hidden bg-secondary sm:h-28 sm:w-28">
                            <img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col py-1">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-display text-lg font-bold leading-tight">{item.title}</h4>
                              <span className="shrink-0 font-display text-sm font-bold text-primary">{formatPrice(item.priceCents)}</span>
                            </div>
                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                            <div className="mt-auto grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 pt-3">
                              <span className="min-w-0 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{item.availability}</span>
                              <button type="button" onClick={() => addItem(item)} className="inline-flex h-8 w-[4.5rem] shrink-0 items-center justify-center gap-1.5 whitespace-nowrap bg-foreground px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-background transition-colors hover:bg-primary">
                                Add <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <CartSummary cart={cart} onUpdateQuantity={updateQuantity} onRemove={removeItem} onProceed={() => setStep('checkout')} />
          </div>
        )}
        {step === 'menu' && <div ref={menuEndRef} aria-hidden="true" className="h-px" />}

        {step === 'checkout' && (
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
            <form onSubmit={submitDetails} className="space-y-10">
              <div className="flex items-center justify-between border-b border-border pb-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Step 2 of 2</p>
                  <h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.04em]">Almost there</h2>
                </div>
                <button type="button" onClick={() => setStep('menu')} className="text-xs font-bold uppercase tracking-[0.13em] text-muted-foreground transition-colors hover:text-primary">Edit order</button>
              </div>

              <fieldset>
                <legend className="mb-4 font-display text-xl font-bold">How will you get it?</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FulfillmentButton active={fulfillment === 'pickup'} icon={<Utensils className="h-5 w-5" />} title="Pickup" copy="2190 W Burnside St" onClick={() => setFulfillment('pickup')} />
                  <FulfillmentButton active={fulfillment === 'delivery'} icon={<Truck className="h-5 w-5" />} title="Local delivery" copy="Portland area · shown before payment" onClick={() => setFulfillment('delivery')} />
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-4 font-display text-xl font-bold">Your details</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Name" required>
                    <input required value={details.name} onChange={(event) => updateDetail('name', event.target.value)} placeholder="Your name" />
                  </FormField>
                  <FormField label="Phone" required>
                    <input required type="tel" value={details.phone} onChange={(event) => updateDetail('phone', event.target.value)} placeholder="(503) 000-0000" />
                  </FormField>
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-4 font-display text-xl font-bold">{fulfillment === 'pickup' ? 'Choose a pickup time' : 'Where should we bring it?'}</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Date" required>
                    <input required type="date" min={new Date().toISOString().slice(0, 10)} value={details.date} onChange={(event) => updateDetail('date', event.target.value)} />
                  </FormField>
                  <FormField label="Time" required>
                    <div className="relative">
                      <select required value={details.time} onChange={(event) => updateDetail('time', event.target.value)}>
                        <option value="">Select a time</option>
                        {TIME_SLOTS.map((time) => <option key={time} value={time}>{time}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </FormField>
                  {fulfillment === 'delivery' && (
                    <>
                      <FormField label="Street address" required className="sm:col-span-2">
                        <input required value={details.address} onChange={(event) => updateDetail('address', event.target.value)} placeholder="Street and apartment or suite" />
                      </FormField>
                      <FormField label="City" required>
                        <input required value={details.city} onChange={(event) => updateDetail('city', event.target.value)} />
                      </FormField>
                      <FormField label="ZIP code" required>
                        <input required inputMode="numeric" value={details.zip} onChange={(event) => updateDetail('zip', event.target.value)} placeholder="97210" />
                      </FormField>
                    </>
                  )}
                </div>
              </fieldset>

              <FormField label="Order notes (optional)" className="max-w-2xl">
                <textarea value={details.notes} onChange={(event) => updateDetail('notes', event.target.value)} placeholder="Anything we should know about your order?" rows={4} />
              </FormField>

              <div className="flex flex-col-reverse gap-3 border-t border-border pt-7 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" onClick={() => setStep('menu')} className="button button-outline justify-center px-6 py-4 text-xs">Back to menu</button>
                <button type="submit" className="button button-primary justify-center px-6 py-4 text-xs">Review order <ArrowRight className="h-4 w-4" /></button>
              </div>
            </form>

            <CartSummary cart={cart} onUpdateQuantity={updateQuantity} onRemove={removeItem} compact />
          </div>
        )}

        {step === 'ready' && (
          <section className="mx-auto max-w-3xl">
            <div className="border border-primary/30 bg-card p-6 shadow-[10px_10px_0_hsl(var(--primary)/.12)] sm:p-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-7 w-7" />
              </div>
              <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Order review ready</p>
              <h2 className="mt-3 font-display text-[clamp(2.8rem,6vw,5.5rem)] font-bold leading-[0.9] tracking-[-0.05em]">ONE LAST<br /><span className="text-primary">STEP.</span></h2>
              <p className="mt-7 max-w-xl text-base leading-[1.75] text-muted-foreground">
                Your {itemCount} {itemCount === 1 ? 'item is' : 'items are'} ready for {fulfillment}. The menu total is clear, and your order details go straight to Yokai Musubi.
              </p>

              <div className="mt-8 grid gap-3 border-y border-border py-6 text-sm sm:grid-cols-2">
                <div><span className="text-muted-foreground">Name</span><p className="mt-1 font-semibold">{details.name}</p></div>
                <div><span className="text-muted-foreground">Phone</span><p className="mt-1 font-semibold">{details.phone}</p></div>
                <div><span className="text-muted-foreground">When</span><p className="mt-1 font-semibold">{details.date} · {details.time}</p></div>
                <div><span className="text-muted-foreground">Fulfillment</span><p className="mt-1 font-semibold capitalize">{fulfillment}</p></div>
              </div>

              <div className="mt-7 border border-border bg-secondary/35">
                <div className="flex items-center justify-between border-b border-border px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  <span>Order summary</span><span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                </div>
                <div className="divide-y divide-border px-4">
                  {cart.map(({ item, quantity }) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                      <span className="min-w-0 truncate"><strong>{quantity}×</strong> {item.title}</span>
                      <span className="shrink-0 font-semibold">{formatPrice(item.priceCents * quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-border px-4 py-4 font-display text-lg font-bold">
                  <span>Menu subtotal</span><span>{formatPrice(subtotalCents)}</span>
                </div>
              </div>

              <div className="mt-7 flex gap-3 border border-border bg-secondary/50 p-4 text-sm leading-relaxed text-muted-foreground">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p>Payment is not connected yet.</p>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button type="button" disabled className="button button-primary cursor-not-allowed justify-center px-6 py-4 text-xs opacity-50">Continue to payment <ArrowRight className="h-4 w-4" /></button>
                <button type="button" onClick={() => setStep('checkout')} className="button button-outline justify-center px-6 py-4 text-xs">Edit details</button>
              </div>
            </div>
          </section>
        )}
      </main>
      {step === 'menu' && hasItems && !atMenuEnd && (
        <FloatingCart cart={cart} itemCount={itemCount} subtotalCents={subtotalCents} onProceed={() => setStep('checkout')} />
      )}
    </div>
  );
}

function FulfillmentButton({ active, icon, title, copy, onClick }: { active: boolean; icon: React.ReactNode; title: string; copy: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex items-start gap-4 border p-4 text-left transition-all ${active ? 'border-primary bg-primary/5 shadow-[4px_4px_0_hsl(var(--primary)/.18)]' : 'border-border bg-card hover:border-primary/50'}`}>
      <span className={active ? 'text-primary' : 'text-muted-foreground'}>{icon}</span>
      <span><strong className="block font-display text-lg">{title}</strong><span className="mt-1 block text-xs text-muted-foreground">{copy}</span></span>
    </button>
  );
}

function FormField({ label, required, className = '', children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}{required && <span className="ml-1 text-primary">*</span>}</span>
      {children}
    </label>
  );
}

function FloatingCart({ cart, itemCount, subtotalCents, onProceed }: { cart: CartItem[]; itemCount: number; subtotalCents: number; onProceed: () => void }) {
  return (
    <div className="floating-cart" role="region" aria-label="Your current order">
      <div className="flex min-w-0 items-center gap-3">
        <div className="floating-cart-icon"><ShoppingBag className="h-4 w-4" /></div>
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold">{itemCount} {itemCount === 1 ? 'item' : 'items'} selected</p>
          <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{cart.length} menu {cart.length === 1 ? 'choice' : 'choices'} · {formatPrice(subtotalCents)}</p>
        </div>
      </div>
      <button type="button" onClick={onProceed} className="button button-primary min-w-0 shrink-0 justify-center px-4 py-3 text-[10px]">View order <ArrowRight className="h-3.5 w-3.5" /></button>
    </div>
  );
}

function CartSummary({ cart, onUpdateQuantity, onRemove, onProceed, compact = false }: { cart: CartItem[]; onUpdateQuantity: (id: string, direction: 'increase' | 'decrease') => void; onRemove: (id: string) => void; onProceed?: () => void; compact?: boolean }) {
  const itemCount = cart.reduce((sum, entry) => sum + entry.quantity, 0);
  const subtotalCents = cart.reduce((sum, entry) => sum + entry.item.priceCents * entry.quantity, 0);

  return (
    <aside className={`border border-border bg-card ${compact ? '' : 'lg:sticky lg:top-8'}`}>
      <div className="border-b border-border px-5 py-5 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold tracking-[-0.03em]">Your order</h2>
          <ShoppingBag className="h-5 w-5 text-primary" />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{itemCount ? `${itemCount} ${itemCount === 1 ? 'item' : 'items'} selected` : 'Nothing on the counter yet'}</p>
      </div>

      {cart.length ? (
        <>
          <div className="divide-y divide-border">
            {cart.map(({ item, quantity }) => (
              <div key={item.id} className="flex gap-3 px-5 py-4 sm:px-6">
                <img src={item.image} alt="" className="h-14 w-14 shrink-0 object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-sm font-bold leading-tight">{item.title}</h3>
                    <button type="button" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.title}`} className="text-muted-foreground hover:text-primary"><X className="h-4 w-4" /></button>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.1em] text-primary">
                    <span>{formatPrice(item.priceCents)} each</span>
                    <span>{formatPrice(item.priceCents * quantity)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <button type="button" onClick={() => onUpdateQuantity(item.id, 'decrease')} aria-label={`Decrease ${item.title}`} className="flex h-6 w-6 items-center justify-center border border-border hover:border-primary hover:text-primary"><Minus className="h-3 w-3" /></button>
                    <span className="w-4 text-center text-xs font-bold">{quantity}</span>
                    <button type="button" onClick={() => onUpdateQuantity(item.id, 'increase')} aria-label={`Increase ${item.title}`} className="flex h-6 w-6 items-center justify-center border border-border hover:border-primary hover:text-primary"><Plus className="h-3 w-3" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border bg-secondary/45 px-5 py-5 sm:px-6">
            <div className="mb-4 flex items-center justify-between font-display text-lg font-bold">
              <span>Menu subtotal</span>
              <span>{formatPrice(subtotalCents)}</span>
            </div>
            <div className="flex items-start gap-3 text-xs leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p>Clear item pricing. Tax and any local delivery amount are shown before payment.</p>
            </div>
            {onProceed && (
              <button type="button" onClick={onProceed} className="button button-primary mt-5 w-full justify-center py-4 text-xs">Review pickup or delivery <ArrowRight className="h-4 w-4" /></button>
            )}
          </div>
        </>
      ) : (
        <div className="px-5 py-12 text-center sm:px-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground"><ShoppingBag className="h-5 w-5" /></div>
          <p className="mt-4 font-display text-lg font-bold">Your order is waiting.</p>
          <p className="mx-auto mt-2 max-w-[220px] text-sm leading-relaxed text-muted-foreground">Add something from the counter to get started.</p>
        </div>
      )}
    </aside>
  );
}