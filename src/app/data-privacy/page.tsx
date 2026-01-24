'use client';

import { useMemo, useState } from 'react';
import { Card, Button } from '@/components/ui';
import { Download, Trash2, FileText, AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';

export default function DataPrivacyPage() {
  const { locale } = useLocale();
  const entries = useMemo(
    () => ({
      'dataPrivacy.header.title': 'My personal data (GDPR)',

      'dataPrivacy.title': 'Manage your personal data',
      'dataPrivacy.subtitle': 'In accordance with the GDPR, you have the right to access, rectify, port and delete your personal data.',

      'dataPrivacy.section.access.title': 'Right of access & portability',
      'dataPrivacy.section.access.description': 'Download a complete copy of all your personal data stored on WeWinBid as JSON (profile, company, tenders, documents, etc.).',
      'dataPrivacy.section.access.action.export': 'Export my data',
      'dataPrivacy.section.access.action.exporting': 'Exporting…',

      'dataPrivacy.section.rectification.title': 'Right to rectification',
      'dataPrivacy.section.rectification.description': 'Update your personal information at any time from your settings.',
      'dataPrivacy.section.rectification.action': 'Edit my information',

      'dataPrivacy.section.consent.title': 'Consent management',
      'dataPrivacy.section.consent.description': 'Manage your preferences regarding how your data is used and communications.',
      'dataPrivacy.section.consent.action': 'Manage my consents',

      'dataPrivacy.section.deletion.title': 'Right to erasure (right to be forgotten)',
      'dataPrivacy.section.deletion.descriptionPrefix': '⚠️ Irreversible action:',
      'dataPrivacy.section.deletion.description': 'Deleting your account will permanently remove all your personal data, including your tenders, documents and activity history. This action cannot be undone.',
      'dataPrivacy.section.deletion.action.start': 'Delete my account and data',

      'dataPrivacy.section.deletion.confirm.title': 'Are you absolutely sure you want to delete your account?',
      'dataPrivacy.section.deletion.confirm.subtitle': 'This action is permanent and will delete:',
      'dataPrivacy.section.deletion.confirm.item.profile': 'Your user profile',
      'dataPrivacy.section.deletion.confirm.item.tenders': 'All your tenders and responses',
      'dataPrivacy.section.deletion.confirm.item.documents': 'All your documents',
      'dataPrivacy.section.deletion.confirm.item.activity': 'Your activity history',
      'dataPrivacy.section.deletion.confirm.item.subscription': 'Your subscription data',
      'dataPrivacy.section.deletion.confirm.action.delete': 'Yes, delete permanently',
      'dataPrivacy.section.deletion.confirm.action.deleting': 'Deleting…',
      'dataPrivacy.section.deletion.confirm.action.cancel': 'Cancel',

      'dataPrivacy.gdpr.title': 'Your GDPR rights',
      'dataPrivacy.gdpr.subtitle': 'Under the General Data Protection Regulation (GDPR), you have the following rights:',
      'dataPrivacy.gdpr.right.access': 'Right to access your personal data',
      'dataPrivacy.gdpr.right.rectification': 'Right to rectify inaccurate data',
      'dataPrivacy.gdpr.right.erasure': 'Right to erasure (right to be forgotten)',
      'dataPrivacy.gdpr.right.restriction': 'Right to restrict processing',
      'dataPrivacy.gdpr.right.portability': 'Right to data portability',
      'dataPrivacy.gdpr.right.objection': 'Right to object to processing',
      'dataPrivacy.gdpr.right.withdraw': 'Right to withdraw your consent at any time',
      'dataPrivacy.gdpr.dpo': 'For any question regarding your personal data, contact our DPO at ',
      'dataPrivacy.gdpr.cnil': 'You can also file a complaint with the CNIL: ',

      'dataPrivacy.legal.title': 'Legal documents',
      'dataPrivacy.legal.privacy': 'Privacy policy',
      'dataPrivacy.legal.terms': 'Terms of use',
      'dataPrivacy.legal.cookies': 'Cookies policy',

      'dataPrivacy.error.export': 'Error while exporting data',
      'dataPrivacy.error.delete': 'Error while deleting account',
    }),
    []
  );
  const { t } = useUiTranslations(locale, entries);

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
        alert(t('dataPrivacy.error.export'));
      }
    } catch (error) {
      console.error('Export error:', error);
      alert(t('dataPrivacy.error.export'));
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
        alert(t('dataPrivacy.error.delete'));
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert(t('dataPrivacy.error.delete'));
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
            <span className="font-display font-bold text-xl">{t('dataPrivacy.header.title')}</span>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-surface-900 mb-3">
            {t('dataPrivacy.title')}
          </h1>
          <p className="text-surface-600 leading-relaxed">
            {t('dataPrivacy.subtitle')}
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
                  {t('dataPrivacy.section.access.title')}
                </h3>
                <p className="text-surface-600 mb-4">
                  {t('dataPrivacy.section.access.description')}
                </p>
                <Button
                  onClick={handleExportData}
                  disabled={isExporting}
                  variant="outline"
                  className="inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {isExporting ? t('dataPrivacy.section.access.action.exporting') : t('dataPrivacy.section.access.action.export')}
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
                  {t('dataPrivacy.section.rectification.title')}
                </h3>
                <p className="text-surface-600 mb-4">
                  {t('dataPrivacy.section.rectification.description')}
                </p>
                <Link href="/settings?tab=profile">
                  <Button variant="outline">
                    {t('dataPrivacy.section.rectification.action')}
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
                  {t('dataPrivacy.section.consent.title')}
                </h3>
                <p className="text-surface-600 mb-4">
                  {t('dataPrivacy.section.consent.description')}
                </p>
                <Link href="/settings?tab=privacy">
                  <Button variant="outline">
                    {t('dataPrivacy.section.consent.action')}
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
                  {t('dataPrivacy.section.deletion.title')}
                </h3>
                <p className="text-error-700 mb-4">
                  <strong>{t('dataPrivacy.section.deletion.descriptionPrefix')}</strong> {t('dataPrivacy.section.deletion.description')}
                </p>
                {!showDeleteConfirm ? (
                  <Button
                    onClick={() => setShowDeleteConfirm(true)}
                    variant="outline"
                    className="border-error-600 text-error-600 hover:bg-error-600 hover:text-white"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('dataPrivacy.section.deletion.action.start')}
                  </Button>
                ) : (
                  <div className="p-4 bg-white rounded-lg border-2 border-error-300">
                    <p className="text-error-900 font-medium mb-3">
                      {t('dataPrivacy.section.deletion.confirm.title')}
                    </p>
                    <p className="text-sm text-error-700 mb-4">
                      {t('dataPrivacy.section.deletion.confirm.subtitle')}
                    </p>
                    <ul className="text-sm text-error-700 mb-4 list-disc list-inside space-y-1">
                      <li>{t('dataPrivacy.section.deletion.confirm.item.profile')}</li>
                      <li>{t('dataPrivacy.section.deletion.confirm.item.tenders')}</li>
                      <li>{t('dataPrivacy.section.deletion.confirm.item.documents')}</li>
                      <li>{t('dataPrivacy.section.deletion.confirm.item.activity')}</li>
                      <li>{t('dataPrivacy.section.deletion.confirm.item.subscription')}</li>
                    </ul>
                    <div className="flex gap-3">
                      <Button
                        onClick={handleDeleteData}
                        disabled={isDeleting}
                        className="bg-error-600 hover:bg-error-700 text-white"
                      >
                        {isDeleting ? t('dataPrivacy.section.deletion.confirm.action.deleting') : t('dataPrivacy.section.deletion.confirm.action.delete')}
                      </Button>
                      <Button
                        onClick={() => setShowDeleteConfirm(false)}
                        variant="outline"
                      >
                        {t('dataPrivacy.section.deletion.confirm.action.cancel')}
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
                  {t('dataPrivacy.gdpr.title')}
                </h4>
                <p className="text-sm text-primary-800 mb-3">
                  {t('dataPrivacy.gdpr.subtitle')}
                </p>
                <ul className="text-sm text-primary-800 space-y-1 list-disc list-inside">
                  <li>{t('dataPrivacy.gdpr.right.access')}</li>
                  <li>{t('dataPrivacy.gdpr.right.rectification')}</li>
                  <li>{t('dataPrivacy.gdpr.right.erasure')}</li>
                  <li>{t('dataPrivacy.gdpr.right.restriction')}</li>
                  <li>{t('dataPrivacy.gdpr.right.portability')}</li>
                  <li>{t('dataPrivacy.gdpr.right.objection')}</li>
                  <li>{t('dataPrivacy.gdpr.right.withdraw')}</li>
                </ul>
                <p className="text-sm text-primary-800 mt-3">
                  {t('dataPrivacy.gdpr.dpo')}
                  <a href="mailto:commercial@wewinbid.com" className="font-medium underline">
                    commercial@wewinbid.com
                  </a>
                </p>
                <p className="text-sm text-primary-800 mt-2">
                  {t('dataPrivacy.gdpr.cnil')}
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
              {t('dataPrivacy.legal.title')}
            </h4>
            <div className="space-y-2">
              <Link 
                href="/legal/privacy" 
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 hover:underline"
              >
                <FileText className="w-4 h-4" />
                {t('dataPrivacy.legal.privacy')}
              </Link>
              <Link 
                href="/legal/terms" 
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 hover:underline"
              >
                <FileText className="w-4 h-4" />
                {t('dataPrivacy.legal.terms')}
              </Link>
              <Link 
                href="/legal/cookies" 
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 hover:underline"
              >
                <FileText className="w-4 h-4" />
                {t('dataPrivacy.legal.cookies')}
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
