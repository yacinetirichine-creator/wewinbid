import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Types d'erreurs personnalisées
 */
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Classe d'erreur personnalisée
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Formatte les erreurs Zod en format lisible
 */
function formatZodError(error: ZodError) {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}

/**
 * Handler d'erreurs centralisé pour les routes API
 * 
 * @param error - L'erreur à traiter
 * @returns NextResponse avec le code d'erreur approprié
 * 
 * @example
 * ```typescript
 * try {
 *   // Code API
 * } catch (error) {
 *   return handleApiError(error);
 * }
 * ```
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  // Erreur de validation Zod
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: ErrorCode.VALIDATION_ERROR,
        message: 'Erreur de validation',
        details: formatZodError(error),
      },
      { status: 400 }
    );
  }

  // Erreur personnalisée AppError
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.code,
        message: error.message,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  // Erreur OpenAI
  if (error && typeof error === 'object' && 'error' in error) {
    const openaiError = error as any;
    
    if (openaiError.error?.code === 'content_policy_violation') {
      return NextResponse.json(
        {
          error: ErrorCode.VALIDATION_ERROR,
          message: 'Le contenu demandé viole les règles de contenu. Veuillez reformuler.',
        },
        { status: 400 }
      );
    }

    if (openaiError.error?.code === 'billing_hard_limit_reached') {
      return NextResponse.json(
        {
          error: ErrorCode.EXTERNAL_API_ERROR,
          message: 'Limite de crédit OpenAI atteinte. Veuillez contacter le support.',
        },
        { status: 402 }
      );
    }

    if (openaiError.error?.code === 'rate_limit_exceeded') {
      return NextResponse.json(
        {
          error: ErrorCode.RATE_LIMIT_EXCEEDED,
          message: 'Trop de requêtes. Veuillez réessayer dans quelques instants.',
        },
        { status: 429 }
      );
    }
  }

  // Erreur Supabase
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as any;
    
    if (supabaseError.code === '23505') {
      return NextResponse.json(
        {
          error: ErrorCode.VALIDATION_ERROR,
          message: 'Cette ressource existe déjà.',
        },
        { status: 409 }
      );
    }

    if (supabaseError.code === '23503') {
      return NextResponse.json(
        {
          error: ErrorCode.VALIDATION_ERROR,
          message: 'Référence invalide.',
        },
        { status: 400 }
      );
    }
  }

  // Erreur générique
  return NextResponse.json(
    {
      error: ErrorCode.INTERNAL_ERROR,
      message: 'Une erreur interne est survenue.',
      ...(process.env.NODE_ENV === 'development' && {
        details: error instanceof Error ? error.message : String(error),
      }),
    },
    { status: 500 }
  );
}

/**
 * Wrapper pour les routes API avec gestion d'erreurs automatique
 * 
 * @param handler - La fonction handler de la route
 * @returns Handler avec gestion d'erreurs
 * 
 * @example
 * ```typescript
 * export const GET = withErrorHandler(async (request) => {
 *   // Code de la route
 *   return NextResponse.json({ data });
 * });
 * ```
 */
export function withErrorHandler(
  handler: (request: Request, context?: any) => Promise<NextResponse>
) {
  return async (request: Request, context?: any) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Utilitaires de validation
 */
export function throwValidationError(message: string, details?: any): never {
  throw new AppError(ErrorCode.VALIDATION_ERROR, message, 400, details);
}

export function throwAuthError(message: string = 'Non authentifié'): never {
  throw new AppError(ErrorCode.AUTHENTICATION_ERROR, message, 401);
}

export function throwAuthorizationError(message: string = 'Non autorisé'): never {
  throw new AppError(ErrorCode.AUTHORIZATION_ERROR, message, 403);
}

export function throwNotFoundError(resource: string = 'Ressource'): never {
  throw new AppError(ErrorCode.NOT_FOUND, `${resource} introuvable`, 404);
}

export function throwRateLimitError(message: string = 'Trop de requêtes'): never {
  throw new AppError(ErrorCode.RATE_LIMIT_EXCEEDED, message, 429);
}
