'use client';

import { useState, useEffect } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { getAllCountries } from '@/lib/countries';

interface FilterPanelProps {
  onFilterChange: (filters: SearchFilters) => void;
  initialFilters?: SearchFilters;
}

export interface SearchFilters {
  country?: string[];
  sector?: string[];
  min_budget?: number;
  max_budget?: number;
  deadline_from?: string;
  deadline_to?: string;
  status?: string[];
}

const SECTORS = [
  'IT',
  'Technology',
  'Construction',
  'BTP',
  'Infrastructure',
  'Consulting',
  'Services',
  'Formation',
  'Maintenance',
  'Fourniture',
  'Équipement'
];

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'PUBLISHED', label: 'Publié' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'SUBMITTED', label: 'Soumis' },
  { value: 'WON', label: 'Gagné' },
  { value: 'LOST', label: 'Perdu' }
];

export default function FilterPanel({ onFilterChange, initialFilters = {} }: FilterPanelProps) {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['country', 'budget']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleArrayFilter = (key: 'country' | 'sector' | 'status', value: string) => {
    const currentArray = filters[key] || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(v => v !== value)
      : [...currentArray, value];
    updateFilter(key, newArray.length > 0 ? newArray : undefined);
  };

  const clearFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== undefined && (Array.isArray(v) ? v.length > 0 : true)).length;

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <span className="font-semibold text-gray-900">Filtres</span>
          {activeFilterCount > 0 && (
            <span className="bg-indigo-100 text-indigo-600 text-xs font-medium px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearFilters();
              }}
              className="text-sm text-indigo-600 hover:text-indigo-700 px-2"
            >
              Réinitialiser
            </button>
          )}
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* Filters Content */}
      {isOpen && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          {/* Country Filter */}
          <div>
            <button
              onClick={() => toggleSection('country')}
              className="flex items-center justify-between w-full mb-2"
            >
              <span className="font-medium text-gray-900">Pays</span>
              {expandedSections.has('country') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.has('country') && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {getAllCountries().map((country) => (
                  <label key={country.code} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={filters.country?.includes(country.name) || false}
                      onChange={() => toggleArrayFilter('country', country.name)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{country.flag} {country.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Sector Filter */}
          <div>
            <button
              onClick={() => toggleSection('sector')}
              className="flex items-center justify-between w-full mb-2"
            >
              <span className="font-medium text-gray-900">Secteur</span>
              {expandedSections.has('sector') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.has('sector') && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {SECTORS.map((sector) => (
                  <label key={sector} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={filters.sector?.includes(sector) || false}
                      onChange={() => toggleArrayFilter('sector', sector)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{sector}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Budget Filter */}
          <div>
            <button
              onClick={() => toggleSection('budget')}
              className="flex items-center justify-between w-full mb-2"
            >
              <span className="font-medium text-gray-900">Budget</span>
              {expandedSections.has('budget') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.has('budget') && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Minimum (€)</label>
                  <input
                    type="number"
                    value={filters.min_budget || ''}
                    onChange={(e) => updateFilter('min_budget', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Maximum (€)</label>
                  <input
                    type="number"
                    value={filters.max_budget || ''}
                    onChange={(e) => updateFilter('max_budget', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="Illimité"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Deadline Filter */}
          <div>
            <button
              onClick={() => toggleSection('deadline')}
              className="flex items-center justify-between w-full mb-2"
            >
              <span className="font-medium text-gray-900">Date limite</span>
              {expandedSections.has('deadline') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.has('deadline') && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Du</label>
                  <input
                    type="date"
                    value={filters.deadline_from || ''}
                    onChange={(e) => updateFilter('deadline_from', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Au</label>
                  <input
                    type="date"
                    value={filters.deadline_to || ''}
                    onChange={(e) => updateFilter('deadline_to', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div>
            <button
              onClick={() => toggleSection('status')}
              className="flex items-center justify-between w-full mb-2"
            >
              <span className="font-medium text-gray-900">Statut</span>
              {expandedSections.has('status') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.has('status') && (
              <div className="space-y-2">
                {STATUS_OPTIONS.map((status) => (
                  <label key={status.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={filters.status?.includes(status.value) || false}
                      onChange={() => toggleArrayFilter('status', status.value)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{status.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
