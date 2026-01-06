'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type PantryItem = { name: string; qty: string };

function parsePantry(input: string): PantryItem[] {
  return input
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(':');
      if (idx === -1) return { name: line, qty: '' };
      const name = line.slice(0, idx).trim();
      const qty = line.slice(idx + 1).trim();
      return { name, qty };
    })
    .filter((x) => x.name.length > 0);
}

export default function HomePage() {
  const router = useRouter();

  const [pantryText, setPantryText] = useState(
    `pâtes: 250g\ntomates: 3\npoulet: 200g`
  );
  const [mode, setMode] = useState<'none' | 'lean' | 'protein' | 'veg'>('none');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const pantry = parsePantry(pantryText);

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pantry, mode, improve: false })
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Erreur serveur');
      }

      const data = await res.json();

      // on garde aussi la requête pour "Améliorer la recette" ensuite
      localStorage.setItem('chefbot_result', JSON.stringify(data));
      localStorage.setItem('chefbot_request', JSON.stringify({ pantry, mode }));

      router.push('/result');
    } catch (err: any) {
      setError(err?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex flex-col items-center mb-10 mt-20">
        <img src="/logo.svg" alt="ChefBot" className="h-12 w-12" />
        <h1 className="text-6xl font-extrabold tracking-tight text-neutral-900 mt-2">
          <span className="relative inline-block before:absolute before:inset-x-0 before:bottom-0 before:h-3 before:bg-brand/30 before:rounded-md before:-z-10">
            ChefBot
          </span>
        </h1>
      </div>

      <main className="rounded-xl bg-white/75 backdrop-blur-lg p-6 shadow-md max-w-2xl mx-auto mt-32 text-neutral-900 border border-white/20">
        <h2 className="mb-2 text-xl font-semibold text-brand">Votre panier</h2>
        <p className="mb-4 text-sm text-black">
          Écris un ingrédient par ligne. Format recommandé: <b>ingrédient: quantité</b>.
        </p>

        <form onSubmit={handleGenerate} className="grid gap-4">
          <textarea
            className="min-h-[170px] w-full resize-vertical rounded-lg border border-neutral-300 bg-white p-3 outline-none focus:border-brand/60 transition text-black"
            value={pantryText}
            onChange={(e) => setPantryText(e.target.value)}
            placeholder={`pâtes: 250g\ntomates: 3\npoulet: 200g`}
            required
          />

          <select
            className="rounded-lg border border-neutral-300 bg-white p-2 text-black"
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
          >
            <option value="none">Standard</option>
            <option value="lean">Healthy / Light</option>
            <option value="protein">High Protein</option>
            <option value="veg">Végétarien</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-brand px-4 py-2 font-medium text-white disabled:opacity-50 hover:brightness-110 transition"
          >
            {loading ? 'Préparation…' : 'Générer la recette'}
          </button>
        </form>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-8 text-xs text-neutral-600">
          Astuce: Si tu ne connais pas la quantité, écris juste l’ingrédient (ex: “citron”).
        </div>
      </main>
    </>
  );
}
