import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Cross, Lock, Mail } from 'lucide-react';

type LoginPageProps = {
  onSuccess: () => void;
  onBack: () => void;
};

export default function LoginPage({ onSuccess, onBack }: LoginPageProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn(email, password);

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    onSuccess();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-stone-200 p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-full bg-amber-800 flex items-center justify-center mb-4">
              <Cross className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-stone-800">Admin inloggen</h1>
            <p className="text-sm text-stone-500 mt-1 text-center">
              Alleen vooraf ingestelde beheeraccounts hebben toegang.
            </p>
          </div>

          {error && (
            <div className="rounded-xl px-4 py-3 mb-4 text-sm bg-red-50 text-red-700 border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                E-mailadres
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:border-amber-700 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-sm"
                  placeholder="admin@voorbeeld.nl"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Wachtwoord
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:border-amber-700 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-800 text-white font-semibold rounded-xl hover:bg-amber-900 transition-colors disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? 'Bezig...' : 'Inloggen'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={onBack}
              className="text-sm text-stone-500 hover:text-stone-700 transition-colors"
            >
              Terug naar de winkel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
