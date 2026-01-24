'use client';

import { useMemo, useState } from 'react';
import { 
  Card, 
  CardContent,
  Button, 
  Input, 
  Badge 
} from '@/components/ui';
import { NewAppLayout as AppLayout, PageHeader } from '@/components/layout/NewAppLayout';
import ImageGenerator from '@/components/studio/ImageGenerator';
import PresentationStudio from '@/components/studio/PresentationStudio';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';
import {
  Palette,
  Sparkles,
  Image as ImageIcon,
  FileText,
  Share2,
  Instagram,
  Linkedin,
  Twitter,
  Facebook,
  Copy,
  Download,
  RefreshCw,
  Wand2,
  Layout,
  Type,
  Smile,
  Calendar,
  Clock,
  CheckCircle2,
  Eye,
  Edit3,
  Trash2,
  Plus,
  ArrowRight,
  Zap,
  Presentation,
} from 'lucide-react';

// Types
interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  category: 'win_announcement' | 'company_news' | 'expertise' | 'recruitment' | 'testimonial';
  platforms: ('linkedin' | 'instagram' | 'twitter' | 'facebook')[];
  preview: string;
}

interface GeneratedContent {
  id: string;
  type: string;
  platform: string;
  content: string;
  hashtags: string[];
  image_suggestion?: string;
  status: 'draft' | 'scheduled' | 'published';
  scheduled_date?: string;
  created_at: string;
}

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

// Templates de contenu
const CONTENT_TEMPLATES: ContentTemplate[] = [
  {
    id: '1',
    name: 'Win announcement',
    description: 'Share your public procurement wins',
    category: 'win_announcement',
    platforms: ['linkedin', 'twitter'],
    preview: '🎉 We are proud to announce…',
  },
  {
    id: '2',
    name: 'Expertise spotlight',
    description: 'Highlight your domain expertise',
    category: 'expertise',
    platforms: ['linkedin', 'instagram'],
    preview: '💡 Did you know…',
  },
  {
    id: '3',
    name: 'Customer testimonial',
    description: 'Share feedback from happy customers',
    category: 'testimonial',
    platforms: ['linkedin', 'facebook'],
    preview: '“Thanks to [company]…”',
  },
  {
    id: '4',
    name: 'Company update',
    description: 'Share news from your company',
    category: 'company_news',
    platforms: ['linkedin', 'instagram', 'facebook'],
    preview: '📢 Big news…',
  },
  {
    id: '5',
    name: 'Hiring post',
    description: 'Attract top talent',
    category: 'recruitment',
    platforms: ['linkedin', 'twitter'],
    preview: '🚀 Join our team…',
  },
];

// Contenu généré de démonstration
const DEMO_GENERATED: GeneratedContent[] = [
  {
    id: '1',
    type: 'Win announcement',
    platform: 'linkedin',
    content: "🎉 We are proud to announce that we have been awarded the video surveillance contract for the City of Bordeaux!\n\nThis €156,000 project will help secure public buildings with state-of-the-art technology.\n\nHuge thanks to the whole team for this great win! 🙏\n\n#PublicProcurement #Security #VideoSurveillance #Bordeaux",
    hashtags: ['PublicProcurement', 'Security', 'VideoSurveillance', 'Bordeaux'],
    image_suggestion: 'A photo of modern cameras or the team in front of the building',
    status: 'draft',
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    type: 'Expertise',
    platform: 'linkedin',
    content: '💡 Did you know? AI-powered smart video surveillance can reduce false positives by up to 90%.\n\nAt SecuriTech, we integrate these technologies into all our security projects.\n\nLearn how in our latest article 👇\n\n#Innovation #AI #Security #TechForGood',
    hashtags: ['Innovation', 'AI', 'Security', 'TechForGood'],
    status: 'scheduled',
    scheduled_date: '2024-01-20T09:00:00Z',
    created_at: '2024-01-14T14:00:00Z',
  },
];

