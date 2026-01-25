import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@/components/ui/Button';
import { Mail, ArrowRight, Loader2, Plus, Trash2 } from 'lucide-react';

/**
 * Le composant Button est le principal élément d'action de l'interface.
 * Il supporte plusieurs variantes, tailles et états.
 */
const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Bouton accessible avec support des variantes, icônes et états de chargement.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'soft', 'accent', 'success', 'danger', 'warning', 'outline', 'ghost', 'link'],
      description: 'Style visuel du bouton',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'icon'],
      description: 'Taille du bouton',
    },
    isLoading: {
      control: 'boolean',
      description: 'Affiche un spinner de chargement',
    },
    disabled: {
      control: 'boolean',
      description: 'Désactive le bouton',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Bouton pleine largeur',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Variantes de base
export const Primary: Story = {
  args: {
    children: 'Bouton principal',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Bouton secondaire',
    variant: 'secondary',
  },
};

export const Danger: Story = {
  args: {
    children: 'Supprimer',
    variant: 'danger',
    leftIcon: <Trash2 className="w-4 h-4" />,
  },
};

export const Success: Story = {
  args: {
    children: 'Confirmer',
    variant: 'success',
  },
};

export const Outline: Story = {
  args: {
    children: 'Annuler',
    variant: 'outline',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Action discrète',
    variant: 'ghost',
  },
};

// Tailles
export const Small: Story = {
  args: {
    children: 'Petit',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    children: 'Grand',
    size: 'lg',
  },
};

export const ExtraLarge: Story = {
  args: {
    children: 'Très grand',
    size: 'xl',
  },
};

// Avec icônes
export const WithLeftIcon: Story = {
  args: {
    children: 'Envoyer',
    leftIcon: <Mail className="w-4 h-4" />,
  },
};

export const WithRightIcon: Story = {
  args: {
    children: 'Continuer',
    rightIcon: <ArrowRight className="w-4 h-4" />,
  },
};

export const IconOnly: Story = {
  args: {
    children: <Plus className="w-5 h-5" />,
    size: 'icon',
    'aria-label': 'Ajouter',
  },
};

// États
export const Loading: Story = {
  args: {
    children: 'Chargement...',
    isLoading: true,
  },
};

export const Disabled: Story = {
  args: {
    children: 'Désactivé',
    disabled: true,
  },
};

export const FullWidth: Story = {
  args: {
    children: 'Pleine largeur',
    fullWidth: true,
  },
  parameters: {
    layout: 'padded',
  },
};

// Toutes les variantes
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="soft">Soft</Button>
      <Button variant="accent">Accent</Button>
      <Button variant="success">Success</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="warning">Warning</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

// Toutes les tailles
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
      <Button size="icon"><Plus className="w-5 h-5" /></Button>
    </div>
  ),
};
