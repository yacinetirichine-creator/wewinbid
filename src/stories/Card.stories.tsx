import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FileText, Calendar, Euro, Building2 } from 'lucide-react';

/**
 * Le composant Card est utilisé pour regrouper du contenu connexe.
 * Il supporte plusieurs variantes et niveaux de padding.
 */
const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Conteneur pour regrouper du contenu avec en-tête, corps et pied de page.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outlined', 'elevated'],
      description: 'Style visuel de la carte',
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
      description: 'Taille du padding interne',
    },
    hoverable: {
      control: 'boolean',
      description: 'Effet de survol avec élévation',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Contenu de la carte',
  },
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    children: 'Carte avec bordure',
  },
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
    children: 'Carte avec ombre importante',
  },
};

export const Hoverable: Story = {
  args: {
    hoverable: true,
    children: 'Survolez cette carte',
  },
};

export const WithHeader: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Titre de la carte</CardTitle>
        <CardDescription>Une description optionnelle</CardDescription>
      </CardHeader>
      <CardContent>
        Contenu principal de la carte.
      </CardContent>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Confirmation</CardTitle>
        <CardDescription>Voulez-vous continuer ?</CardDescription>
      </CardHeader>
      <CardContent>
        Cette action est irréversible.
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm">Annuler</Button>
        <Button variant="primary" size="sm">Confirmer</Button>
      </CardFooter>
    </Card>
  ),
};

export const TenderCard: Story = {
  render: () => (
    <Card className="w-96" hoverable>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Marché de sécurité</CardTitle>
            <CardDescription>Ville de Paris</CardDescription>
          </div>
          <Badge variant="success">Ouvert</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <FileText className="w-4 h-4" />
            <span>Ref: 2024-SEC-001</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Date limite: 15/03/2024</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Euro className="w-4 h-4" />
            <span>Budget: 150 000 €</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Building2 className="w-4 h-4" />
            <span>Sécurité / Gardiennage</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" fullWidth>Voir détails</Button>
        <Button variant="primary" size="sm" fullWidth>Répondre</Button>
      </CardFooter>
    </Card>
  ),
};

export const StatsCard: Story = {
  render: () => (
    <Card className="w-64">
      <CardContent>
        <div className="text-center">
          <p className="text-sm text-gray-500">AO gagnés</p>
          <p className="text-4xl font-bold text-primary-600">24</p>
          <p className="text-sm text-green-600">+12% ce mois</p>
        </div>
      </CardContent>
    </Card>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-4">
      <Card variant="default" className="w-48 p-4">
        <p className="text-center">Default</p>
      </Card>
      <Card variant="outlined" className="w-48 p-4">
        <p className="text-center">Outlined</p>
      </Card>
      <Card variant="elevated" className="w-48 p-4">
        <p className="text-center">Elevated</p>
      </Card>
    </div>
  ),
};

export const AllPaddings: Story = {
  render: () => (
    <div className="flex gap-4">
      <Card padding="none" className="w-32 border">
        <p>None</p>
      </Card>
      <Card padding="sm" className="w-32">
        <p>Small</p>
      </Card>
      <Card padding="md" className="w-32">
        <p>Medium</p>
      </Card>
      <Card padding="lg" className="w-32">
        <p>Large</p>
      </Card>
    </div>
  ),
};
