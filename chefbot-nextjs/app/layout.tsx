import '../styles/globals.css'

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ChefBot — Votre chef IA personnel',
  description: 'Génère une recette à partir des ingrédients que vous avez.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-[url('/kitchen-bg.jpg')] bg-cover bg-center bg-no-repeat text-white relative">
  <div className="absolute inset-0 backdrop-blur-sm bg-white/20"></div>

  <div className="relative">
    <div className="mx-auto max-w-3xl px-4 py-10">
      

      {children}

      <footer className="mt-12 text-center text-sm text-neutral-700">
        Projet étudiant — Next.js + API IA
      </footer>
    </div>
  </div>
</body>

    </html>
  );
}