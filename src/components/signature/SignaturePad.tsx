'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Eraser, RotateCcw, Check, Pencil } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface SignaturePadProps {
  onChange?: (signatureData: string | null) => void;
  onSave?: (signatureData: string) => void;
  width?: number;
  height?: number;
  penColor?: string;
  backgroundColor?: string;
  lineWidth?: number;
  disabled?: boolean;
  className?: string;
}

export function SignaturePad({
  onChange,
  onSave,
  width = 500,
  height = 200,
  penColor = '#1e293b',
  backgroundColor = '#ffffff',
  lineWidth = 2,
  disabled = false,
  className = '',
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);

  // Initialiser le canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurer le canvas pour le retina display
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Fond
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Ligne de signature
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(40, height - 40);
    ctx.lineTo(width - 40, height - 40);
    ctx.stroke();
    ctx.setLineDash([]);

    // Texte indicatif
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Signez ici', width / 2, height - 20);
  }, [width, height, backgroundColor]);

  const getPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    const point = getPoint(e);
    setIsDrawing(true);
    setLastPoint(point);
    setHasSignature(true);
  };

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;

    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !lastPoint) return;

    const currentPoint = getPoint(e);

    ctx.strokeStyle = penColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.stroke();

    setLastPoint(currentPoint);
  }, [isDrawing, lastPoint, penColor, lineWidth, disabled]);

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setLastPoint(null);
      
      if (onChange && canvasRef.current) {
        const signatureData = canvasRef.current.toDataURL('image/png');
        onChange(signatureData);
      }
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    // Reset
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Redessiner la ligne
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(40, height - 40);
    ctx.lineTo(width - 40, height - 40);
    ctx.stroke();
    ctx.setLineDash([]);

    // Texte
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Signez ici', width / 2, height - 20);

    setHasSignature(false);
    if (onChange) {
      onChange(null);
    }
  };

  const save = () => {
    if (!hasSignature || !canvasRef.current) return;
    
    const signatureData = canvasRef.current.toDataURL('image/png');
    if (onSave) {
      onSave(signatureData);
    }
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="relative rounded-lg border-2 border-dashed border-surface-300 dark:border-surface-600 overflow-hidden bg-white dark:bg-surface-800">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={`cursor-crosshair ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{ touchAction: 'none' }}
        />
        
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2 text-surface-400 dark:text-surface-500">
              <Pencil className="h-5 w-5" />
              <span>Dessinez votre signature</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={clear}
            disabled={disabled || !hasSignature}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Effacer
          </Button>
        </div>
        
        {onSave && (
          <Button
            size="sm"
            onClick={save}
            disabled={disabled || !hasSignature}
          >
            <Check className="h-4 w-4 mr-1" />
            Valider la signature
          </Button>
        )}
      </div>
    </div>
  );
}

export default SignaturePad;
