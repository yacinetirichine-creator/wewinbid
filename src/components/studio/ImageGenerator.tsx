'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Download,
  Copy,
  Loader2,
  Wand2,
  Image as ImageIcon,
  Lightbulb,
  Building2,
  Users,
  TrendingUp,
  Shield,
  Truck,
  Wrench,
  Zap,
  Target,
  Award,
  Briefcase,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { Button, Input, Card, Badge } from '@/components/ui';
import toast from 'react-hot-toast';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';

const entries = {
  'imageGenerator.poweredBy': 'Propulsé par DALL·E 3',
  'imageGenerator.title': 'Studio Créatif IA',
  'imageGenerator.subtitle': 'Créez des visuels professionnels pour vos présentations et réponses AO',
  'imageGenerator.tabs.create': 'Créer',
  'imageGenerator.tabs.templates': 'Templates',
  'imageGenerator.tabs.ideas': 'Idées',
  'imageGenerator.fields.prompt.label': 'Description de l\'image *',
  'imageGenerator.fields.prompt.placeholder': 'Ex: Une équipe de professionnels travaillant sur un chantier de construction...',
  'imageGenerator.fields.context.label': 'Contexte (optionnel)',
  'imageGenerator.fields.context.placeholder': 'Ex: Pour illustrer notre expérience en BTP dans une réponse AO...',
  'imageGenerator.fields.style.label': 'Style visuel',
  'imageGenerator.fields.size.label': 'Format',
  'imageGenerator.fields.quality.label': 'Qualité',
  'imageGenerator.style.professional': 'Professionnel',
  'imageGenerator.style.creative': 'Créatif',
  'imageGenerator.style.technical': 'Technique',
  'imageGenerator.style.social': 'Réseaux sociaux',
  'imageGenerator.style.presentation': 'Présentation',
  'imageGenerator.style.linkedin': 'LinkedIn',
  'imageGenerator.style.illustration': 'Illustration',
  'imageGenerator.style.photo': 'Photo',
  'imageGenerator.size.square': 'Carré (1024×1024)',
  'imageGenerator.size.landscape': 'Paysage (1792×1024)',
  'imageGenerator.size.portrait': 'Portrait (1024×1792)',
  'imageGenerator.quality.standard': 'Standard',
  'imageGenerator.quality.standardHint': 'Rapide',
  'imageGenerator.quality.hd': 'HD',
  'imageGenerator.quality.hdHint': 'Haute qualité',
  'imageGenerator.actions.generating': 'Génération en cours...',
  'imageGenerator.actions.generate': 'Générer l\'image',
  'imageGenerator.actions.useTemplate': 'Utiliser ce template',
  'imageGenerator.empty.title': 'Aucune image générée',
  'imageGenerator.empty.description': 'Configurez les paramètres et cliquez sur "Générer"',
  'imageGenerator.loading.title': 'Génération en cours…',
  'imageGenerator.loading.subtitle': 'Cela peut prendre 10 à 30 secondes',
  'imageGenerator.actions.download': 'Télécharger',
  'imageGenerator.actions.copyUrl': 'Copier URL',
  'imageGenerator.actions.regenerate': 'Régénérer',
  'imageGenerator.revisedPrompt.title': 'Prompt optimisé par l\'IA:',
  'imageGenerator.toast.missingPrompt': 'Veuillez entrer une description',
  'imageGenerator.toast.generationFailed': 'Échec de la génération',
  'imageGenerator.toast.generationSuccess': 'Image générée avec succès!',
  'imageGenerator.toast.generationError': 'Une erreur s\'est produite',
  'imageGenerator.toast.downloadSuccess': 'Image téléchargée!',
  'imageGenerator.toast.downloadError': 'Erreur lors du téléchargement',
  'imageGenerator.toast.urlCopied': 'URL copiée!',
  'imageGenerator.templates.title': 'Templates populaires',
  'imageGenerator.templates.subtitle': 'Cliquez pour utiliser un template prêt à l\'emploi',
  'imageGenerator.ideas.title': 'Idées par secteur',
  'imageGenerator.ideas.subtitle': 'Suggestions adaptées à votre domaine d\'activité',
} as const;

