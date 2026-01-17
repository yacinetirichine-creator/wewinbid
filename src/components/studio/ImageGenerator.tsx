'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Sparkles, Download, Copy, Loader2, Wand2, Image as ImageIcon } from 'lucide-react';
import { Button, Input, Card, Badge } from '@/components/ui';
import toast from 'react-hot-toast';

const STYLE_OPTIONS = [
  { value: 'professional', label: 'Professionnel', icon: '💼' },
  { value: 'creative', label: 'Créatif', icon: '🎨' },
  { value: 'technical', label: 'Technique', icon: '🔧' },
  { value: 'social', label: 'Réseaux sociaux', icon: '📱' },
  { value: 'presentation', label: 'Présentation', icon: '📊' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { value: 'illustration', label: 'Illustration', icon: '✏️' },
  { value: 'photo', label: 'Photo', icon: '📸' },
];

const SIZE_OPTIONS = [
  { value: '1024x1024', label: 'Carré (1024×1024)', ratio: '1:1' },
  { value: '1792x1024', label: 'Paysage (1792×1024)', ratio: '16:9' },
  { value: '1024x1792', label: 'Portrait (1024×1792)', ratio: '9:16' },
];

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState('');
  const [style, setStyle] = useState('professional');
  const [size, setSize] = useState('1024x1024');
  const [quality, setQuality] = useState<'standard' | 'hd'>('hd');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<any>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Veuillez entrer une description');
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
        throw new Error(data.error || 'Échec de la génération');
      }

      setGeneratedImage(data);
      toast.success('Image générée avec succès !');
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Erreur lors de la génération');
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
      toast.success('Image téléchargée !');
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleCopyUrl = () => {
    if (!generatedImage?.imageUrl) return;
    navigator.clipboard.writeText(generatedImage.imageUrl);
    toast.success('URL copiée !');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-100 to-purple-100 mb-4">
          <Sparkles className="w-4 h-4 text-violet-600" />
          <span className="text-sm font-medium text-violet-900">Propulsé par DALL-E 3</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Générateur d'Images IA
        </h1>
        <p className="text-slate-600">
          Créez des visuels professionnels pour vos présentations et réseaux sociaux
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Panel de gauche - Configuration */}
        <Card className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description de l'image *
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Une équipe professionnelle travaillant sur un projet de construction..."
              className="w-full h-32 px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Contexte (optionnel)
            </label>
            <Input
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Ex: Pour un post LinkedIn sur l'innovation..."
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Style visuel
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
                      {option.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Format
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
                      {option.label}
                    </span>
                    <Badge variant="secondary" size="sm">{option.ratio}</Badge>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Qualité
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
                <div className="text-sm font-medium text-slate-700">Standard</div>
                <div className="text-xs text-slate-500">Rapide</div>
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
                <div className="text-sm font-medium text-slate-700">HD</div>
                <div className="text-xs text-slate-500">Haute qualité</div>
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
                Génération en cours...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 mr-2" />
                Générer l'image
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
                  Aucune image générée
                </h3>
                <p className="text-sm text-slate-500 max-w-xs">
                  Configurez les paramètres et cliquez sur "Générer l'image"
                </p>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                <p className="text-slate-600">Génération de votre image...</p>
                <p className="text-sm text-slate-400 mt-2">Cela peut prendre 10-30 secondes</p>
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
                    Télécharger
                  </Button>
                  <Button
                    onClick={handleCopyUrl}
                    variant="secondary"
                    className="flex-1"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copier URL
                  </Button>
                </div>

                {generatedImage.revisedPrompt && (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-xs font-medium text-slate-500 mb-1">
                      Prompt optimisé par DALL-E:
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
