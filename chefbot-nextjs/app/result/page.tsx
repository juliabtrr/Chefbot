'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Recipe = {
  title: string;
  timeEstimate: string;
  ingredients: string[];
  steps: string[];
  missingIngredients?: string[];
  tips?: string[];
};

type StoredRequest = {
  pantry: Array<{ name: string; qty: string }>;
  mode: 'none' | 'lean' | 'protein' | 'veg';
};

export default function ResultPage() {
  const router = useRouter();

  const [data, setData] = useState<Recipe | null>(null);
  const [reqData, setReqData] = useState<StoredRequest | null>(null);

  const [improving, setImproving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('chefbot_result');
    const storedReq = localStorage.getItem('chefbot_request');

    if (!stored || !storedReq) {
      router.push('/');
      return;
    }

    try {
      setData(JSON.parse(stored));
      setReqData(JSON.parse(storedReq));
    } catch {
      router.push('/');
    }
  }, [router]);

  const speakText = useMemo(() => {
    if (!data) return '';
    return [
      data.title,
      `Temps estimé: ${data.timeEstimate}`,
      `Ingrédients: ${data.ingredients?.join(', ')}`,
      `Étapes: ${data.steps?.map((s, i) => `Étape ${i + 1}: ${s}`).join('. ')}`
    ].join('. ');
  }, [data]);

  function speak() {
    if (typeof window === 'undefined') return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(speakText);
    utter.lang = 'fr-FR';
    synth.speak(utter);
  }
  function pauseSpeech() {
    if (typeof window === 'undefined') return;
    window.speechSynthesis.pause();
  }
  function resumeSpeech() {
    if (typeof window === 'undefined') return;
    window.speechSynthesis.resume();
  }
  function stopSpeech() {
    if (typeof window === 'undefined') return;
    window.speechSynthesis.cancel();
  }

  async function improveRecipe() {
    if (!reqData) return;
    setErr(null);
    setImproving(true);
    stopSpeech();

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pantry: reqData.pantry, mode: reqData.mode, improve: true })
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Erreur serveur');
      }

      const improved = await res.json();
      localStorage.setItem('chefbot_result', JSON.stringify(improved));
      setData(improved);
    } catch (e: any) {
      setErr(e?.message || 'Impossible d’améliorer la recette');
    } finally {
      setImproving(false);
    }
  }

  if (!data) return null;

  return (
    <main className="rounded-xl bg-white/75 backdrop-blur-lg p-8 shadow-md max-w-3xl mx-auto mt-32 text-black border border-white/20">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold text-black">{data.title}</h1>
        <span className="text-sm text-neutral-700">{data.timeEstimate}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="mb-2 font-semibold text-lg text-black">Ingrédients</h2>
          <ul className="list-disc space-y-1 pl-6 text-sm text-black">
            {data.ingredients?.map((it, i) => (
              <li key={i}>{it}</li>
            ))}
          </ul>

          {data.missingIngredients?.length ? (
            <div className="mt-6">
              <h2 className="mb-2 font-semibold text-lg text-black">
                À acheter (pour une meilleure version)
              </h2>
              <ul className="list-disc space-y-1 pl-6 text-sm text-black">
                {data.missingIngredients.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-lg text-black">Étapes</h2>
          <ol className="list-decimal space-y-2 pl-6 text-sm text-black">
            {data.steps?.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>

          {data.tips?.length ? (
            <div className="mt-6">
              <h2 className="mb-2 font-semibold text-lg text-black">Conseils du chef</h2>
              <ul className="list-disc space-y-1 pl-6 text-sm text-black">
                {data.tips.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      {err && <p className="mt-6 text-sm text-red-600">{err}</p>}

      <div className="mt-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={speak}
            className="rounded-lg bg-white/60 px-4 py-2 text-sm hover:bg-white/80 transition"
          >
            Lire
          </button>
          <button
            onClick={pauseSpeech}
            className="rounded-lg bg-white/60 px-4 py-2 text-sm hover:bg-white/80 transition"
          >
            Pause
          </button>
          <button
            onClick={resumeSpeech}
            className="rounded-lg bg-white/60 px-4 py-2 text-sm hover:bg-white/80 transition"
          >
            Reprendre
          </button>
          <button
            onClick={stopSpeech}
            className="rounded-lg bg-white/60 px-4 py-2 text-sm hover:bg-white/80 transition"
          >
            Stop
          </button>

          <button
            onClick={improveRecipe}
            disabled={improving}
            className="rounded-lg bg-black/70 px-4 py-2 text-sm text-white hover:bg-black/80 transition disabled:opacity-50"
          >
            {improving ? 'Amélioration…' : 'Améliorer la recette'}
          </button>
        </div>

        <button
          onClick={() => {
            stopSpeech();
            localStorage.removeItem('chefbot_result');
            // on garde chefbot_request pour que l'utilisateur puisse regénérer vite si tu veux,
            // mais si tu veux le vider aussi, décommente la ligne suivante:
            // localStorage.removeItem('chefbot_request');
            router.push('/');
          }}
          className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:brightness-110 transition"
        >
          Nouvelle recette
        </button>
      </div>
    </main>
  );
}