// Style options with French labels
const STYLE_OPTIONS = [
  { value: 'professional', labelKey: 'imageGenerator.style.professional' as const, icon: '💼', color: 'from-blue-500 to-indigo-500' },
  { value: 'creative', labelKey: 'imageGenerator.style.creative' as const, icon: '🎨', color: 'from-pink-500 to-rose-500' },
  { value: 'technical', labelKey: 'imageGenerator.style.technical' as const, icon: '🔧', color: 'from-slate-500 to-gray-500' },
  { value: 'social', labelKey: 'imageGenerator.style.social' as const, icon: '📱', color: 'from-cyan-500 to-teal-500' },
  { value: 'presentation', labelKey: 'imageGenerator.style.presentation' as const, icon: '📊', color: 'from-violet-500 to-purple-500' },
  { value: 'linkedin', labelKey: 'imageGenerator.style.linkedin' as const, icon: '💼', color: 'from-blue-600 to-blue-700' },
  { value: 'illustration', labelKey: 'imageGenerator.style.illustration' as const, icon: '✏️', color: 'from-amber-500 to-orange-500' },
  { value: 'photo', labelKey: 'imageGenerator.style.photo' as const, icon: '📸', color: 'from-emerald-500 to-green-500' },
];

const SIZE_OPTIONS = [
  { value: '1024x1024', labelKey: 'imageGenerator.size.square' as const, ratio: '1:1', icon: '◻️' },
  { value: '1792x1024', labelKey: 'imageGenerator.size.landscape' as const, ratio: '16:9', icon: '▬' },
  { value: '1024x1792', labelKey: 'imageGenerator.size.portrait' as const, ratio: '9:16', icon: '▮' },
];

// Pre-built templates for common business scenarios
const TEMPLATES = [
  {
    id: 'team-collaboration',
    name: 'Équipe en collaboration',
    prompt: 'Une équipe de professionnels diversifiée travaillant ensemble dans un bureau moderne, ambiance collaborative et dynamique, éclairage naturel',
    style: 'professional',
    icon: Users,
    category: 'Équipe',
  },
  {
    id: 'construction-site',
    name: 'Chantier de construction',
    prompt: 'Un chantier de construction moderne avec des ouvriers portant des équipements de sécurité, grues et bâtiment en cours de construction, ciel bleu',
    style: 'photo',
    icon: Building2,
    category: 'BTP',
  },
  {
    id: 'security-service',
    name: 'Service de sécurité',
    prompt: 'Agent de sécurité professionnel en uniforme devant un bâtiment d\'entreprise moderne, posture confiante et rassurante',
    style: 'professional',
    icon: Shield,
    category: 'Sécurité',
  },
  {
    id: 'logistics-warehouse',
    name: 'Entrepôt logistique',
    prompt: 'Intérieur d\'un entrepôt logistique moderne avec des chariots élévateurs et des étagères bien organisées, ambiance efficace',
    style: 'photo',
    icon: Truck,
    category: 'Logistique',
  },
  {
    id: 'maintenance-tech',
    name: 'Technicien maintenance',
    prompt: 'Technicien de maintenance qualifié travaillant sur un équipement industriel, outils professionnels, environnement propre',
    style: 'professional',
    icon: Wrench,
    category: 'Maintenance',
  },
  {
    id: 'innovation-tech',
    name: 'Innovation technologique',
    prompt: 'Visualisation abstraite de l\'innovation technologique, circuits lumineux, données numériques, couleurs bleu et violet',
    style: 'creative',
    icon: Zap,
    category: 'Tech',
  },
  {
    id: 'business-growth',
    name: 'Croissance business',
    prompt: 'Graphique de croissance ascendant stylisé avec des éléments business, flèches vers le haut, couleurs dynamiques',
    style: 'illustration',
    icon: TrendingUp,
    category: 'Business',
  },
  {
    id: 'quality-award',
    name: 'Excellence & Qualité',
    prompt: 'Symbole d\'excellence et de qualité, médaille dorée, certifications ISO, design premium et professionnel',
    style: 'illustration',
    icon: Award,
    category: 'Qualité',
  },
];

