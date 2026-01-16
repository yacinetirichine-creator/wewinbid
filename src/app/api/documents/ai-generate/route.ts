import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ============================================================
// POST - Generate AI content for document
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company
    const { data: member, error: memberError } = await supabase
      .from('team_members')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Not a team member' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { 
      generation_type,
      prompt,
      tender_id,
      context 
    } = body;

    if (!generation_type || !prompt) {
      return NextResponse.json(
        { error: 'generation_type and prompt are required' },
        { status: 400 }
      );
    }

    // Mock AI generation (in production, call OpenAI API)
    const startTime = Date.now();
    
    let generatedContent = '';
    
    // Simulate AI response based on type
    switch (generation_type) {
      case 'proposal':
        generatedContent = `# Proposition Technique et Financière

## 1. Introduction
Nous sommes ravis de vous présenter notre proposition pour ce projet. Notre équipe possède une expertise reconnue dans le domaine ${context?.sector || 'concerné'}.

## 2. Compréhension du besoin
Nous avons analysé votre cahier des charges et identifié les points clés suivants :
- Mise en place d'une solution ${context?.type || 'complète'}
- Respect des délais et du budget
- Garantie de qualité et performance

## 3. Notre approche
Notre méthodologie éprouvée comprend :
1. Phase d'analyse et de cadrage
2. Conception et développement
3. Tests et validation
4. Déploiement et formation
5. Support et maintenance

## 4. Équipe projet
Une équipe dédiée de ${context?.team_size || '5'} experts sera mobilisée :
- Chef de projet certifié
- Développeurs seniors
- Testeurs qualifiés
- Support technique

## 5. Planning prévisionnel
Durée estimée : ${context?.duration || '3 mois'}
Jalons principaux :
- J+15 : Cadrage finalisé
- J+30 : Conception validée
- J+60 : Développement terminé
- J+90 : Déploiement complet

## 6. Proposition financière
Budget global : ${context?.budget || '50 000'} € HT
Incluant :
- Prestations de développement
- Formation des utilisateurs
- Garantie 12 mois
- Support technique

## 7. Conclusion
Nous sommes convaincus que notre expérience et notre approche répondent parfaitement à vos attentes. Nous restons à votre disposition pour toute précision.`;
        break;

      case 'cover_letter':
        generatedContent = `Objet : Réponse à l'appel d'offres ${context?.reference || '[REF]'}

Madame, Monsieur,

Nous avons pris connaissance avec le plus grand intérêt de votre appel d'offres concernant ${context?.title || 'votre projet'}.

Notre société, forte de ${context?.experience || '10'} années d'expérience dans le secteur ${context?.sector || 'concerné'}, souhaite vous présenter sa candidature pour la réalisation de ce projet.

Nous disposons des compétences et des ressources nécessaires pour mener à bien cette mission dans les meilleures conditions de qualité, de délai et de coût.

Notre proposition technique et financière ci-jointe détaille notre compréhension de vos besoins ainsi que notre approche de réalisation.

Nous restons à votre entière disposition pour toute information complémentaire et pour vous rencontrer afin de vous présenter plus en détail notre offre.

Dans l'attente de votre retour, nous vous prions d'agréer, Madame, Monsieur, l'expression de nos salutations distinguées.`;
        break;

      case 'technical_response':
        generatedContent = `# Réponse Technique

## 1. Architecture technique
Notre solution s'appuie sur une architecture ${context?.architecture || 'moderne et scalable'} :
- Technologies : ${context?.technologies || 'React, Node.js, PostgreSQL'}
- Infrastructure : ${context?.infrastructure || 'Cloud (AWS/Azure)'}
- Sécurité : ${context?.security || 'Chiffrement end-to-end, authentification multi-facteurs'}

## 2. Fonctionnalités
Les fonctionnalités clés incluent :
- Interface utilisateur intuitive
- API REST sécurisée
- Base de données performante
- Système de backup automatique
- Monitoring en temps réel

## 3. Performance
Nos garanties de performance :
- Disponibilité : 99.9%
- Temps de réponse : < 200ms
- Capacité : ${context?.users || '10,000'} utilisateurs simultanés

## 4. Conformité
Respect des normes et réglementations :
- RGPD
- ISO 27001
- Accessibilité WCAG 2.1

## 5. Maintenance et évolutions
Support continu et évolutions programmées :
- Mises à jour de sécurité mensuelles
- Évolutions fonctionnelles trimestrielles
- Support technique 7j/7`;
        break;

      case 'section':
        generatedContent = `${prompt}

Ce contenu a été généré automatiquement. Veuillez l'adapter selon vos besoins spécifiques et vérifier qu'il correspond bien à vos exigences.`;
        break;

      default:
        generatedContent = `Contenu généré pour : ${prompt}`;
    }

    const generationTime = Date.now() - startTime;
    const tokensUsed = Math.floor(generatedContent.length / 4); // Approximation

    // Save to AI generation history
    const { error: historyError } = await supabase
      .from('ai_generation_history')
      .insert({
        company_id: member.company_id,
        user_id: user.id,
        tender_id: tender_id || null,
        generation_type,
        prompt,
        model: 'mock-gpt-4', // In production: 'gpt-4', 'claude-3', etc.
        generated_content: generatedContent,
        tokens_used: tokensUsed,
        generation_time_ms: generationTime,
      });

    if (historyError) {
      console.error('Error saving AI history:', historyError);
    }

    return NextResponse.json({
      content: generatedContent,
      tokens_used: tokensUsed,
      generation_time_ms: generationTime,
      model: 'mock-gpt-4',
    });
  } catch (error) {
    console.error('AI generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
