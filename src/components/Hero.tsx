import { useEffect, useState } from 'react';
import { Cross, Sparkles, BookOpen } from 'lucide-react';
import { supabase, type SiteSettings } from '@/lib/supabase';

type HeroProps = {
  onShopNow: () => void;
};

const defaultImages = [
  'https://images.pexels.com/photos/6576196/pexels-photo-6576196.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/29218181/pexels-photo-29218181.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/6752279/pexels-photo-6752279.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/16122152/pexels-photo-16122152.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
];

export default function Hero({ onShopNow }: HeroProps) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSettings(data as SiteSettings);
      });
  }, []);

  const title = settings?.hero_title || 'Draag je geloof met trots en stijl';
  const subtitle =
    settings?.hero_subtitle ||
    'Ontdek onze collectie christelijke shirts, sieraden en accessoires. Elk stuk is met liefde gemaakt om je geloof te delen.';

  const images = [
    settings?.hero_image_1 || defaultImages[0],
    settings?.hero_image_2 || defaultImages[1],
    settings?.hero_image_3 || defaultImages[2],
    settings?.hero_image_4 || defaultImages[3],
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100">

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-100 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span className="text-sm font-medium text-amber-800">
                Welkom bij Christian Lifestyle
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-800 leading-tight tracking-tight">
              {title.split(' ').slice(0, -2).join(' ')}
              <span className="block text-amber-800 mt-1">
                {title.split(' ').slice(-2).join(' ')}
              </span>
            </h1>

            <p className="mt-6 text-lg text-stone-600 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              {subtitle}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button
                onClick={onShopNow}
                className="px-8 py-3.5 bg-amber-800 text-white font-semibold rounded-full hover:bg-amber-900 transition-all hover:shadow-lg active:scale-[0.98]"
              >
                Bekijk collectie
              </button>
            </div>

            <div className="mt-10 flex items-center gap-6 justify-center lg:justify-start">
              <div className="flex items-center gap-2">
                <Cross className="w-5 h-5 text-amber-700" />
                <span className="text-sm text-stone-600 font-medium">
                  Met liefde gemaakt
                </span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-700" />
                <span className="text-sm text-stone-600 font-medium">
                  Bijbelse waarden
                </span>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-xl">
                  <img src={images[0]} alt="Product 1" className="w-full h-full object-cover" />
                </div>
                <div className="aspect-square rounded-2xl overflow-hidden shadow-xl">
                  <img src={images[1]} alt="Product 2" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="aspect-square rounded-2xl overflow-hidden shadow-xl">
                  <img src={images[2]} alt="Product 3" className="w-full h-full object-cover" />
                </div>
                <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-xl">
                  <img src={images[3]} alt="Product 4" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
