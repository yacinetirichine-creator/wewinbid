import { z } from 'zod';

/**
 * Schémas de validation pour les appels d'offres
 */
export const TenderSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères').max(200),
  reference: z.string().optional(),
  type: z.enum(['PUBLIC', 'PRIVATE']),
  status: z.enum(['DRAFT', 'ANALYSIS', 'IN_PROGRESS', 'REVIEW', 'SUBMITTED', 'WON', 'LOST', 'ABANDONED']).optional(),
  sector: z.enum([
    'SECURITY_PRIVATE', 'SECURITY_ELECTRONIC', 'CONSTRUCTION', 'LOGISTICS',
    'IT_SOFTWARE', 'MAINTENANCE', 'CONSULTING', 'CLEANING', 'CATERING',
    'TRANSPORT', 'ENERGY', 'HEALTHCARE', 'EDUCATION', 'OTHER'
  ]).optional(),
  buyer_name: z.string().min(2).max(200).optional(),
  buyer_type: z.enum([
    'STATE', 'REGION', 'DEPARTMENT', 'MUNICIPALITY', 'PUBLIC_ESTABLISHMENT',
    'HOSPITAL', 'PRIVATE_COMPANY', 'ASSOCIATION', 'OTHER'
  ]).optional(),
  estimated_value: z.number().positive().optional(),
  deadline: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  description: z.string().max(5000).optional(),
  region: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  source_url: z.string().url().optional(),
});

export const TenderUpdateSchema = TenderSchema.partial();

/**
 * Schémas de validation pour les images IA
 */
export const ImageGenerationSchema = z.object({
  prompt: z.string().min(10, 'Le prompt doit contenir au moins 10 caractères').max(1000),
  style: z.enum([
    'professional', 'creative', 'technical', 'social', 
    'presentation', 'linkedin', 'illustration', 'photo'
  ]).default('professional'),
  size: z.enum(['1024x1024', '1792x1024', '1024x1792']).default('1024x1024'),
  quality: z.enum(['standard', 'hd']).default('hd'),
  context: z.string().max(500).optional(),
});

/**
 * Schémas de validation pour les présentations
 */
export const PresentationGenerationSchema = z.object({
  topic: z.string().min(5, 'Le sujet doit contenir au moins 5 caractères').max(200),
  context: z.string().max(1000).optional(),
  slideCount: z.number().min(3).max(20).default(5),
  style: z.enum(['professional', 'creative', 'technical', 'minimal']).default('professional'),
  includeImages: z.boolean().default(true),
  language: z.enum(['fr', 'en', 'de', 'es', 'it', 'pt', 'nl', 'ar']).default('fr'),
});

/**
 * Schémas de validation pour les documents
 */
export const DocumentSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum([
    'DC1', 'DC2', 'DC4', 'TECHNICAL_MEMO', 'DPGF', 'BPU',
    'ACTE_ENGAGEMENT', 'PLANNING', 'METHODOLOGY', 'QUALITY_PLAN',
    'SAFETY_PLAN', 'ENVIRONMENTAL_PLAN', 'REFERENCES_LIST',
    'COMMERCIAL_PROPOSAL', 'QUOTE', 'COMPANY_PRESENTATION',
    'COVER_LETTER', 'APPENDIX', 'INSURANCE_RC', 'INSURANCE_DECENNALE',
    'TAX_ATTESTATION', 'SOCIAL_ATTESTATION', 'KBIS', 'RIB', 'OTHER'
  ]),
  tender_id: z.string().uuid().optional(),
  content: z.string().optional(),
  file_url: z.string().url().optional(),
});

/**
 * Schémas de validation pour les entreprises
 */
export const CompanySchema = z.object({
  name: z.string().min(2).max(200),
  legal_name: z.string().min(2).max(200).optional(),
  siret: z.string().regex(/^\d{14}$/, 'SIRET doit contenir 14 chiffres').optional(),
  siren: z.string().regex(/^\d{9}$/, 'SIREN doit contenir 9 chiffres').optional(),
  vat_number: z.string().max(20).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  website: z.string().url().optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  postal_code: z.string().max(10).optional(),
  country: z.string().length(2).default('FR'),
  description: z.string().max(2000).optional(),
});

/**
 * Schémas de validation pour l'authentification
 */
export const LoginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

export const RegisterSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Doit contenir au moins un chiffre'),
  confirmPassword: z.string(),
  fullName: z.string().min(2).max(100),
  companyName: z.string().min(2).max(200),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'Vous devez accepter les conditions',
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

/**
 * Types TypeScript générés à partir des schémas Zod
 */
export type TenderInput = z.infer<typeof TenderSchema>;
export type TenderUpdateInput = z.infer<typeof TenderUpdateSchema>;
export type ImageGenerationInput = z.infer<typeof ImageGenerationSchema>;
export type PresentationGenerationInput = z.infer<typeof PresentationGenerationSchema>;
export type DocumentInput = z.infer<typeof DocumentSchema>;
export type CompanyInput = z.infer<typeof CompanySchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
