// app/api/generate/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type GeminiTextResp = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
};

type PantryItem = { name: string; qty: string };

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const pantry: PantryItem[] = Array.isArray(body?.pantry) ? body.pantry : [];
    const mode: string = typeof body?.mode === "string" ? body.mode : "none";
    const improve: boolean = Boolean(body?.improve);

    if (!pantry.length) {
      return new NextResponse('Paramètre "pantry" manquant ou vide.', { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new NextResponse("GEMINI_API_KEY manquant côté serveur.", { status: 500 });
    }

    const extraConstraint =
      mode === "lean"
        ? "Recette faible en calories, cuisson saine, pas de gras inutile."
        : mode === "protein"
        ? "Recette riche en protéines, prioriser viande/œufs/produits laitiers maigres/légumineuses."
        : mode === "veg"
        ? "Recette végétarienne uniquement, aucune viande ni poisson."
        : "Recette standard.";

    const textUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    const pantryPretty = pantry
      .map((x) => (x.qty ? `${x.name} (${x.qty})` : x.name))
      .join(", ");

    const prompt = `
Tu es un chef cuisinier. Génère STRICTEMENT un objet JSON valide (sans autre texte), au format EXACT:

{
  "title": "Titre de la recette",
  "timeEstimate": "30 min",
  "ingredients": ["..."], 
  "steps": ["..."],
  "missingIngredients": ["..."],
  "tips": ["..."]
}

Règles:
- Ecris en français.
- "ingredients" = liste complète pour réaliser la recette, avec quantités quand possible.
- "missingIngredients" = uniquement ce qui n'est PAS dans le panier, à acheter pour une version meilleure (goût/texture/équilibre).
- "tips" = 3 conseils courts et utiles.
- Si improve=true, fais une version plus gourmande/qualitative (sans être irréaliste).

Panier utilisateur: ${pantryPretty}
Contrainte nutritionnelle: ${extraConstraint}
improve=${improve ? "true" : "false"}
`.trim();

    const textBody = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    };

    const textRes = await fetch(textUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(textBody),
    });

    if (!textRes.ok) {
      const txt = await textRes.text();
      return new NextResponse(`Erreur Gemini (texte): ${txt}`, { status: 500 });
    }

    const textJson: GeminiTextResp = await textRes.json();

    let rawText = "";
    rawText = textJson.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!rawText) rawText = JSON.stringify(textJson);

    // Extraction JSON robuste
    let parsed: any = {};
    try {
      const firstBrace = rawText.indexOf("{");
      const lastBrace = rawText.lastIndexOf("}");
      if (firstBrace >= 0 && lastBrace > firstBrace) {
        const jsonStr = rawText.slice(firstBrace, lastBrace + 1);
        parsed = JSON.parse(jsonStr);
      } else {
        parsed = {};
      }
    } catch {
      parsed = {};
    }

    const result = {
      title: parsed.title ?? "Recette générée",
      timeEstimate: parsed.timeEstimate ?? "—",
      ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : pantryPretty.split(", ").filter(Boolean),
      steps: Array.isArray(parsed.steps) ? parsed.steps : ["Étapes indisponibles."],
      missingIngredients: Array.isArray(parsed.missingIngredients) ? parsed.missingIngredients : [],
      tips: Array.isArray(parsed.tips) ? parsed.tips : [],
    };

    return NextResponse.json(result);
  } catch (e: any) {
    return new NextResponse(`Erreur: ${e?.message ?? "inconnue"}`, { status: 500 });
  }
}
