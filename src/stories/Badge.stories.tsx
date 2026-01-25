import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '@/components/ui/Badge';
import { Check, AlertTriangle, Clock, Star, X } from 'lucide-react';

/**
 * Le composant Badge affiche des indicateurs de statut, catégories ou métadonnées.
 */
const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Badge accessible pour afficher des statuts et catégories.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'secondary', 'success', 'warning', 'danger', 'info', 'outline'],
      description: 'Style visuel du badge',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Taille du badge',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Badge',
  },
};

export const Primary: Story = {
  args: {
    children: 'En cours',
    variant: 'primary',
  },
};

export const Success: Story = {
  args: {
    children: 'Gagné',
    variant: 'success',
  },
};

export const Warning: Story = {
  args: {
    children: 'En attente',
    variant: 'warning',
  },
};

export const Danger: Story = {
  args: {
    children: 'Perdu',
    variant: 'danger',
  },
};

export const Info: Story = {
  args: {
    children: 'Information',
    variant: 'info',
  },
};

export const Outline: Story = {
  args: {
    children: 'Brouillon',
    variant: 'outline',
  },
};

// Avec icônes
export const WithIcon: Story = {
  args: {
    children: 'Validé',
    variant: 'success',
    icon: <Check className="w-3 h-3" />,
  },
};

export const WarningWithIcon: Story = {
  args: {
    children: 'Attention',
    variant: 'warning',
    icon: <AlertTriangle className="w-3 h-3" />,
  },
};

// Suppressible
export const Removable: Story = {
  args: {
    children: 'Tag',
    variant: 'primary',
    onRemove: () => alert('Badge supprimé'),
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

// Statuts d'appels d'offres
export const TenderStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline">Brouillon</Badge>
      <Badge variant="primary">Publié</Badge>
      <Badge variant="info" icon={<Clock className="w-3 h-3" />}>En cours</Badge>
      <Badge variant="warning">En attente</Badge>
      <Badge variant="success" icon={<Check className="w-3 h-3" />}>Gagné</Badge>
      <Badge variant="danger" icon={<X className="w-3 h-3" />}>Perdu</Badge>
    </div>
  ),
};

// Tags/Catégories
export const Tags: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="primary" onRemove={() => {}}>Sécurité</Badge>
      <Badge variant="primary" onRemove={() => {}}>BTP</Badge>
      <Badge variant="primary" onRemove={() => {}}>IT</Badge>
      <Badge variant="primary" onRemove={() => {}}>Formation</Badge>
    </div>
  ),
};

// Toutes les variantes
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="primary">Primary</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="danger">Danger</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
};

// Toutes les tailles
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  ),
};

// Notation avec étoiles
export const Rating: Story = {
  render: () => (
    <Badge variant="warning" size="lg" icon={<Star className="w-4 h-4 fill-current" />}>
      4.8
    </Badge>
  ),
};