// Icône de plateforme
function PlatformIcon({ platform, className = 'w-5 h-5' }: { platform: string; className?: string }) {
  const icons: Record<string, any> = {
    linkedin: Linkedin,
    instagram: Instagram,
    twitter: Twitter,
    facebook: Facebook,
  };
  const Icon = icons[platform] || Share2;
  return <Icon className={className} />;
}

// Composant carte template
function TemplateCard({ 
  template, 
  onSelect 
}: { 
  template: ContentTemplate; 
  onSelect: () => void;
}) {
  return (
    <div className="cursor-pointer" onClick={onSelect}>
      <Card className="hover:shadow-lg transition-all duration-200 border-gray-200 hover:border-primary-300">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-primary-100 rounded-xl">
              <Palette className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex gap-1">
              {template.platforms.map((platform) => (
                <div key={platform} className="p-1.5 bg-gray-100 rounded-lg">
                  <PlatformIcon platform={platform} className="w-4 h-4 text-gray-500" />
                </div>
              ))}
            </div>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
          <p className="text-sm text-gray-500 mb-3">{template.description}</p>
          <div className="px-3 py-2 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 italic truncate">{template.preview}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Composant carte contenu généré
function GeneratedContentCard({ 
  content,
  onEdit,
  onDelete,
  onSchedule,
  t,
  locale,
}: { 
  content: GeneratedContent;
  onEdit: () => void;
  onDelete: () => void;
  onSchedule: () => void;
  t: TranslateFn;
  locale: string;
}) {
  const statusConfig = {
    draft: { label: t('studio.status.draft'), color: 'bg-gray-100 text-gray-700' },
    scheduled: { label: t('studio.status.scheduled'), color: 'bg-blue-100 text-blue-700' },
    published: { label: t('studio.status.published'), color: 'bg-green-100 text-green-700' },
  };

  return (
    <Card className="border-gray-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-xl">
              <PlatformIcon platform={content.platform} className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{content.type}</p>
              <p className="text-sm text-gray-500 capitalize">{content.platform}</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusConfig[content.status].color}`}>
            {statusConfig[content.status].label}
          </span>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <p className="text-sm text-gray-700 whitespace-pre-line line-clamp-4">
            {content.content}
          </p>
        </div>

        {content.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {content.hashtags.map((tag) => (
              <span key={tag} className="text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {content.image_suggestion && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <ImageIcon className="w-4 h-4" />
            <span>{content.image_suggestion}</span>
          </div>
        )}

        {content.scheduled_date && (
          <div className="flex items-center gap-2 text-sm text-blue-600 mb-4">
            <Calendar className="w-4 h-4" />
            <span>
              {t('studio.scheduledOn', {
                date: new Date(content.scheduled_date).toLocaleDateString(locale),
                time: new Date(content.scheduled_date).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
              })}
            </span>
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t border-gray-100">
          <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
            <Edit3 className="w-4 h-4 mr-1" />
            {t('studio.action.edit')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(content.content)}>
            <Copy className="w-4 h-4" />
          </Button>
          {content.status === 'draft' && (
            <Button variant="primary" size="sm" onClick={onSchedule}>
              <Calendar className="w-4 h-4 mr-1" />
              {t('studio.action.schedule')}
            </Button>
          )}
          <Button variant="outline" size="sm" className="text-red-500 hover:bg-red-50" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Modal de génération
function GenerationModal({ 
  template,
  onClose,
  onGenerate,
  t,
}: { 
  template: ContentTemplate | null;
  onClose: () => void;
  onGenerate: (data: any) => void;
  t: TranslateFn;
}) {
  const [formData, setFormData] = useState({
    context: '',
    platform: template?.platforms[0] || 'linkedin',
    tone: 'professional',
    includeEmojis: true,
    includeHashtags: true,
    tenderRef: '',
  });
  const [generating, setGenerating] = useState(false);

  if (!template) return null;

  const handleGenerate = async () => {
    setGenerating(true);
    // Simulation de génération
    await new Promise(resolve => setTimeout(resolve, 2000));
    onGenerate({
      ...formData,
      template: template.id,
    });
    setGenerating(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-xl">
              <Sparkles className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{template.name}</h2>
              <p className="text-sm text-gray-500">{t('studio.modal.subtitle')}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('studio.field.context')}
            </label>
            <textarea
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={3}
              placeholder={t('studio.field.context.placeholder')}
              value={formData.context}
              onChange={(e) => setFormData({ ...formData, context: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('studio.field.tenderRefOptional')}
            </label>
            <Input
              placeholder={t('studio.field.tenderRef.placeholder')}
              value={formData.tenderRef}
              onChange={(e) => setFormData({ ...formData, tenderRef: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('studio.field.platform')}
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500"
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value as any })}
              >
                {template.platforms.map((p) => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('studio.field.tone')}
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500"
                value={formData.tone}
                onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
              >
                <option value="professional">{t('studio.tone.professional')}</option>
                <option value="casual">{t('studio.tone.casual')}</option>
                <option value="enthusiastic">{t('studio.tone.enthusiastic')}</option>
                <option value="formal">{t('studio.tone.formal')}</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.includeEmojis}
                onChange={(e) => setFormData({ ...formData, includeEmojis: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">{t('studio.option.includeEmojis')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.includeHashtags}
                onChange={(e) => setFormData({ ...formData, includeHashtags: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">{t('studio.option.includeHashtags')}</span>
            </label>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {t('studio.action.cancel')}
          </Button>
          <Button 
            variant="primary" 
            className="flex-1"
            onClick={handleGenerate}
            disabled={!formData.context.trim() || generating}
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                {t('studio.action.generating')}
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                {t('studio.action.generate')}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Page principale
export default function StudioPage() {
  const { locale } = useLocale();
  const entries = useMemo(
    () => ({
      'studio.title': 'Creative Studio',
      'studio.description': 'Create professional content to showcase your public procurement wins',

      'studio.action.calendar': 'Calendar',
      'studio.action.newContent': 'New content',

      'studio.stats.created': 'Created content',
      'studio.stats.scheduled': 'Scheduled',
      'studio.stats.published': 'Published',
      'studio.stats.aiGenerations': 'AI generations',

      'studio.tab.templates': 'Templates',
      'studio.tab.myContent': 'My content ({count})',
      'studio.tab.imageGenerator': 'Image generator',
      'studio.tab.presentations': 'Presentations',

      'studio.templates.title': 'Pick a template to get started',

      'studio.empty.title': 'No content created',
      'studio.empty.description': 'Start by choosing a template to generate your first content',
      'studio.empty.action.create': 'Create content',

      'studio.modal.subtitle': 'Generate content with AI',
      'studio.field.context': 'Context / details',
      'studio.field.context.placeholder': 'e.g. We won the video surveillance contract for the City of Bordeaux worth €156,000…',
      'studio.field.tenderRefOptional': 'Tender reference (optional)',
      'studio.field.tenderRef.placeholder': 'e.g. ITT-2024-0042',
      'studio.field.platform': 'Platform',
      'studio.field.tone': 'Tone',

      'studio.tone.professional': 'Professional',
      'studio.tone.casual': 'Casual',
      'studio.tone.enthusiastic': 'Enthusiastic',
      'studio.tone.formal': 'Formal',

      'studio.option.includeEmojis': 'Include emojis',
      'studio.option.includeHashtags': 'Suggest hashtags',

      'studio.action.cancel': 'Cancel',
      'studio.action.generate': 'Generate',
      'studio.action.generating': 'Generating…',
      'studio.action.edit': 'Edit',
      'studio.action.schedule': 'Schedule',

      'studio.status.draft': 'Draft',
      'studio.status.scheduled': 'Scheduled',
      'studio.status.published': 'Published',

      'studio.scheduledOn': 'Scheduled on {date} at {time}',

      'studio.generated.defaultType': 'Content',
      'studio.generated.body': '🎉 New content automatically generated based on: "{context}"\n\nYour company keeps growing thanks to its public procurement successes.\n\n#PublicProcurement #Success #Growth',
      'studio.generated.imageSuggestion': 'A photo of the team or the project',
    }),
    []
  );
  const { t } = useUiTranslations(locale, entries);

  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>(DEMO_GENERATED);
  const [activeTab, setActiveTab] = useState<'templates' | 'content' | 'images' | 'presentations'>('templates');

  const handleGenerate = (data: any) => {
    // Simuler l'ajout de contenu généré
    const newContent: GeneratedContent = {
      id: Date.now().toString(),
      type: selectedTemplate?.name || t('studio.generated.defaultType'),
      platform: data.platform,
      content: t('studio.generated.body', { context: data.context }),
      hashtags: ['PublicProcurement', 'Success', 'Growth'],
      image_suggestion: t('studio.generated.imageSuggestion'),
      status: 'draft',
      created_at: new Date().toISOString(),
    };
    setGeneratedContent([newContent, ...generatedContent]);
    setSelectedTemplate(null);
    setActiveTab('content');
  };

  return (
    <AppLayout>
      <PageHeader
        title={t('studio.title')}
        description={t('studio.description')}
        actions={
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              {t('studio.action.calendar')}
            </Button>
            <Button variant="primary" onClick={() => setActiveTab('templates')}>
              <Plus className="w-4 h-4 mr-2" />
              {t('studio.action.newContent')}
            </Button>
          </div>
        }
      />

      <div className="px-4 sm:px-6 pb-6">
        {/* Stats rapides */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-primary-100 rounded-xl">
                <FileText className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{generatedContent.length}</p>
                <p className="text-sm text-gray-500">{t('studio.stats.created')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {generatedContent.filter(c => c.status === 'scheduled').length}
                </p>
                <p className="text-sm text-gray-500">{t('studio.stats.scheduled')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {generatedContent.filter(c => c.status === 'published').length}
                </p>
                <p className="text-sm text-gray-500">{t('studio.stats.published')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">∞</p>
                <p className="text-sm text-gray-500">{t('studio.stats.aiGenerations')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Onglets */}
        <div className="flex gap-2 mb-6">
          <button
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === 'templates'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('templates')}
          >
            <Layout className="w-4 h-4 inline-block mr-2" />
            {t('studio.tab.templates')}
          </button>
          <button
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === 'content'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('content')}
          >
            <FileText className="w-4 h-4 inline-block mr-2" />
            {t('studio.tab.myContent', { count: generatedContent.length })}
          </button>
          <button
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === 'images'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('images')}
          >
            <ImageIcon className="w-4 h-4 inline-block mr-2" />
            {t('studio.tab.imageGenerator')}
          </button>
          <button
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === 'presentations'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('presentations')}
          >
            <Presentation className="w-4 h-4 inline-block mr-2" />
            {t('studio.tab.presentations')}
          </button>
        </div>

        {/* Contenu */}
        {activeTab === 'images' ? (
          <ImageGenerator />
        ) : activeTab === 'presentations' ? (
          <PresentationStudio />
        ) : activeTab === 'templates' ? (
          <>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('studio.templates.title')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {CONTENT_TEMPLATES.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={() => setSelectedTemplate(template)}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            {generatedContent.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t('studio.empty.title')}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {t('studio.empty.description')}
                  </p>
                  <Button variant="primary" onClick={() => setActiveTab('templates')}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('studio.empty.action.create')}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {generatedContent.map((content) => (
                  <GeneratedContentCard
                    key={content.id}
                    content={content}
                    onEdit={() => console.log('Edit', content.id)}
                    onDelete={() => setGeneratedContent(generatedContent.filter(c => c.id !== content.id))}
                    onSchedule={() => console.log('Schedule', content.id)}
                    t={t}
                    locale={locale}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de génération */}
      {selectedTemplate && (
        <GenerationModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onGenerate={handleGenerate}
          t={t}
        />
      )}
    </AppLayout>
  );
}
