import { useEffect, useState } from 'react';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import ProductGrid from '@/components/ProductGrid';
import ProductModal from '@/components/ProductModal';
import CartDrawer from '@/components/CartDrawer';
import About from '@/components/About';
import Footer from '@/components/Footer';
import LoginPage from '@/components/LoginPage';
import AdminPage from '@/components/AdminPage';
import type { Product } from '@/lib/supabase';
import { Sparkles } from 'lucide-react';

type View = 'home' | 'shop' | 'about';

const categories = [
  { key: 'all', label: 'Alle producten' },
  { key: 'sieraden', label: 'Sieraden' },
  { key: 'wonen-inspiratie', label: 'Wonen & inspiratie' },
  { key: 'bijbel-onderweg', label: 'Bijbel & onderweg' },
  { key: 'baby-kinderen', label: 'Baby & kinderen' },
  { key: 'doop-gelegenheden', label: 'Doop & gelegenheden' },
];

const genders = [
  { key: 'all', label: 'Iedereen' },
  { key: 'dames', label: 'Dames' },
  { key: 'heren', label: 'Heren' },
  { key: 'unisex', label: 'Unisex' },
];

function AppContent() {
  const { session, loading } = useAuth();
  const [view, setView] = useState<View>('home');
  const [category, setCategory] = useState('all');
  const [gender, setGender] = useState('all');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // Check URL hash for #admin on load
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#admin') {
        if (session) {
          setShowAdmin(true);
        } else {
          setShowLogin(true);
        }
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [session]);

  const handleNavigate = (newView: View) => {
    setView(newView);
    setShowAdmin(false);
    setShowLogin(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminClick = () => {
    setShowAdmin(true);
  };

  const handleLoginSuccess = () => {
    setShowLogin(false);
    setShowAdmin(true);
  };

  const handleProductClick = (product: Product) => {
    setSelectedProductId(product.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-8 h-8 border-3 border-amber-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (showLogin) {
    return (
      <AuthProvider>
        <LoginPage
          onSuccess={handleLoginSuccess}
          onBack={() => setShowLogin(false)}
        />
      </AuthProvider>
    );
  }

  if (showAdmin && session) {
    return (
      <AuthProvider>
        <AdminPage onExit={() => setShowAdmin(false)} />
      </AuthProvider>
    );
  }

  return (
    <CartProvider>
      <div className="min-h-screen bg-white flex flex-col">
        <Header
          onNavigate={handleNavigate}
          currentView={view}
          onAdminClick={handleAdminClick}
        />

        <main className="flex-1">
          {view === 'home' && (
            <>
              <Hero onShopNow={() => handleNavigate('shop')} />
              <Features />

              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-amber-700" />
                  <span className="text-sm font-medium text-amber-800">
                    Uitgelicht
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-8">
                  Onze favorieten
                </h2>
                <ProductGrid showFeatured onProductClick={handleProductClick} />
                <div className="text-center mt-10">
                  <button
                    onClick={() => handleNavigate('shop')}
                    className="px-8 py-3.5 border-2 border-amber-800 text-amber-800 font-semibold rounded-full hover:bg-amber-800 hover:text-white transition-all"
                  >
                    Bekijk alle producten
                  </button>
                </div>
              </section>
            </>
          )}

          {view === 'shop' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="text-center mb-10">
                <h1 className="text-3xl sm:text-4xl font-bold text-stone-800">
                  Onze collectie
                </h1>
                <p className="mt-3 text-stone-600 max-w-xl mx-auto">
                  Ontdek christelijke shirts, sieraden en accessoires — allemaal met liefde gemaakt.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {categories.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setCategory(cat.key)}
                    className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${
                      category === cat.key
                        ? 'bg-amber-800 text-white shadow-md'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap justify-center gap-2 mb-10">
                {genders.map((g) => (
                  <button
                    key={g.key}
                    onClick={() => setGender(g.key)}
                    className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
                      gender === g.key
                        ? 'bg-stone-800 text-white shadow-sm'
                        : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>

              <ProductGrid category={category} gender={gender} onProductClick={handleProductClick} />
            </div>
          )}

          {view === 'about' && <About />}
        </main>

        <Footer />

        <CartDrawer />
        <ProductModal
          productId={selectedProductId}
          onClose={() => setSelectedProductId(null)}
        />
      </div>
    </CartProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
