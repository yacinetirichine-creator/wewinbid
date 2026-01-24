'use client';

import { useState, useMemo } from 'react';
import {
  SECTOR_TEMPLATES,
  TENDER_TYPES,
  searchTemplates,
  getTemplatesForTenderType,
  type SectorTemplate,
  type TenderType
} from '@/lib/templates/sector-templates';

interface TemplateSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: SectorTemplate, tenderType: TenderType) => void;
  language?: 'fr' | 'en';
}

export function TemplateSelectorModal({
  isOpen,
  onClose,
  onSelect,
  language = 'fr'
}: TemplateSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenderType, setSelectedTenderType] = useState<string>('ao-public-fr');
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  const tenderType = TENDER_TYPES.find(t => t.id === selectedTenderType);

  const filteredTemplates = useMemo(() => {
    if (searchQuery.trim()) {
      return searchTemplates(searchQuery, language);
    }
    return getTemplatesForTenderType(selectedTenderType);
  }, [searchQuery, selectedTenderType, language]);

  const groupedTenderTypes = useMemo(() => {
    const groups: { [key: string]: TenderType[] } = {
      'France': [],
      'Europe': [],
      'International': [],
      'Privé': []
    };

    TENDER_TYPES.forEach(type => {
      if (!type.isPublic) {
        groups['Privé'].push(type);
      } else if (type.countries.includes('FR')) {
        groups['France'].push(type);
      } else if (type.countries.includes('EU') || ['BE', 'CH', 'LU'].some(c => type.countries.includes(c))) {
        groups['Europe'].push(type);
      } else {
        groups['International'].push(type);
      }
    });

    return groups;
  }, []);

  if (!isOpen) return null;

  const labels = {
    fr: {
      title: 'Sélectionner un template',
      subtitle: 'Choisissez un secteur et un type d\'appel d\'offres',
      search: 'Rechercher un secteur...',
      tenderType: 'Type d\'appel d\'offres',
      sectors: 'Secteurs disponibles',
      templates: 'templates',
      select: 'Sélectionner',
      cancel: 'Annuler',
      publicTenders: 'Marchés publics',
      privateTenders: 'Consultations privées',
      documents: 'Documents disponibles',
      supportsPublic: 'AO Publics',
      supportsPrivate: 'AO Privés',
      supportsInternational: 'International'
    },
    en: {
      title: 'Select a template',
      subtitle: 'Choose a sector and tender type',
      search: 'Search for a sector...',
      tenderType: 'Tender type',
      sectors: 'Available sectors',
      templates: 'templates',
      select: 'Select',
      cancel: 'Cancel',
      publicTenders: 'Public tenders',
      privateTenders: 'Private consultations',
      documents: 'Available documents',
      supportsPublic: 'Public tenders',
      supportsPrivate: 'Private tenders',
      supportsInternational: 'International'
    }
  };

  const t = labels[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t.title}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {t.subtitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar - Tender types */}
          <div className="w-64 border-r border-slate-200 dark:border-slate-700 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              {t.tenderType}
            </h3>

            {Object.entries(groupedTenderTypes).map(([group, types]) => (
              types.length > 0 && (
                <div key={group} className="mb-4">
                  <h4 className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase mb-2">
                    {group}
                  </h4>
                  <div className="space-y-1">
                    {types.map(type => (
                      <button
                        key={type.id}
                        onClick={() => setSelectedTenderType(type.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedTenderType === type.id
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {language === 'fr' ? type.name : type.nameEn}
                      </button>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>

          {/* Main content - Templates grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t.sectors}
              </h3>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {filteredTemplates.length} {t.templates}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedSector === template.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                  }`}
                  onClick={() => setSelectedSector(template.id)}
                >
                  {/* Icon and title */}
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${template.color}20` }}
                    >
                      {template.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 dark:text-white truncate">
                        {language === 'fr' ? template.name : template.nameEn}
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {language === 'fr' ? template.description : template.descriptionEn}
                      </p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {template.isPublic && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                        {t.supportsPublic}
                      </span>
                    )}
                    {template.isPrivate && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                        {t.supportsPrivate}
                      </span>
                    )}
                    {template.countries.length === 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                        {t.supportsInternational}
                      </span>
                    )}
                  </div>

                  {/* Documents count */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {t.documents}: {template.documentTypes.length}
                    </span>
                  </div>

                  {/* Selected indicator */}
                  {selectedSector === template.id && (
                    <div className="absolute top-3 right-3">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {t.cancel}
          </button>
          <button
            onClick={() => {
              const template = SECTOR_TEMPLATES.find(t => t.id === selectedSector);
              if (template && tenderType) {
                onSelect(template, tenderType);
                onClose();
              }
            }}
            disabled={!selectedSector}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t.select}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TemplateSelectorModal;
