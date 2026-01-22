'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import TemplateLibrary from '@/components/templates/TemplateLibrary';
import { FileText } from 'lucide-react';

interface TemplateInsertButtonProps {
  onInsert: (content: string) => void;
  className?: string;
  buttonText?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
}

export function TemplateInsertButton({
  onInsert,
  className = '',
  buttonText = 'Insérer un template',
  size = 'sm',
  variant = 'ghost',
}: TemplateInsertButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleInsert = (content: string) => {
    onInsert(content);
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(true)}
        className={className}
      >
        <FileText className="h-4 w-4 mr-2" />
        {buttonText}
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Bibliothèque de templates"
        size="xl"
      >
        <div className="h-[70vh]">
          <TemplateLibrary
            selectionMode
            onInsertTemplate={handleInsert}
          />
        </div>
      </Modal>
    </>
  );
}

export default TemplateInsertButton;
