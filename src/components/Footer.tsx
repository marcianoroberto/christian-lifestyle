import { Cross, Mail, Globe } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-full bg-amber-700 flex items-center justify-center">
                <Cross className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Christian Lifestyle</span>
            </div>
            <p className="text-sm text-stone-400 leading-relaxed">
              Christelijke producten met liefde gemaakt. Draag je geloof met trots.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Winkel</h3>
            <ul className="space-y-2 text-sm">
              <li><span className="hover:text-amber-400 transition-colors cursor-pointer">Shirts</span></li>
              <li><span className="hover:text-amber-400 transition-colors cursor-pointer">Sieraden</span></li>
              <li><span className="hover:text-amber-400 transition-colors cursor-pointer">Accessoires</span></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Service</h3>
            <ul className="space-y-2 text-sm">
              <li><span className="hover:text-amber-400 transition-colors cursor-pointer">Verzending & levering</span></li>
              <li><span className="hover:text-amber-400 transition-colors cursor-pointer">Retourneren</span></li>
              <li><span className="hover:text-amber-400 transition-colors cursor-pointer">Veelgestelde vragen</span></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Contact</h3>
            <a href="mailto:vasildanov2013@gmail.com" className="flex items-center gap-2 text-sm text-stone-400 hover:text-amber-400 transition-colors">
              <Mail className="w-4 h-4" />
              vasildanov2013@gmail.com
            </a>
            <a href="https://christianlifestyle.nl" className="flex items-center gap-2 text-sm text-stone-400 hover:text-amber-400 transition-colors mt-3">
              <Globe className="w-4 h-4" />
              christianlifestyle.nl
            </a>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-stone-800 text-center text-sm text-stone-500">
          <p>&copy; {new Date().getFullYear()} Christian Lifestyle. Met liefde gemaakt.</p>
        </div>
      </div>
    </footer>
  );
}