// Sector-specific ideas
const SECTOR_IDEAS = [
  {
    sector: 'BTP / Construction',
    icon: Building2,
    ideas: [
      'Vue aérienne d\'un projet de construction moderne',
      'Architecte examinant des plans sur tablette',
      'Matériaux de construction écologiques',
      'Équipe BTP devant un bâtiment terminé',
    ],
  },
  {
    sector: 'Sécurité',
    icon: Shield,
    ideas: [
      'Centre de surveillance vidéo moderne',
      'Équipement de sécurité électronique',
      'Rondes de surveillance nocturne',
      'Formation aux techniques de sécurité',
    ],
  },
  {
    sector: 'Services / Conseil',
    icon: Briefcase,
    ideas: [
      'Réunion de conseil avec clients',
      'Analyse de données sur écran',
      'Brainstorming en équipe',
      'Présentation stratégique',
    ],
  },
  {
    sector: 'Industrie / Maintenance',
    icon: Wrench,
    ideas: [
      'Maintenance préventive sur machine',
      'Technicien avec équipement de mesure',
      'Atelier industriel moderne',
      'Contrôle qualité en production',
    ],
  },
];

export default function ImageGenerator() {
  const { locale } = useLocale();
  const { t } = useUiTranslations(locale, entries);

  const [activeTab, setActiveTab] = useState<'create' | 'templates' | 'ideas'>('create');
  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState('');
  const [style, setStyle] = useState('professional');
  const [size, setSize] = useState('1024x1024');
  const [quality, setQuality] = useState<'standard' | 'hd'>('hd');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<any>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error(t('imageGenerator.toast.missingPrompt'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style, size, quality, context }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('imageGenerator.toast.generationFailed'));
      }

      setGeneratedImage(data);
      toast.success(t('imageGenerator.toast.generationSuccess'));
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || t('imageGenerator.toast.generationError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage?.imageUrl) return;

    try {
      const response = await fetch(generatedImage.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wewinbid-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(t('imageGenerator.toast.downloadSuccess'));
    } catch (error) {
      toast.error(t('imageGenerator.toast.downloadError'));
    }
  };

  const handleCopyUrl = () => {
    if (!generatedImage?.imageUrl) return;
    navigator.clipboard.writeText(generatedImage.imageUrl);
    toast.success(t('imageGenerator.toast.urlCopied'));
  };

  const handleUseTemplate = (template: typeof TEMPLATES[0]) => {
    setPrompt(template.prompt);
    setStyle(template.style);
    setActiveTab('create');
    toast.success(`Template "${template.name}" chargé`);
  };

  const handleUseIdea = (idea: string) => {
    setPrompt(idea);
    setActiveTab('create');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 mb-4">
          <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          <span className="text-sm font-medium text-violet-900 dark:text-violet-300">{t('imageGenerator.poweredBy')}</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          {t('imageGenerator.title')}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          {t('imageGenerator.subtitle')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          {(['create', 'templates', 'ideas'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t(`imageGenerator.tabs.${tab}` as keyof typeof entries)}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid lg:grid-cols-2 gap-6"
          >
            {/* Left Panel - Configuration */}
            <Card className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('imageGenerator.fields.prompt.label')}
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t('imageGenerator.fields.prompt.placeholder')}
                  className="w-full h-32 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-all resize-none"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('imageGenerator.fields.context.label')}
                </label>
                <Input
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder={t('imageGenerator.fields.context.placeholder')}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  {t('imageGenerator.fields.style.label')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {STYLE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setStyle(option.value)}
                      disabled={loading}
                      className={`px-3 py-2.5 rounded-lg border-2 transition-all text-center ${
                        style === option.value
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className="text-xl">{option.icon}</span>
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-1">
                        {t(option.labelKey)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('imageGenerator.fields.size.label')}
                  </label>
                  <div className="space-y-2">
                    {SIZE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSize(option.value)}
                        disabled={loading}
                        className={`w-full px-3 py-2 rounded-lg border-2 transition-all text-left ${
                          size === option.value
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            {option.icon} {option.ratio}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('imageGenerator.fields.quality.label')}
                  </label>
                  <div className="space-y-2">
                    <button
                      onClick={() => setQuality('standard')}
                      disabled={loading}
                      className={`w-full px-3 py-2 rounded-lg border-2 transition-all ${
                        quality === 'standard'
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('imageGenerator.quality.standard')}</div>
                      <div className="text-[10px] text-slate-500">{t('imageGenerator.quality.standardHint')}</div>
                    </button>
                    <button
                      onClick={() => setQuality('hd')}
                      disabled={loading}
                      className={`w-full px-3 py-2 rounded-lg border-2 transition-all ${
                        quality === 'hd'
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('imageGenerator.quality.hd')}</div>
                      <div className="text-[10px] text-slate-500">{t('imageGenerator.quality.hdHint')}</div>
                    </button>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {t('imageGenerator.actions.generating')}
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    {t('imageGenerator.actions.generate')}
                  </>
                )}
              </Button>
            </Card>

            {/* Right Panel - Result */}
            <div className="space-y-4">
              <Card className="p-6 min-h-[500px]">
                {!generatedImage && !loading && (
                  <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mb-4">
                      <ImageIcon className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                      {t('imageGenerator.empty.title')}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                      {t('imageGenerator.empty.description')}
                    </p>
                  </div>
                )}

                {loading && (
                  <div className="flex flex-col items-center justify-center h-full py-20">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 animate-pulse" />
                      <Loader2 className="w-8 h-8 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mt-4">{t('imageGenerator.loading.title')}</p>
                    <p className="text-sm text-slate-400 mt-2">{t('imageGenerator.loading.subtitle')}</p>
                  </div>
                )}

                {generatedImage && !loading && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4"
                  >
                    <div className="relative group">
                      <Image
                        src={generatedImage.imageUrl}
                        alt="Generated"
                        width={1024}
                        height={1024}
                        sizes="100vw"
                        className="w-full h-auto rounded-lg shadow-lg"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        <Button onClick={handleDownload} variant="secondary" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button onClick={handleCopyUrl} variant="secondary" size="sm">
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button onClick={handleGenerate} variant="secondary" size="sm">
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleDownload} variant="secondary" className="flex-1">
                        <Download className="w-4 h-4 mr-2" />
                        {t('imageGenerator.actions.download')}
                      </Button>
                      <Button onClick={handleCopyUrl} variant="secondary" className="flex-1">
                        <Copy className="w-4 h-4 mr-2" />
                        {t('imageGenerator.actions.copyUrl')}
                      </Button>
                    </div>

                    {generatedImage.revisedPrompt && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                          {t('imageGenerator.revisedPrompt.title')}
                        </p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          {generatedImage.revisedPrompt}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </Card>
            </div>
          </motion.div>
        )}

        {activeTab === 'templates' && (
          <motion.div
            key="templates"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                {t('imageGenerator.templates.title')}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                {t('imageGenerator.templates.subtitle')}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {TEMPLATES.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleUseTemplate(template)}
                  className="cursor-pointer"
                >
                  <Card className="p-4 hover:shadow-lg transition-shadow group">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                        <template.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-slate-900 dark:text-white text-sm truncate">
                            {template.name}
                          </h3>
                          <Badge variant="secondary" size="sm">{template.category}</Badge>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {template.prompt}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'ideas' && (
          <motion.div
            key="ideas"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                {t('imageGenerator.ideas.title')}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                {t('imageGenerator.ideas.subtitle')}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {SECTOR_IDEAS.map((sector) => (
                <Card key={sector.sector} className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/50 dark:to-violet-900/50 flex items-center justify-center">
                      <sector.icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {sector.sector}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {sector.ideas.map((idea, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleUseIdea(idea)}
                        className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors text-left group"
                      >
                        <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {idea}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
