'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Plus,
  Trash2,
  Copy,
  Download,
  FileText,
  Presentation,
  Image as ImageIcon,
  Layout,
  LayoutGrid,
  Type,
  ChevronRight,
  ChevronLeft,
  Save,
  FolderOpen,
  Loader2,
  Palette,
  Settings,
  Eye,
  Sparkles,
  FileDown,
  Columns,
  Square,
} from 'lucide-react';
import { Button, Card, Input, Badge } from '@/components/ui';
import toast from 'react-hot-toast';

// Types
interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  content?: string;
  imageUrl?: string;
  backgroundColor?: string;
  layout: 'title' | 'content' | 'image' | 'two-column' | 'blank';
}

interface Template {
  id: string;
  name: string;
  description?: string;
  slides: Slide[];
  primaryColor: string;
  createdAt: Date;
  isDefault?: boolean;
}

interface PresentationStudioProps {
  onSave?: (slides: Slide[], metadata: any) => Promise<void>;
  initialSlides?: Slide[];
  companyName?: string;
}

// Layout options
const LAYOUT_OPTIONS = [
  { value: 'title', label: 'Page de titre', icon: Type, description: 'Titre centré avec sous-titre' },
  { value: 'content', label: 'Contenu', icon: FileText, description: 'Titre avec zone de texte' },
  { value: 'image', label: 'Image', icon: ImageIcon, description: 'Image principale avec légende' },
  { value: 'two-column', label: 'Deux colonnes', icon: Columns, description: 'Contenu sur deux colonnes' },
  { value: 'blank', label: 'Vierge', icon: Square, description: 'Diapositive vide' },
];

// Color presets
const COLOR_PRESETS = [
  { name: 'Indigo', value: '#4F46E5' },
  { name: 'Violet', value: '#7C3AED' },
  { name: 'Blue', value: '#2563EB' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Orange', value: '#EA580C' },
  { name: 'Rose', value: '#E11D48' },
  { name: 'Slate', value: '#475569' },
  { name: 'Amber', value: '#D97706' },
];

// Default templates
const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'business-pitch',
    name: 'Pitch Commercial',
    description: 'Présentation professionnelle pour appels d\'offres',
    primaryColor: '#4F46E5',
    isDefault: true,
    createdAt: new Date(),
    slides: [
      { id: '1', title: 'Votre entreprise', subtitle: 'Présentation de candidature', layout: 'title' },
      { id: '2', title: 'Notre expertise', content: '• Plus de 10 ans d\'expérience\n• Équipe qualifiée de 50+ experts\n• Certifications ISO 9001 & 14001\n• Références majeures dans le secteur', layout: 'content' },
      { id: '3', title: 'Nos réalisations', content: 'Projets similaires réalisés avec succès|||Clients satisfaits dans votre secteur', layout: 'two-column' },
      { id: '4', title: 'Pourquoi nous choisir', content: '• Approche personnalisée\n• Respect des délais\n• Qualité garantie\n• Support réactif', layout: 'content' },
      { id: '5', title: 'Contactez-nous', subtitle: 'commercial@votreentreprise.com', layout: 'title' },
    ],
  },
  {
    id: 'technical-proposal',
    name: 'Mémoire Technique',
    description: 'Structure de mémoire technique détaillé',
    primaryColor: '#2563EB',
    isDefault: true,
    createdAt: new Date(),
    slides: [
      { id: '1', title: 'Mémoire Technique', subtitle: 'Réponse à l\'appel d\'offres', layout: 'title' },
      { id: '2', title: 'Compréhension du besoin', content: 'Notre analyse approfondie du cahier des charges et des enjeux du projet...', layout: 'content' },
      { id: '3', title: 'Méthodologie proposée', content: 'Phase 1: Étude et conception|||Phase 2: Réalisation|||Phase 3: Validation|||Phase 4: Déploiement', layout: 'content' },
      { id: '4', title: 'Moyens humains et matériels', content: 'Description des ressources mobilisées pour ce projet...', layout: 'content' },
      { id: '5', title: 'Planning prévisionnel', content: 'Jalons clés et livrables du projet...', layout: 'content' },
      { id: '6', title: 'Garanties et SAV', content: 'Nos engagements qualité et notre service après-vente...', layout: 'content' },
    ],
  },
  {
    id: 'company-intro',
    name: 'Présentation Entreprise',
    description: 'Introduction à votre société',
    primaryColor: '#059669',
    isDefault: true,
    createdAt: new Date(),
    slides: [
      { id: '1', title: 'Notre Entreprise', subtitle: 'Leader dans notre domaine', layout: 'title' },
      { id: '2', title: 'Qui sommes-nous ?', content: 'Historique, valeurs et mission de l\'entreprise...', layout: 'content' },
      { id: '3', title: 'Nos chiffres clés', content: '50M€ CA|||200 collaborateurs|||15 ans d\'expérience|||98% satisfaction', layout: 'two-column' },
      { id: '4', title: 'Nos services', content: '• Service 1\n• Service 2\n• Service 3\n• Service 4', layout: 'content' },
      { id: '5', title: 'Nos références', content: 'Logos et témoignages de nos clients majeurs...', layout: 'image' },
      { id: '6', title: 'Travaillons ensemble', subtitle: 'Contactez notre équipe commerciale', layout: 'title' },
    ],
  },
];

