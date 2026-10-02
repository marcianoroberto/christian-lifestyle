import { Cross, Sparkles, BookOpen, Heart } from 'lucide-react';

export default function About() {
  const values = [
    {
      icon: Cross,
      title: 'Met liefde gemaakt',
      text: 'Elk product is met zorg en toewijding ontworpen om je geloof op een stijlvolle manier uit te dragen.',
    },
    {
      icon: BookOpen,
      title: 'Bijbelse waarden',
      text: 'Onze collectie is geïnspireerd op Bijbelse teksten en christelijke symbolen die hoop en liefde verspreiden.',
    },
    {
      icon: Sparkles,
      title: 'Kwaliteit waarop je kunt vertrouwen',
      text: 'We selecteren alleen de beste materialen zodat je jarenlang plezier hebt van je aankoop.',
    },
    {
      icon: Heart,
      title: 'Geloof delen',
      text: 'Elk stuk is een gespreksstarter — een manier om je geloof op een natuurlijke manier met anderen te delen.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-100 rounded-full mb-4">
          <Cross className="w-4 h-4 text-amber-700" />
          <span className="text-sm font-medium text-amber-800">Ons verhaal</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-stone-800">
          Over Christian Lifestyle
        </h1>
        <p className="mt-4 text-lg text-stone-600 leading-relaxed max-w-2xl mx-auto">
          Wij geloven dat geloof en stijl perfect samengaan. Christian Lifestyle is
          ontstaan uit de wens om christelijke producten te maken die je met trots
          draagt — elke dag weer.
        </p>
      </div>

      <div className="bg-gradient-to-br from-amber-50 to-stone-50 rounded-3xl p-8 sm:p-12 mb-12">
        <p className="text-lg text-stone-700 leading-relaxed text-center italic">
          "Want uit de overvloed van het hart spreekt de mond."
          <span className="block text-sm text-stone-500 mt-2 not-italic">
            — Mattheüs 12:34
          </span>
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {values.map((value, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-6 border border-stone-200 hover:shadow-lg transition-shadow"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
              <value.icon className="w-6 h-6 text-amber-700" />
            </div>
            <h3 className="font-bold text-stone-800 text-lg">{value.title}</h3>
            <p className="text-stone-600 text-sm mt-2 leading-relaxed">
              {value.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
