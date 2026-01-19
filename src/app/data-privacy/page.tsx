'use client';

import { useState } from 'react';
import { Card, Button } from '@/components/ui';
import { Download, Trash2, FileText, AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import Link from 'next/link';

export default function DataPrivacyPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/user/export-data', {
        method: 'POST',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wewinbid-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Erreur lors de l\'export des données');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Erreur lors de l\'export des données');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteData = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
      });
      
      if (response.ok) {
        window.location.href = '/auth/login?deleted=true';
      } else {
        alert('Erreur lors de la suppression du compte');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Erreur lors de la suppression du compte');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="border-b border-surface-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/settings" className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary-600" />
            <span className="font-display font-bold text-xl">Mes Données Personnelles (RGPD)</span>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-surface-900 mb-3">
            Gestion de vos données personnelles
          </h1>
          <p className="text-surface-600 leading-relaxed">
            Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, de portabilité
            et de suppression de vos données personnelles.
          </p>
        </div>

        <div className="space-y-6">
          {/* Droit d'accès */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-surface-900 mb-2">
                  Droit d'accès et de portabilité
                </h3>
                <p className="text-surface-600 mb-4">
                  Téléchargez une copie complète de toutes vos données personnelles stockées sur WeWinBid
                  au format JSON (profil, entreprise, tenders, documents, etc.).
                </p>
                <Button
                  onClick={handleExportData}
                  disabled={isExporting}
                  variant="outline"
                  className="inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {isExporting ? 'Export en cours...' : 'Exporter mes données'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Droit de rectification */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-success-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-success-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-surface-900 mb-2">
                  Droit de rectification
                </h3>
                <p className="text-surface-600 mb-4">
                  Corrigez ou mettez à jour vos informations personnelles à tout moment depuis vos paramètres.
                </p>
                <Link href="/settings?tab=profile">
                  <Button variant="outline">
                    Modifier mes informations
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Consentement */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning-100 flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-warning-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-surface-900 mb-2">
                  Gestion des consentements
                </h3>
                <p className="text-surface-600 mb-4">
                  Gérez vos préférences concernant l'utilisation de vos données et les communications.
                </p>
                <Link href="/settings?tab=privacy">
                  <Button variant="outline">
                    Gérer mes consentements
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Droit à l'oubli */}
          <Card className="p-6 border-2 border-error-200 bg-error-50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-error-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-error-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-error-900 mb-2">
                  Droit à l'effacement (droit à l'oubli)
                </h3>
                <p className="text-error-700 mb-4">
                  <strong>⚠️ Action irréversible :</strong> La suppression de votre compte entraînera
                  la suppression définitive de toutes vos données personnelles, y compris vos tenders,
                  documents et historique. Cette action ne peut pas être annulée.
                </p>
                {!showDeleteConfirm ? (
                  <Button
                    onClick={() => setShowDeleteConfirm(true)}
                    variant="outline"
                    className="border-error-600 text-error-600 hover:bg-error-600 hover:text-white"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer mon compte et mes données
                  </Button>
                ) : (
                  <div className="p-4 bg-white rounded-lg border-2 border-error-300">
                    <p className="text-error-900 font-medium mb-3">
                      Êtes-vous absolument certain de vouloir supprimer votre compte ?
                    </p>
                    <p className="text-sm text-error-700 mb-4">
                      Cette action est définitive et supprimera :
                    </p>
                    <ul className="text-sm text-error-700 mb-4 list-disc list-inside space-y-1">
                      <li>Votre profil utilisateur</li>
                      <li>Tous vos tenders et réponses</li>
                      <li>Tous vos documents</li>
                      <li>Votre historique d'activité</li>
                      <li>Vos données d'abonnement</li>
                    </ul>
                    <div className="flex gap-3">
                      <Button
                        onClick={handleDeleteData}
                        disabled={isDeleting}
                        className="bg-error-600 hover:bg-error-700 text-white"
                      >
                        {isDeleting ? 'Suppression...' : 'Oui, supprimer définitivement'}
                      </Button>
                      <Button
                        onClick={() => setShowDeleteConfirm(false)}
                        variant="outline"
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Information RGPD */}
          <Card className="p-6 bg-primary-50 border-primary-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-primary-900 mb-2">
                  Vos droits RGPD
                </h4>
                <p className="text-sm text-primary-800 mb-3">
                  Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :
                </p>
                <ul className="text-sm text-primary-800 space-y-1 list-disc list-inside">
                  <li>Droit d'accès à vos données personnelles</li>
                  <li>Droit de rectification de vos données inexactes</li>
                  <li>Droit à l'effacement (droit à l'oubli)</li>
                  <li>Droit à la limitation du traitement</li>
                  <li>Droit à la portabilité de vos données</li>
                  <li>Droit d'opposition au traitement</li>
                  <li>Droit de retirer votre consentement à tout moment</li>
                </ul>
                <p className="text-sm text-primary-800 mt-3">
                  Pour toute question concernant vos données personnelles, contactez notre DPO à{' '}
                  <a href="mailto:commercial@wewinbid.com" className="font-medium underline">
                    commercial@wewinbid.com
                  </a>
                </p>
                <p className="text-sm text-primary-800 mt-2">
                  Vous pouvez également déposer une réclamation auprès de la CNIL :{' '}
                  <a 
                    href="https://www.cnil.fr" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium underline"
                  >
                    www.cnil.fr
                  </a>
                </p>
              </div>
            </div>
          </Card>

          {/* Documents légaux */}
          <Card className="p-6">
            <h4 className="font-semibold text-surface-900 mb-4">
              Documents légaux
            </h4>
            <div className="space-y-2">
              <Link 
                href="/legal/privacy" 
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 hover:underline"
              >
                <FileText className="w-4 h-4" />
                Politique de Confidentialité
              </Link>
              <Link 
                href="/legal/terms" 
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 hover:underline"
              >
                <FileText className="w-4 h-4" />
                Conditions Générales d'Utilisation (CGU)
              </Link>
              <Link 
                href="/legal/cookies" 
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 hover:underline"
              >
                <FileText className="w-4 h-4" />
                Politique de Cookies
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
