import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer toutes les sources externes
    const { data: sources, error: sourcesError } = await (supabase as any)
      .from('external_sources')
      .select('*')
      .order('name', { ascending: true });

    if (sourcesError) throw sourcesError;

    // Récupérer les statistiques de sync pour chaque source
    const sourcesWithStats = await Promise.all(
      (sources || []).map(async (source: any) => {
        const { data: logs, error: logsError } = await (supabase as any)
          .from('source_sync_logs')
          .select('*')
          .eq('source_id', source.id)
          .order('sync_started_at', { ascending: false })
          .limit(10);

        if (logsError) {
          console.error(`Error fetching logs for source ${source.id}:`, logsError);
        }

        // Calculer le taux de succès
        const totalSyncs = logs?.length || 0;
        const successfulSyncs = logs?.filter((log: any) => log.status === 'SUCCESS').length || 0;
        const success_rate = totalSyncs > 0 ? (successfulSyncs / totalSyncs) * 100 : 0;

        return {
          ...source,
          recent_logs: logs || [],
          success_rate: Math.round(success_rate),
          total_syncs: totalSyncs,
        };
      })
    );

    return NextResponse.json({ sources: sourcesWithStats });
  } catch (error) {
    console.error('Error fetching external sources:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des sources' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { source_id, is_active, sync_frequency, api_key_encrypted } = body;

    if (!source_id) {
      return NextResponse.json({ error: 'source_id requis' }, { status: 400 });
    }

    // Construire l'objet de mise à jour
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (typeof is_active === 'boolean') updates.is_active = is_active;
    if (sync_frequency) updates.sync_frequency = sync_frequency;
    if (api_key_encrypted) updates.api_key_encrypted = api_key_encrypted;

    // Mettre à jour la source
    const { data, error } = await (supabase as any)
      .from('external_sources')
      .update(updates)
      .eq('id', source_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ source: data });
  } catch (error) {
    console.error('Error updating external source:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la source' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { source_id } = body;

    if (!source_id) {
      return NextResponse.json({ error: 'source_id requis' }, { status: 400 });
    }

    // Créer un log de synchronisation
    const { data: log, error: logError } = await (supabase as any)
      .from('source_sync_logs')
      .insert({
        source_id,
        sync_started_at: new Date().toISOString(),
        status: 'RUNNING',
        tenders_found: 0,
        tenders_imported: 0,
      })
      .select()
      .single();

    if (logError) throw logError;

    // TODO: Déclencher la synchronisation réelle (à implémenter avec un service background)
    // Pour l'instant, simuler une synchronisation
    setTimeout(async () => {
      const randomTendersFound = Math.floor(Math.random() * 50) + 10;
      const randomTendersImported = Math.floor(randomTendersFound * (0.7 + Math.random() * 0.3));
      
      await (supabase as any)
        .from('source_sync_logs')
        .update({
          sync_ended_at: new Date().toISOString(),
          status: 'SUCCESS',
          tenders_found: randomTendersFound,
          tenders_imported: randomTendersImported,
        })
        .eq('id', log.id);

      await (supabase as any)
        .from('external_sources')
        .update({
          last_sync_at: new Date().toISOString(),
        })
        .eq('id', source_id);
    }, 3000);

    return NextResponse.json({ 
      message: 'Synchronisation démarrée',
      log 
    });
  } catch (error) {
    console.error('Error triggering sync:', error);
    return NextResponse.json(
      { error: 'Erreur lors du démarrage de la synchronisation' },
      { status: 500 }
    );
  }
}
