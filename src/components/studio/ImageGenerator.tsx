'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Sparkles, Download, Copy, Loader2, Wand2, Image as ImageIcon } from 'lucide-react';
import { Button, Input, Card, Badge } from '@/components/ui';
import toast from 'react-hot-toast';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';

const entries = {
  'imageGenerator.poweredBy': 'Powered by DALL·E 3',
  'imageGenerator.title': 'AI Image Generator',
  'imageGenerator.subtitle': 'Create professional visuals for your presentations and social media',
  'imageGenerator.fields.prompt.label': 'Image description *',
  'imageGenerator.fields.prompt.placeholder': 'e.g., A professional team working on a construction project...',
  'imageGenerator.fields.context.label': 'Context (optional)',
  'imageGenerator.fields.context.placeholder': 'e.g., For a LinkedIn post about innovation...',
  'imageGenerator.fields.style.label': 'Visual style',
  'imageGenerator.fields.size.label': 'Format',
  'imageGenerator.fields.quality.label': 'Quality',
  'imageGenerator.style.professional': 'Professional',
  'imageGenerator.style.creative': 'Creative',
  'imageGenerator.style.technical': 'Technical',
  'imageGenerator.style.social': 'Social media',
  'imageGenerator.style.presentation': 'Presentation',
  'imageGenerator.style.linkedin': 'LinkedIn',
  'imageGenerator.style.illustration': 'Illustration',
  'imageGenerator.style.photo': 'Photo',
  'imageGenerator.size.square': 'Square (1024×1024)',
  'imageGenerator.size.landscape': 'Landscape (1792×1024)',
  'imageGenerator.size.portrait': 'Portrait (1024×1792)',
  'imageGenerator.quality.standard': 'Standard',
  'imageGenerator.quality.standardHint': 'Fast',
  'imageGenerator.quality.hd': 'HD',
  'imageGenerator.quality.hdHint': 'High quality',
  'imageGenerator.actions.generating': 'Generating...',
  'imageGenerator.actions.generate': 'Generate image',
  'imageGenerator.empty.title': 'No image generated yet',
  'imageGenerator.empty.description': 'Configure the settings and click “Generate image”',
  'imageGenerator.loading.title': 'Generating your image…',
  'imageGenerator.loading.subtitle': 'This may take 10–30 seconds',
  'imageGenerator.actions.download': 'Download',
  'imageGenerator.actions.copyUrl': 'Copy URL',
  'imageGenerator.revisedPrompt.title': 'Prompt optimized by DALL·E:',
  'imageGenerator.toast.missingPrompt': 'Please enter a description',
  'imageGenerator.toast.generationFailed': 'Generation failed',
  'imageGenerator.toast.generationSuccess': 'Image generated successfully!',
  'imageGenerator.toast.generationError': 'An error occurred while generating',
  'imageGenerator.toast.downloadSuccess': 'Image downloaded!',
  'imageGenerator.toast.downloadError': 'An error occurred while downloading',
  'imageGenerator.toast.urlCopied': 'URL copied!',
} as const;

const STYLE_OPTIONS: Array<{ value: string; labelKey: keyof typeof entries; icon: string }> = [
  { value: 'professional', labelKey: 'imageGenerator.style.professional', icon: '💼' },
  { value: 'creative', labelKey: 'imageGenerator.style.creative', icon: '🎨' },
  { value: 'technical', labelKey: 'imageGenerator.style.technical', icon: '🔧' },
  { value: 'social', labelKey: 'imageGenerator.style.social', icon: '📱' },
  { value: 'presentation', labelKey: 'imageGenerator.style.presentation', icon: '📊' },
  { value: 'linkedin', labelKey: 'imageGenerator.style.linkedin', icon: '💼' },
  { value: 'illustration', labelKey: 'imageGenerator.style.illustration', icon: '✏️' },
  { value: 'photo', labelKey: 'imageGenerator.style.photo', icon: '📸' },
];

