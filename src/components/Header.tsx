import { ShoppingBag, Cross, Settings } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

type View = 'home' | 'shop' | 'about';

type HeaderProps = {
  onNavigate: (view: View) => void;
  currentView: string;
  onAdminClick: () => void;
};

export default function Header({ onNavigate, currentView, onAdminClick }: HeaderProps) {
  const { totalItems, setIsCartOpen } = useCart();
  const { isAdmin } = useAuth();

  const navItems = [
    { label: 'Home', view: 'home' as const },
    { label: 'Winkel', view: 'shop' as const },
    { label: 'Over Ons', view: 'about' as const },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 group"
          >
            <div className="w-9 h-9 rounded-full bg-amber-800 flex items-center justify-center transition-transform group-hover:scale-110">
              <Cross className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-stone-800 tracking-tight hidden sm:block">
              Christian Lifestyle
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => onNavigate(item.view)}
                className={`text-sm font-medium transition-colors relative py-1 ${
                  currentView === item.view
                    ? 'text-amber-800'
                    : 'text-stone-600 hover:text-amber-800'
                }`}
              >
                {item.label}
                {currentView === item.view && (
                  <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-amber-800 rounded-full" />
                )}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={onAdminClick}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Beheer</span>
              </button>
            )}
            <button
              onClick={() => onNavigate('shop')}
              className="md:hidden text-sm font-medium text-stone-600 hover:text-amber-800 transition-colors"
            >
              Winkel
            </button>
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-full hover:bg-stone-100 transition-colors"
              aria-label="Winkelmandje"
            >
              <ShoppingBag className="w-5 h-5 text-stone-700" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-800 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-in fade-in zoom-in duration-300">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