export default function PresentationStudio({
  onSave,
  initialSlides,
  companyName = 'WeWinBid',
}: PresentationStudioProps) {
  // State
  const [slides, setSlides] = useState<Slide[]>(
    initialSlides || [
      { id: crypto.randomUUID(), title: 'Nouvelle Présentation', subtitle: 'Sous-titre', layout: 'title' },
    ]
  );
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [primaryColor, setPrimaryColor] = useState('#4F46E5');
  const [presentationTitle, setPresentationTitle] = useState('Ma Présentation');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<Template[]>([]);
  const [previewMode, setPreviewMode] = useState(false);

  const activeSlide = slides[activeSlideIndex];

  // Slide management
  const addSlide = (layout: Slide['layout'] = 'content') => {
    const newSlide: Slide = {
      id: crypto.randomUUID(),
      title: 'Nouvelle diapositive',
      content: '',
      layout,
    };
    const newSlides = [...slides];
    newSlides.splice(activeSlideIndex + 1, 0, newSlide);
    setSlides(newSlides);
    setActiveSlideIndex(activeSlideIndex + 1);
  };

  const duplicateSlide = () => {
    const duplicate: Slide = {
      ...activeSlide,
      id: crypto.randomUUID(),
    };
    const newSlides = [...slides];
    newSlides.splice(activeSlideIndex + 1, 0, duplicate);
    setSlides(newSlides);
    setActiveSlideIndex(activeSlideIndex + 1);
  };

  const deleteSlide = () => {
    if (slides.length <= 1) {
      toast.error('Impossible de supprimer la dernière diapositive');
      return;
    }
    const newSlides = slides.filter((_, i) => i !== activeSlideIndex);
    setSlides(newSlides);
    setActiveSlideIndex(Math.max(0, activeSlideIndex - 1));
  };

  const updateSlide = (updates: Partial<Slide>) => {
    setSlides(slides.map((slide, i) => (i === activeSlideIndex ? { ...slide, ...updates } : slide)));
  };

  // Template management
  const loadTemplate = (template: Template) => {
    setSlides(template.slides.map(s => ({ ...s, id: crypto.randomUUID() })));
    setPrimaryColor(template.primaryColor);
    setPresentationTitle(template.name);
    setActiveSlideIndex(0);
    setShowTemplates(false);
    toast.success(`Template "${template.name}" chargé`);
  };

  const saveAsTemplate = async () => {
    const templateName = prompt('Nom du template:');
    if (!templateName) return;

    const newTemplate: Template = {
      id: crypto.randomUUID(),
      name: templateName,
      description: `${slides.length} diapositives`,
      slides: slides,
      primaryColor,
      createdAt: new Date(),
    };

    // Save to local storage
    const existingTemplates = JSON.parse(localStorage.getItem('wewinbid_templates') || '[]');
    existingTemplates.push(newTemplate);
    localStorage.setItem('wewinbid_templates', JSON.stringify(existingTemplates));
    setSavedTemplates([...savedTemplates, newTemplate]);

    toast.success('Template sauvegardé');
  };

  // Load saved templates on mount
  useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('wewinbid_templates') || '[]');
      setSavedTemplates(saved);
    } catch {
      // Ignore
    }
  });

  // Export functionality
  const handleExport = async (format: 'pdf' | 'pptx') => {
    setExporting(true);
    setShowExportMenu(false);

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          title: presentationTitle,
          content: { slides },
          styles: { primaryColor },
          metadata: {
            company: companyName,
            date: new Date().toLocaleDateString('fr-FR'),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${presentationTitle.toLowerCase().replace(/\s+/g, '-')}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Export ${format.toUpperCase()} réussi!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur lors de l\'export');
    } finally {
      setExporting(false);
    }
  };

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && activeSlideIndex > 0) {
        setActiveSlideIndex(activeSlideIndex - 1);
      } else if (e.key === 'ArrowRight' && activeSlideIndex < slides.length - 1) {
        setActiveSlideIndex(activeSlideIndex + 1);
      }
    },
    [activeSlideIndex, slides.length]
  );

  // Render slide preview
  const renderSlidePreview = (slide: Slide, isActive: boolean) => {
    return (
      <div
        className={`aspect-[16/9] rounded-lg border-2 transition-all cursor-pointer overflow-hidden ${
          isActive
            ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-800'
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
        }`}
        style={{
          background: slide.backgroundColor || (slide.layout === 'title' ? primaryColor : '#fff'),
        }}
      >
        <div className="p-2 h-full flex flex-col justify-center">
          {slide.layout === 'title' && (
            <div className="text-center">
              <div
                className="text-[10px] font-bold truncate"
                style={{ color: slide.backgroundColor ? '#fff' : slide.layout === 'title' ? '#fff' : primaryColor }}
              >
                {slide.title || 'Titre'}
              </div>
              {slide.subtitle && (
                <div className="text-[8px] opacity-80 truncate" style={{ color: slide.layout === 'title' ? '#fff' : '#666' }}>
                  {slide.subtitle}
                </div>
              )}
            </div>
          )}
          {slide.layout !== 'title' && (
            <div className="space-y-1">
              <div className="text-[8px] font-semibold truncate" style={{ color: primaryColor }}>
                {slide.title || 'Titre'}
              </div>
              <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded opacity-50" />
              <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded opacity-30 w-3/4" />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-200px)] min-h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Input
              value={presentationTitle}
              onChange={(e) => setPresentationTitle(e.target.value)}
              className="font-semibold text-lg border-none bg-transparent focus:bg-white dark:focus:bg-slate-800 px-2 py-1 -ml-2"
              placeholder="Titre de la présentation"
            />
          </div>
          <Badge variant="secondary">
            {slides.length} diapositive{slides.length > 1 ? 's' : ''}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Color picker */}
          <div className="relative">
            <button
              className="w-8 h-8 rounded-lg border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center"
              style={{ backgroundColor: primaryColor }}
              title="Couleur principale"
            >
              <Palette className="w-4 h-4 text-white" />
            </button>
            <div className="absolute top-full mt-2 right-0 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-2 hidden group-hover:grid grid-cols-4 gap-1 z-10">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                  style={{ backgroundColor: preset.value }}
                  onClick={() => setPrimaryColor(preset.value)}
                  title={preset.name}
                />
              ))}
            </div>
          </div>

          <Button variant="secondary" onClick={() => setShowTemplates(!showTemplates)}>
            <FolderOpen className="w-4 h-4 mr-2" />
            Templates
          </Button>

          <Button variant="secondary" onClick={saveAsTemplate}>
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder
          </Button>

          <Button variant="secondary" onClick={() => setPreviewMode(!previewMode)}>
            <Eye className="w-4 h-4 mr-2" />
            Aperçu
          </Button>

          {/* Export dropdown */}
          <div className="relative">
            <Button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exporting}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4 mr-2" />
              )}
              Exporter
            </Button>

            <AnimatePresence>
              {showExportMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full mt-2 right-0 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-20 min-w-[200px]"
                >
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <FileText className="w-5 h-5 text-red-500" />
                    <div className="text-left">
                      <div className="font-medium text-slate-900 dark:text-white">PDF</div>
                      <div className="text-xs text-slate-500">Document imprimable</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleExport('pptx')}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Presentation className="w-5 h-5 text-orange-500" />
                    <div className="text-left">
                      <div className="font-medium text-slate-900 dark:text-white">PowerPoint</div>
                      <div className="text-xs text-slate-500">Fichier .pptx éditable</div>
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Templates Modal */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowTemplates(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Choisir un template
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Commencez avec un modèle prêt à l'emploi ou chargez un de vos templates
                </p>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {/* Default templates */}
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                  Templates par défaut
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {DEFAULT_TEMPLATES.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => loadTemplate(template)}
                      className="cursor-pointer"
                    >
                      <Card className="p-4 hover:shadow-lg transition-all group">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: template.primaryColor }}
                          >
                            <Sparkles className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                              {template.name}
                            </h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {template.description}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {template.slides.length} diapositives
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
                        </div>
                      </Card>
                    </div>
                  ))}
                </div>

                {/* Saved templates */}
                {savedTemplates.length > 0 && (
                  <>
                    <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                      Vos templates sauvegardés
                    </h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {savedTemplates.map((template) => (
                        <div
                          key={template.id}
                          onClick={() => loadTemplate(template)}
                          className="cursor-pointer"
                        >
                          <Card className="p-4 hover:shadow-lg transition-all group">
                            <div className="flex items-start gap-3">
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: template.primaryColor }}
                              >
                                <FolderOpen className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-slate-900 dark:text-white">
                                  {template.name}
                                </h4>
                                <p className="text-xs text-slate-400">
                                  {template.slides.length} diapositives
                                </p>
                              </div>
                            </div>
                          </Card>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Slide thumbnails */}
        <div className="w-48 bg-slate-50 dark:bg-slate-900 rounded-xl p-3 overflow-y-auto">
          <div className="space-y-3">
            <Reorder.Group axis="y" values={slides} onReorder={setSlides} className="space-y-2">
              {slides.map((slide, index) => (
                <Reorder.Item key={slide.id} value={slide}>
                  <div
                    onClick={() => setActiveSlideIndex(index)}
                    className="relative"
                  >
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-400">
                      {index + 1}
                    </div>
                    <div className="ml-4">
                      {renderSlidePreview(slide, index === activeSlideIndex)}
                    </div>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>

            {/* Add slide button */}
            <button
              onClick={() => addSlide()}
              className="w-full aspect-[16/9] rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all flex flex-col items-center justify-center gap-1"
            >
              <Plus className="w-5 h-5 text-slate-400" />
              <span className="text-[10px] text-slate-500">Ajouter</span>
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Slide preview */}
          <Card className="flex-1 p-6 flex items-center justify-center overflow-hidden">
            {previewMode ? (
              // Full preview mode
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full h-full flex items-center justify-center"
                style={{
                  backgroundColor: activeSlide?.backgroundColor || (activeSlide?.layout === 'title' ? primaryColor : '#fff'),
                }}
              >
                <div className="max-w-4xl w-full p-8 text-center">
                  {activeSlide?.layout === 'title' && (
                    <>
                      <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white">
                        {activeSlide.title}
                      </h1>
                      {activeSlide.subtitle && (
                        <p className="text-xl md:text-2xl text-white/80">{activeSlide.subtitle}</p>
                      )}
                    </>
                  )}
                  {activeSlide?.layout === 'content' && (
                    <div className="text-left">
                      <h2 className="text-3xl font-bold mb-6" style={{ color: primaryColor }}>
                        {activeSlide.title}
                      </h2>
                      <div className="text-lg text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {activeSlide.content}
                      </div>
                    </div>
                  )}
                  {activeSlide?.layout === 'two-column' && (
                    <div className="text-left">
                      <h2 className="text-3xl font-bold mb-6" style={{ color: primaryColor }}>
                        {activeSlide.title}
                      </h2>
                      <div className="grid grid-cols-2 gap-8">
                        {activeSlide.content?.split('|||').map((col, i) => (
                          <div key={i} className="text-slate-700 dark:text-slate-300">
                            {col}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              // Edit preview
              <div
                className="w-full max-w-4xl aspect-[16/9] rounded-xl shadow-2xl overflow-hidden"
                style={{
                  backgroundColor: activeSlide?.backgroundColor || (activeSlide?.layout === 'title' ? primaryColor : '#fff'),
                }}
              >
                <div className="h-full p-8 flex flex-col justify-center">
                  {activeSlide?.layout === 'title' && (
                    <div className="text-center">
                      <h1 className="text-3xl md:text-5xl font-bold mb-3 text-white">
                        {activeSlide.title || 'Titre'}
                      </h1>
                      <p className="text-lg md:text-xl text-white/80">
                        {activeSlide.subtitle || 'Sous-titre'}
                      </p>
                    </div>
                  )}
                  {activeSlide?.layout === 'content' && (
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: primaryColor }}>
                        {activeSlide.title || 'Titre'}
                      </h2>
                      <div className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                        {activeSlide.content || 'Contenu de la diapositive...'}
                      </div>
                    </div>
                  )}
                  {activeSlide?.layout === 'image' && (
                    <div>
                      <h2 className="text-2xl font-bold mb-4" style={{ color: primaryColor }}>
                        {activeSlide.title || 'Titre'}
                      </h2>
                      <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center min-h-[200px]">
                        {activeSlide.imageUrl ? (
                          <img src={activeSlide.imageUrl} alt="" className="max-h-full max-w-full object-contain rounded-lg" />
                        ) : (
                          <div className="text-slate-400 flex flex-col items-center gap-2">
                            <ImageIcon className="w-12 h-12" />
                            <span className="text-sm">Ajouter une image</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {activeSlide?.layout === 'two-column' && (
                    <div>
                      <h2 className="text-2xl font-bold mb-4" style={{ color: primaryColor }}>
                        {activeSlide.title || 'Titre'}
                      </h2>
                      <div className="grid grid-cols-2 gap-6">
                        {(activeSlide.content?.split('|||') || ['Colonne 1', 'Colonne 2']).map((col, i) => (
                          <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
                            {col || `Colonne ${i + 1}`}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {activeSlide?.layout === 'blank' && (
                    <div className="flex-1 flex items-center justify-center text-slate-400">
                      Diapositive vierge
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Slide editor */}
          <Card className="p-4">
            <div className="flex items-start gap-4">
              {/* Layout selector */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-slate-500">Disposition</span>
                <div className="flex gap-1">
                  {LAYOUT_OPTIONS.map((layout) => (
                    <button
                      key={layout.value}
                      onClick={() => updateSlide({ layout: layout.value as Slide['layout'] })}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                        activeSlide?.layout === layout.value
                          ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'
                      }`}
                      title={layout.label}
                    >
                      <layout.icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Fields */}
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Titre</label>
                  <Input
                    value={activeSlide?.title || ''}
                    onChange={(e) => updateSlide({ title: e.target.value })}
                    placeholder="Titre de la diapositive"
                  />
                </div>
                {(activeSlide?.layout === 'title') && (
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Sous-titre</label>
                    <Input
                      value={activeSlide?.subtitle || ''}
                      onChange={(e) => updateSlide({ subtitle: e.target.value })}
                      placeholder="Sous-titre"
                    />
                  </div>
                )}
                {(activeSlide?.layout === 'content' || activeSlide?.layout === 'two-column') && (
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-slate-500 mb-1 block">
                      Contenu {activeSlide?.layout === 'two-column' && '(séparer les colonnes avec |||)'}
                    </label>
                    <textarea
                      value={activeSlide?.content || ''}
                      onChange={(e) => updateSlide({ content: e.target.value })}
                      placeholder="Contenu de la diapositive..."
                      className="w-full h-20 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm resize-none"
                    />
                  </div>
                )}
                {activeSlide?.layout === 'image' && (
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">URL de l'image</label>
                    <Input
                      value={activeSlide?.imageUrl || ''}
                      onChange={(e) => updateSlide({ imageUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={duplicateSlide} title="Dupliquer">
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="secondary" size="sm" onClick={deleteSlide} title="Supprimer" className="text-red-500 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveSlideIndex(Math.max(0, activeSlideIndex - 1))}
                disabled={activeSlideIndex === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-slate-500">
                {activeSlideIndex + 1} / {slides.length}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveSlideIndex(Math.min(slides.length - 1, activeSlideIndex + 1))}
                disabled={activeSlideIndex === slides.length - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
