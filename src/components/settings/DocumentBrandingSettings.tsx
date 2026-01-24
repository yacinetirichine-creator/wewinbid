'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Image,
  FileText,
  Hash,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Save,
  Eye,
  Upload,
  Check,
  Building2,
} from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

export interface DocumentBrandingOptions {
  logoUrl: string | null;
  logoPosition: 'header' | 'footer' | 'both' | 'none';
  logoSize: 'small' | 'medium' | 'large';
  companyNameInHeader: boolean;
  companyNameInFooter: boolean;
  primaryColor: string;
  pageNumberFormat: 'arabic' | 'roman' | 'none';
  pageNumberPosition: 'bottom-center' | 'bottom-right' | 'top-right';
  showPageTotal: boolean;
  headerText: string;
  footerText: string;
}

const defaultOptions: DocumentBrandingOptions = {
  logoUrl: null,
  logoPosition: 'header',
  logoSize: 'medium',
  companyNameInHeader: true,
  companyNameInFooter: false,
  primaryColor: '#3B82F6',
  pageNumberFormat: 'arabic',
  pageNumberPosition: 'bottom-center',
  showPageTotal: true,
  headerText: '',
  footerText: '',
};

interface DocumentBrandingSettingsProps {
  companyId: string;
  companyName: string;
  companyLogo?: string | null;
}