const SIZE_OPTIONS: Array<{ value: string; labelKey: keyof typeof entries; ratio: string }> = [
  { value: '1024x1024', labelKey: 'imageGenerator.size.square', ratio: '1:1' },
  { value: '1792x1024', labelKey: 'imageGenerator.size.landscape', ratio: '16:9' },
  { value: '1024x1792', labelKey: 'imageGenerator.size.portrait', ratio: '9:16' },
];

export default function ImageGenerator() {
  const { locale } = useLocale();
  const { t } = useUiTranslations(locale, entries);

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
        body: JSON.stringify({
          prompt,
          style,
          size,
          quality,
          context,
        }),
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-100 to-purple-100 mb-4">
          <Sparkles className="w-4 h-4 text-violet-600" />
          <span className="text-sm font-medium text-violet-900">{t('imageGenerator.poweredBy')}</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {t('imageGenerator.title')}
        </h1>
        <p className="text-slate-600">
          {t('imageGenerator.subtitle')}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Panel de gauche - Configuration */}
        <Card className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('imageGenerator.fields.prompt.label')}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('imageGenerator.fields.prompt.placeholder')}
              className="w-full h-32 px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
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
            <label className="block text-sm font-medium text-slate-700 mb-3">
              {t('imageGenerator.fields.style.label')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STYLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStyle(option.value)}
                  disabled={loading}
                  className={`px-4 py-3 rounded-lg border-2 transition-all text-left ${
                    style === option.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{option.icon}</span>
                    <span className="text-sm font-medium text-slate-700">
                      {t(option.labelKey)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              {t('imageGenerator.fields.size.label')}
            </label>
            <div className="space-y-2">
              {SIZE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSize(option.value)}
                  disabled={loading}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all text-left ${
                    size === option.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      {t(option.labelKey)}
                    </span>
                    <Badge variant="secondary" size="sm">{option.ratio}</Badge>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              {t('imageGenerator.fields.quality.label')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setQuality('standard')}
                disabled={loading}
                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                  quality === 'standard'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-sm font-medium text-slate-700">{t('imageGenerator.quality.standard')}</div>
                <div className="text-xs text-slate-500">{t('imageGenerator.quality.standardHint')}</div>
              </button>
              <button
                onClick={() => setQuality('hd')}
                disabled={loading}
                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                  quality === 'hd'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-sm font-medium text-slate-700">{t('imageGenerator.quality.hd')}</div>
                <div className="text-xs text-slate-500">{t('imageGenerator.quality.hdHint')}</div>
              </button>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full"
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

        {/* Panel de droite - Résultat */}
        <div className="space-y-4">
          <Card className="p-6">
            {!generatedImage && !loading && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <ImageIcon className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  {t('imageGenerator.empty.title')}
                </h3>
                <p className="text-sm text-slate-500 max-w-xs">
                  {t('imageGenerator.empty.description')}
                </p>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                <p className="text-slate-600">{t('imageGenerator.loading.title')}</p>
                <p className="text-sm text-slate-400 mt-2">{t('imageGenerator.loading.subtitle')}</p>
              </div>
            )}

            {generatedImage && !loading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <Image
                  src={generatedImage.imageUrl}
                  alt="Generated"
                  width={1024}
                  height={1024}
                  sizes="100vw"
                  className="w-full h-auto rounded-lg shadow-lg"
                />

                <div className="flex gap-2">
                  <Button
                    onClick={handleDownload}
                    variant="secondary"
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t('imageGenerator.actions.download')}
                  </Button>
                  <Button
                    onClick={handleCopyUrl}
                    variant="secondary"
                    className="flex-1"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {t('imageGenerator.actions.copyUrl')}
                  </Button>
                </div>

                {generatedImage.revisedPrompt && (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-xs font-medium text-slate-500 mb-1">
                      {t('imageGenerator.revisedPrompt.title')}
                    </p>
                    <p className="text-sm text-slate-700">
                      {generatedImage.revisedPrompt}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
