import { Truck, Shield, Headphones, RefreshCw } from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: Truck,
      title: 'Gratis verzending',
      text: 'Bij bestellingen vanaf €50,00',
    },
    {
      icon: Shield,
      title: 'Veilig betalen',
      text: 'iDEAL, Bancontact en meer',
    },
    {
      icon: RefreshCw,
      title: '30 dagen ruilen',
      text: 'Niet tevreden? Ruil of retour',
    },
    {
      icon: Headphones,
      title: 'Persoonlijke service',
      text: 'We staan voor je klaar',
    },
  ];

  return (
    <section className="border-y border-stone-200 bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white border border-stone-200 flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-stone-800">
                  {feature.title}
                </h3>
                <p className="text-xs text-stone-500">{feature.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