export function DocumentBrandingSettings({
  companyId,
  companyName,
  companyLogo,
}: DocumentBrandingSettingsProps) {
  const [options, setOptions] = useState<DocumentBrandingOptions>({
    ...defaultOptions,
    logoUrl: companyLogo || null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [companyId]);

  const loadSettings = async () => {
    try {
      // First try localStorage
      const localData = localStorage.getItem(`branding_${companyId}`);
      if (localData) {
        const brandingData = JSON.parse(localData) as DocumentBrandingOptions;
        setOptions({
          ...defaultOptions,
          ...brandingData,
          logoUrl: companyLogo || brandingData.logoUrl,
        });
        return;
      }

      // Then try API
      const response = await fetch(`/api/settings/branding?company_id=${companyId}`);
      if (response.ok) {
        const { branding } = await response.json();
        if (branding) {
          setOptions({
            ...defaultOptions,
            ...branding,
            logoUrl: companyLogo || branding.logoUrl,
          });
        }
      }
    } catch {
      // Use defaults on error
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage as backup and for immediate use
      localStorage.setItem(`branding_${companyId}`, JSON.stringify(options));

      // Try to save to database via API
      const response = await fetch('/api/settings/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          document_branding: options,
        }),
      });

      if (!response.ok) {
        console.warn('Could not save to database, using localStorage');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving branding settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateOption = <K extends keyof DocumentBrandingOptions>(
    key: K,
    value: DocumentBrandingOptions[K]
  ) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
          <Image className="w-5 h-5 text-primary-600" />
          Logo de l'entreprise
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Logo Preview */}
          <div className="flex flex-col items-center justify-center p-6 bg-surface-50 rounded-xl border-2 border-dashed border-surface-200">
            {options.logoUrl ? (
              <img
                src={options.logoUrl}
                alt="Logo entreprise"
                className="max-w-[200px] max-h-[100px] object-contain mb-4"
              />
            ) : (
              <div className="w-24 h-24 rounded-xl bg-surface-200 flex items-center justify-center mb-4">
                <Building2 className="w-12 h-12 text-surface-400" />
              </div>
            )}
            <p className="text-sm text-surface-500 text-center">
              {options.logoUrl ? 'Logo actuel' : 'Aucun logo configuré'}
            </p>
            <p className="text-xs text-surface-400 mt-1">
              Modifiez le logo dans Paramètres &gt; Entreprise
            </p>
          </div>

          {/* Logo Position */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-surface-700">
              Position du logo
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'header', label: 'En-tête', icon: '↑' },
                { value: 'footer', label: 'Pied de page', icon: '↓' },
                { value: 'both', label: 'Les deux', icon: '↕' },
                { value: 'none', label: 'Aucun', icon: '✕' },
              ].map((pos) => (
                <button
                  key={pos.value}
                  onClick={() => updateOption('logoPosition', pos.value as any)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    options.logoPosition === pos.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-surface-200 hover:border-surface-300'
                  }`}
                >
                  <span className="text-lg">{pos.icon}</span>
                  <span className="block text-sm mt-1">{pos.label}</span>
                </button>
              ))}
            </div>

            <label className="block text-sm font-medium text-surface-700 mt-4">
              Taille du logo
            </label>
            <div className="flex gap-2">
              {['small', 'medium', 'large'].map((size) => (
                <button
                  key={size}
                  onClick={() => updateOption('logoSize', size as any)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all capitalize ${
                    options.logoSize === size
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-surface-200 hover:border-surface-300'
                  }`}
                >
                  {size === 'small' ? 'Petit' : size === 'medium' ? 'Moyen' : 'Grand'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary-600" />
          Nom de l'entreprise
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-surface-50 rounded-lg">
            <div>
              <p className="font-medium text-surface-900">Afficher en en-tête</p>
              <p className="text-sm text-surface-500">Le nom "{companyName}" apparaîtra en haut des pages</p>
            </div>
            <button
              onClick={() => updateOption('companyNameInHeader', !options.companyNameInHeader)}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                options.companyNameInHeader ? 'bg-primary-600' : 'bg-surface-300'
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  options.companyNameInHeader ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-surface-50 rounded-lg">
            <div>
              <p className="font-medium text-surface-900">Afficher en pied de page</p>
              <p className="text-sm text-surface-500">Le nom apparaîtra en bas des pages</p>
            </div>
            <button
              onClick={() => updateOption('companyNameInFooter', !options.companyNameInFooter)}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                options.companyNameInFooter ? 'bg-primary-600' : 'bg-surface-300'
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  options.companyNameInFooter ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
          <Hash className="w-5 h-5 text-primary-600" />
          Numérotation des pages
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-surface-700">
              Format de numérotation
            </label>
            <div className="space-y-2">
              {[
                { value: 'arabic', label: '1, 2, 3...', desc: 'Numérotation classique' },
                { value: 'roman', label: 'I, II, III...', desc: 'Chiffres romains' },
                { value: 'none', label: 'Aucune', desc: 'Pas de numéro de page' },
              ].map((format) => (
                <button
                  key={format.value}
                  onClick={() => updateOption('pageNumberFormat', format.value as any)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                    options.pageNumberFormat === format.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-surface-200 hover:border-surface-300'
                  }`}
                >
                  <div className="text-left">
                    <span className="font-medium text-surface-900">{format.label}</span>
                    <span className="block text-sm text-surface-500">{format.desc}</span>
                  </div>
                  {options.pageNumberFormat === format.value && (
                    <Check className="w-5 h-5 text-primary-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-surface-700">
              Position des numéros
            </label>
            <div className="space-y-2">
              {[
                { value: 'bottom-center', label: 'Centré en bas', icon: AlignCenter },
                { value: 'bottom-right', label: 'À droite en bas', icon: AlignRight },
                { value: 'top-right', label: 'À droite en haut', icon: AlignRight },
              ].map((pos) => (
                <button
                  key={pos.value}
                  onClick={() => updateOption('pageNumberPosition', pos.value as any)}
                  disabled={options.pageNumberFormat === 'none'}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    options.pageNumberPosition === pos.value && options.pageNumberFormat !== 'none'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-surface-200 hover:border-surface-300'
                  } ${options.pageNumberFormat === 'none' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <pos.icon className="w-5 h-5 text-surface-500" />
                  <span className="font-medium text-surface-900">{pos.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between p-4 bg-surface-50 rounded-lg mt-4">
              <div>
                <p className="font-medium text-surface-900">Afficher le total</p>
                <p className="text-sm text-surface-500">Ex: "Page 1 / 10"</p>
              </div>
              <button
                onClick={() => updateOption('showPageTotal', !options.showPageTotal)}
                disabled={options.pageNumberFormat === 'none'}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  options.showPageTotal && options.pageNumberFormat !== 'none'
                    ? 'bg-primary-600'
                    : 'bg-surface-300'
                } ${options.pageNumberFormat === 'none' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    options.showPageTotal && options.pageNumberFormat !== 'none' ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-surface-900 mb-4">
          Couleur principale
        </h3>
        <div className="flex items-center gap-4">
          <input
            type="color"
            value={options.primaryColor}
            onChange={(e) => updateOption('primaryColor', e.target.value)}
            className="w-12 h-12 rounded-lg border-2 border-surface-200 cursor-pointer"
          />
          <div>
            <p className="font-medium text-surface-900">{options.primaryColor}</p>
            <p className="text-sm text-surface-500">Couleur des titres et accents</p>
          </div>
        </div>
      </Card>

      {/* Preview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-surface-900">Prévisualisation</h3>
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {showPreview ? 'Masquer' : 'Afficher'}
          </Button>
        </div>

        {showPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white border border-surface-200 rounded-lg p-8 shadow-inner"
          >
            {/* Mock document preview */}
            <div className="aspect-[210/297] max-w-[400px] mx-auto bg-white shadow-lg border border-surface-200 p-6 text-xs">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-surface-200">
                {(options.logoPosition === 'header' || options.logoPosition === 'both') && options.logoUrl && (
                  <img
                    src={options.logoUrl}
                    alt="Logo"
                    className={`object-contain ${
                      options.logoSize === 'small' ? 'h-6' : options.logoSize === 'medium' ? 'h-8' : 'h-10'
                    }`}
                  />
                )}
                {options.companyNameInHeader && (
                  <span className="font-bold" style={{ color: options.primaryColor }}>
                    {companyName}
                  </span>
                )}
                {options.pageNumberPosition === 'top-right' && options.pageNumberFormat !== 'none' && (
                  <span className="text-surface-500">
                    Page {options.pageNumberFormat === 'roman' ? 'I' : '1'}
                    {options.showPageTotal && ' / 10'}
                  </span>
                )}
              </div>

              {/* Content placeholder */}
              <div className="space-y-3">
                <div className="h-3 bg-surface-200 rounded w-3/4" style={{ backgroundColor: options.primaryColor, opacity: 0.2 }}></div>
                <div className="h-2 bg-surface-100 rounded w-full"></div>
                <div className="h-2 bg-surface-100 rounded w-full"></div>
                <div className="h-2 bg-surface-100 rounded w-5/6"></div>
                <div className="h-2 bg-surface-100 rounded w-full"></div>
                <div className="h-3 bg-surface-200 rounded w-1/2 mt-4" style={{ backgroundColor: options.primaryColor, opacity: 0.2 }}></div>
                <div className="h-2 bg-surface-100 rounded w-full"></div>
                <div className="h-2 bg-surface-100 rounded w-4/5"></div>
              </div>

              {/* Footer */}
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between pt-4 border-t border-surface-200">
                <div className="flex items-center gap-2">
                  {(options.logoPosition === 'footer' || options.logoPosition === 'both') && options.logoUrl && (
                    <img
                      src={options.logoUrl}
                      alt="Logo"
                      className="h-4 object-contain"
                    />
                  )}
                  {options.companyNameInFooter && (
                    <span className="text-surface-500">{companyName}</span>
                  )}
                </div>
                {options.pageNumberPosition.startsWith('bottom') && options.pageNumberFormat !== 'none' && (
                  <span className={`text-surface-500 ${
                    options.pageNumberPosition === 'bottom-center' ? 'mx-auto' : ''
                  }`}>
                    Page {options.pageNumberFormat === 'roman' ? 'I' : '1'}
                    {options.showPageTotal && ' / 10'}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button
          onClick={saveSettings}
          disabled={isSaving}
          className="bg-primary-600 hover:bg-primary-700 text-white"
        >
          {isSaving ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Enregistrement...
            </>
          ) : saved ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Enregistré
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Enregistrer les paramètres
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default DocumentBrandingSettings;
