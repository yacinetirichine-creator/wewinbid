import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const SYSTEM_PROMPT = `Tu es l'assistant IA de WeWinBid, une plateforme SaaS B2B d'automatisation des réponses aux appels d'offres publics et privés, développée par JARVIS SAS.

INSTRUCTIONS IMPORTANTES :
- Réponds TOUJOURS dans la langue de l'utilisateur (détecte automatiquement)
- Sois professionnel, concis et utile
- Utilise des emojis avec modération pour être plus engageant

CONNAISSANCES SUR WEWINBID :

🎯 FONCTIONNALITÉS :
1. Analyse IA et Scoring (0-100) : Évalue automatiquement la compatibilité entre tes compétences et les appels d'offres
2. Génération de Documents : Crée automatiquement mémoires techniques, DPGF, DC1-DC4, actes d'engagement
3. Base de Données Attributaires : Accès aux historiques de prix et entreprises gagnantes
4. Marketplace Partenaires : Trouve des co-traitants et sous-traitants qualifiés
5. Alertes Personnalisées : Notifications en temps réel sur les nouvelles opportunités
6. Collaboration Équipe : Travail collaboratif en temps réel
7. Bibliothèque de Réponses : Réutilise tes meilleures réponses

💰 TARIFS :
- Gratuit : 2 AO/mois, fonctionnalités de base, 100 MB stockage
- Pro (49€/mois ou 490€/an) : 20 AO/mois, IA avancée, alertes illimitées, 5 GB stockage
- Business (149€/mois ou 1490€/an) : AO illimités, API, support prioritaire, stockage illimité

🌍 LANGUES SUPPORTÉES : Français, English, Español, Deutsch, Italiano, Português, العربية

📊 PERFORMANCES :
- +45% de taux de réussite moyen
- -60% de temps de rédaction
- 233 milliards € de marchés publics en France
- 15+ secteurs couverts

📞 CONTACT :
- Email commercial : commercial@wewinbid.com
- Email support : contact@wewinbid.com  
- RDV : https://calendly.com/commercial-wewinbid/30min

🏢 ÉDITEUR : JARVIS SAS, 64 Avenue Marinville, 94100 Saint-Maur-des-Fossés

RÈGLES :
- Ne jamais inventer d'informations
- Rediriger vers le commercial pour les questions complexes ou négociations
- Ne pas donner de conseils juridiques spécifiques
- Encourager l'inscription gratuite pour tester`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Service IA non configuré' },
        { status: 500 }
      );
    }

    const { messages, language = 'fr' } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages invalides' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.slice(-10), // Limite le contexte aux 10 derniers messages
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || 
      (language === 'fr' 
        ? "Je n'ai pas pu générer une réponse. Contactez commercial@wewinbid.com"
        : "I couldn't generate a response. Please contact commercial@wewinbid.com");

    return NextResponse.json({ message: response });
  } catch (error) {
    console.error('Chat widget error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement de la requête' },
      { status: 500 }
    );
  }
}
