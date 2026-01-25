import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '@/components/ui/Input';
import { Mail, Lock, Search, Euro, Phone, Building2, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

/**
 * Le composant Input est utilisé pour la saisie de texte dans les formulaires.
 * Il supporte les labels, messages d'aide, validation et icônes.
 */
const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Champ de saisie accessible avec support des labels, validation et icônes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Label du champ',
    },
    helperText: {
      control: 'text',
      description: 'Texte d\'aide',
    },
    error: {
      control: 'text',
      description: 'Message d\'erreur',
    },
    success: {
      control: 'boolean',
      description: 'État de succès',
    },
    disabled: {
      control: 'boolean',
      description: 'Champ désactivé',
    },
    required: {
      control: 'boolean',
      description: 'Champ obligatoire',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Largeur complète',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Entrez du texte...',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Nom complet',
    placeholder: 'Jean Dupont',
  },
};

export const Required: Story = {
  args: {
    label: 'Email',
    placeholder: 'email@exemple.com',
    required: true,
    type: 'email',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'SIRET',
    placeholder: '123 456 789 00012',
    helperText: 'Le numéro SIRET à 14 chiffres de votre entreprise',
  },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    value: 'email-invalide',
    error: 'Veuillez entrer une adresse email valide',
    type: 'email',
  },
};

export const WithSuccess: Story = {
  args: {
    label: 'SIRET',
    value: '12345678900012',
    success: true,
    helperText: 'SIRET vérifié',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Champ désactivé',
    value: 'Non modifiable',
    disabled: true,
  },
};

// Avec icônes
export const WithLeftIcon: Story = {
  args: {
    label: 'Email',
    placeholder: 'email@exemple.com',
    leftIcon: <Mail className="w-4 h-4" />,
    type: 'email',
  },
};

export const WithRightIcon: Story = {
  args: {
    label: 'Recherche',
    placeholder: 'Rechercher un AO...',
    rightIcon: <Search className="w-4 h-4" />,
  },
};

export const WithBothIcons: Story = {
  args: {
    label: 'Budget',
    placeholder: '0.00',
    leftIcon: <Euro className="w-4 h-4" />,
    type: 'number',
  },
};

// Champ mot de passe avec toggle
export const PasswordWithToggle: Story = {
  render: () => {
    const [showPassword, setShowPassword] = useState(false);
    return (
      <Input
        label="Mot de passe"
        type={showPassword ? 'text' : 'password'}
        placeholder="••••••••"
        leftIcon={<Lock className="w-4 h-4" />}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="focus:outline-none"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
      />
    );
  },
};

// Types d'input
export const EmailInput: Story = {
  args: {
    label: 'Email professionnel',
    type: 'email',
    placeholder: 'contact@entreprise.com',
    leftIcon: <Mail className="w-4 h-4" />,
  },
};

export const PhoneInput: Story = {
  args: {
    label: 'Téléphone',
    type: 'tel',
    placeholder: '+33 6 12 34 56 78',
    leftIcon: <Phone className="w-4 h-4" />,
  },
};

export const NumberInput: Story = {
  args: {
    label: 'Montant',
    type: 'number',
    placeholder: '0',
    leftIcon: <Euro className="w-4 h-4" />,
  },
};

// Formulaire complet
export const FormExample: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <Input
        label="Raison sociale"
        placeholder="Ma Société SAS"
        leftIcon={<Building2 className="w-4 h-4" />}
        required
      />
      <Input
        label="SIRET"
        placeholder="123 456 789 00012"
        helperText="14 chiffres sans espaces"
        required
      />
      <Input
        label="Email de contact"
        type="email"
        placeholder="contact@societe.com"
        leftIcon={<Mail className="w-4 h-4" />}
        required
      />
      <Input
        label="Téléphone"
        type="tel"
        placeholder="+33 1 23 45 67 89"
        leftIcon={<Phone className="w-4 h-4" />}
      />
    </div>
  ),
};

// États de validation
export const ValidationStates: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <Input
        label="État normal"
        placeholder="Saisie normale"
      />
      <Input
        label="État de succès"
        value="valeur@valide.com"
        success
      />
      <Input
        label="État d'erreur"
        value="invalide"
        error="Ce champ contient une erreur"
      />
      <Input
        label="État désactivé"
        value="Non modifiable"
        disabled
      />
    </div>
  ),
};

export const FullWidth: Story = {
  args: {
    label: 'Adresse complète',
    placeholder: '123 rue de la République, 75001 Paris',
    fullWidth: true,
  },
  parameters: {
    layout: 'padded',
  },
};
