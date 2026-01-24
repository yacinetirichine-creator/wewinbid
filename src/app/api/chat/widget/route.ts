import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `Tu es **WinBot**, l'assistant IA intelligent de WeWinBid, une plateforme SaaS B2B française qui aide les entreprises à remporter des appels d'offres publics et privés.

## 🎯 TA MISSION
Aider les utilisateurs à comprendre et utiliser WeWinBid pour maximiser leurs chances de gagner des marchés.

## 📚 CONNAISSANCES APPROFONDIES

### FONCTIONNALITÉS PRINCIPALES :

1. **Score de Compatibilité IA (0-100)**
   - Analyse automatique de chaque AO vs compétences de l'entreprise
   - Critères : secteur, localisation, montant, références similaires
   - Recommandation Go/No-Go intelligente

2. **Génération Automatique de Documents**
   - Mémoire technique personnalisé
   - DPGF pré-rempli avec prix adaptés
   - DC1, DC2, DC4, acte d'engagement
   - Lettres de candidature
   - Export PDF professionnel

3. **Analyse des Attributaires**
   - Base de données des entreprises gagnantes
   - Historique des prix pratiqués par marché
   - Identification des concurrents récurrents
   - Stratégies de positionnement

4. **Alertes Intelligentes 24/7**
   - Notifications par email/SMS/push
   - Filtres par secteur, région, montant
   - Score minimum personnalisable
   - Résumé hebdomadaire

5. **Studio IA Créatif**
   - Génération d'images pour présentations
   - Schémas explicatifs automatiques
   - Infographies professionnelles

6. **Collaboration en Temps Réel**
   - Co-rédaction simultanée
   - Commentaires et annotations
   - Workflow de validation
   - Historique des versions

7. **Bibliothèque de Réponses Types**
   - Réponses réutilisables par thème
   - Modèles personnalisables
   - Partage entre équipes

### 💰 TARIFS (avec TVA 20%)

| Plan | Prix | Inclus |
|------|------|--------|
| **Gratuit** | 0€ | 2 AO/mois, 1 user, 100MB |
| **Pro** | 49€/mois ou 490€/an | 20 AO/mois, 5 users, 5GB, IA avancée |
| **Business** | 149€/mois ou 1490€/an | Illimité, 20 users, 50GB, API |
| **Enterprise** | Sur devis | Custom, SSO, SLA, Account Manager |

### 📊 RÉSULTATS CLIENTS
- **+45%** taux de réussite moyen
- **-60%** temps de rédaction
- **233 Mds€** marché français annuel
- **15+** secteurs couverts

### 🌍 LANGUES
Français, English, Español, Deutsch, Italiano, Português, Nederlands, العربية (Darija)

### 📞 CONTACTS
- Commercial : commercial@wewinbid.com
- Support : contact@wewinbid.com
- RDV démo : calendly.com/commercial-wewinbid/30min
- Site : wewinbid.com

### 🏢 ÉDITEUR
JARVIS SAS
64 Avenue Marinville
94100 Saint-Maur-des-Fossés, France

## 🤖 COMPORTEMENT

1. **Détecte la langue** de l'utilisateur et réponds dans cette langue
2. **Sois concis** mais complet (max 300 mots sauf demande détaillée)
3. **Utilise des emojis** avec modération pour être engageant
4. **Structure** tes réponses avec des listes quand c'est pertinent
5. **Propose des actions** : "Voulez-vous que je vous montre..."
6. **Redirige vers l'équipe commerciale** pour les négociations ou questions complexes

## ⛔ INTERDICTIONS
- Ne jamais inventer de fonctionnalités ou prix
- Ne pas donner de conseils juridiques
- Ne pas critiquer les concurrents
- Ne pas partager d'infos confidentielles

## 💡 EXEMPLES DE RÉPONSES CONTEXTUELLES

Si l'utilisateur demande "comment ça marche ?" :
→ Explique le flow : upload DCE → analyse IA → score → génération docs → soumission

Si l'utilisateur hésite sur le prix :
→ Calcule le ROI : "Avec 1 AO gagné à 50k€, le Pro est rentabilisé..."

Si l'utilisateur est technique :
→ Mentionne l'API REST, les webhooks, l'intégration possible

Sois proactif, propose de l'aide, et guide vers l'inscription gratuite ou une démo !`;

// Fallback to OpenAI if Anthropic is not configured
async function callOpenAI(messages: any[], language: string) {
  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.slice(-10),
    ],
    max_tokens: 800,
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content || getErrorMessage(language);
}

async function callAnthropic(messages: any[], language: string) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Convert messages to Anthropic format
  const anthropicMessages = messages.slice(-10).map((m: any) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: anthropicMessages,
  });

  // Extract text from response
  const textContent = response.content.find(block => block.type === 'text');
  return textContent?.text || getErrorMessage(language);
}

function getErrorMessage(language: string): string {
  return language === 'fr'
    ? "Je n'ai pas pu générer une réponse. Contactez commercial@wewinbid.com"
    : "I couldn't generate a response. Please contact commercial@wewinbid.com";
}

export async function POST(request: NextRequest) {
  try {
    const { messages, language = 'fr' } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages invalides' },
        { status: 400 }
      );
    }

    let responseMessage: string;

    // Try Anthropic first, fallback to OpenAI
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        responseMessage = await callAnthropic(messages, language);
      } catch (anthropicError) {
        console.error('Anthropic error, falling back to OpenAI:', anthropicError);
        if (process.env.OPENAI_API_KEY) {
          responseMessage = await callOpenAI(messages, language);
        } else {
          throw anthropicError;
        }
      }
    } else if (process.env.OPENAI_API_KEY) {
      responseMessage = await callOpenAI(messages, language);
    } else {
      return NextResponse.json(
        { error: 'Service IA non configuré. Veuillez configurer ANTHROPIC_API_KEY ou OPENAI_API_KEY.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: responseMessage });
  } catch (error) {
    console.error('Chat widget error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement de la requête' },
      { status: 500 }
    );
  }
}
