import { useEffect, useState } from 'react';
import { supabase, type Product } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import { Plus, Pencil, Trash2, X, Cross, LogOut, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type AdminPageProps = {
  onExit: () => void;
};

type EditProduct = Partial<Product> & {
  id?: string;
};

const emptyProduct: EditProduct = {
  name: '',
  description: '',
  price: 0,
  image_url: '',
  category: 'sieraden',
  gender: 'unisex',
  featured: false,
  in_stock: true,
};

export default function AdminPage({ onExit }: AdminPageProps) {
  const { signOut } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setError(error.message);
    } else if (data) {
      setProducts(data as Product[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.name || !editing.description || !editing.image_url || editing.price == null) {
      setError('Vul alle velden in (naam, beschrijving, prijs en afbeelding URL).');
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      name: editing.name,
      description: editing.description,
      price: Number(editing.price),
      image_url: editing.image_url,
      category: editing.category || 'accessories',
      gender: editing.gender || 'unisex',
      featured: editing.featured ?? false,
      in_stock: editing.in_stock ?? true,
    };

    if (editing.id) {
      const { error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', editing.id);
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.from('products').insert(payload);
      if (error) setError(error.message);
    }

    setSaving(false);
    if (!error) {
      setEditing(null);
      fetchProducts();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit product wilt verwijderen?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      setError(error.message);
    } else {
      fetchProducts();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onExit();
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Admin header */}
      <div className="bg-stone-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-800 flex items-center justify-center">
              <Cross className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Christian Lifestyle — Admin</h1>
              <p className="text-xs text-stone-400">Productbeheer</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              className="px-4 py-2 text-sm font-medium text-stone-300 hover:text-white transition-colors"
            >
              Naar winkel
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Uitloggen
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-stone-800">
            Producten ({products.length})
          </h2>
          <button
            onClick={() => setEditing({ ...emptyProduct })}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-800 text-white text-sm font-semibold rounded-xl hover:bg-amber-900 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Product toevoegen
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-stone-500">Laden...</div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
            <ImageIcon className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500 font-medium">Nog geen producten</p>
            <p className="text-sm text-stone-400 mt-1">
              Klik op "Product toevoegen" om je eerste product aan te maken.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-[3/2] bg-stone-100 overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-stone-800 text-sm truncate">
                        {product.name}
                      </h3>
                      <p className="text-xs text-stone-500 mt-0.5 capitalize">
                        {product.category} · {product.gender} · {formatPrice(product.price)}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {product.featured && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                          Uitgelicht
                        </span>
                      )}
                      {!product.in_stock && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                          Uitverkocht
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setEditing(product)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Bewerken
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Verwijderen
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit/Create modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 sticky top-0 bg-white rounded-t-3xl">
              <h2 className="text-lg font-bold text-stone-800">
                {editing.id ? 'Product bewerken' : 'Nieuw product'}
              </h2>
              <button
                onClick={() => setEditing(null)}
                className="p-2 rounded-full hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5 text-stone-600" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Naam
                </label>
                <input
                  type="text"
                  value={editing.name || ''}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:border-amber-700 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-sm"
                  placeholder="Bijv. Kruis Halsketting"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Beschrijving
                </label>
                <textarea
                  value={editing.description || ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:border-amber-700 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-sm resize-none"
                  placeholder="Korte beschrijving van het product"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    Prijs (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editing.price ?? ''}
                    onChange={(e) => setEditing({ ...editing, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:border-amber-700 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-sm"
                    placeholder="24.99"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    Categorie
                  </label>
                  <select
                    value={editing.category || 'accessories'}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:border-amber-700 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-sm"
                  >
                    <option value="sieraden">Sieraden</option>
                    <option value="wonen-inspiratie">Wonen & inspiratie</option>
                    <option value="bijbel-onderweg">Bijbel & onderweg</option>
                    <option value="baby-kinderen">Baby & kinderen</option>
                    <option value="doop-gelegenheden">Doop & gelegenheden</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Voor wie
                </label>
                <select
                  value={editing.gender || 'unisex'}
                  onChange={(e) => setEditing({ ...editing, gender: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:border-amber-700 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-sm"
                >
                  <option value="unisex">Unisex</option>
                  <option value="dames">Dames</option>
                  <option value="heren">Heren</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Afbeelding URL
                </label>
                <input
                  type="url"
                  value={editing.image_url || ''}
                  onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:border-amber-700 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-sm"
                  placeholder="https://voorbeeld.nl/foto.jpg"
                />
                {editing.image_url && (
                  <img
                    src={editing.image_url}
                    alt="Voorbeeld"
                    className="mt-2 w-full h-32 object-cover rounded-xl border border-stone-200"
                  />
                )}
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.featured ?? false}
                    onChange={(e) => setEditing({ ...editing, featured: e.target.checked })}
                    className="w-4 h-4 rounded accent-amber-800"
                  />
                  <span className="text-sm text-stone-700">Uitgelicht op homepage</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.in_stock ?? true}
                    onChange={(e) => setEditing({ ...editing, in_stock: e.target.checked })}
                    className="w-4 h-4 rounded accent-amber-800"
                  />
                  <span className="text-sm text-stone-700">Op voorraad</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-stone-200 sticky bottom-0 bg-white rounded-b-3xl">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 py-2.5 border border-stone-300 text-stone-700 font-medium rounded-xl hover:bg-stone-50 transition-colors text-sm"
              >
                Annuleren
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-amber-800 text-white font-semibold rounded-xl hover:bg-amber-900 transition-colors disabled:opacity-50 text-sm"
              >
                {saving ? 'Opslaan...' : 'Opslaan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
