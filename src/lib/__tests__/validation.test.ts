/**
 * @jest-environment node
 */

import {
  TenderSchema,
  ImageGenerationSchema,
  PresentationGenerationSchema,
  DocumentSchema,
  LoginSchema,
  RegisterSchema,
} from '../validation';

describe('validation schemas', () => {
  describe('TenderSchema', () => {
    it('should validate correct tender data', () => {
      const validTender = {
        title: 'Construction de bâtiment',
        type: 'PUBLIC',
        status: 'DRAFT',
        sector: 'CONSTRUCTION',
        deadline: '2024-12-31T23:59:59Z',
      };

      const result = TenderSchema.safeParse(validTender);
      expect(result.success).toBe(true);
    });

    it('should reject title too short', () => {
      const invalidTender = {
        title: 'AO',
        type: 'PUBLIC',
        deadline: '2024-12-31T23:59:59Z',
      };

      const result = TenderSchema.safeParse(invalidTender);
      expect(result.success).toBe(false);
    });

    it('should reject negative estimated value', () => {
      const invalidTender = {
        title: 'Valid title here',
        type: 'PUBLIC',
        estimated_value: -1000,
        deadline: '2024-12-31T23:59:59Z',
      };

      const result = TenderSchema.safeParse(invalidTender);
      expect(result.success).toBe(false);
    });
  });

  describe('ImageGenerationSchema', () => {
    it('should validate correct image generation params', () => {
      const validParams = {
        prompt: 'A professional team working on a construction project',
        style: 'professional',
        size: '1024x1024',
        quality: 'hd',
      };

      const result = ImageGenerationSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it('should reject prompt too short', () => {
      const invalidParams = {
        prompt: 'short',
        style: 'professional',
        size: '1024x1024',
      };

      const result = ImageGenerationSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });

    it('should reject invalid style', () => {
      const invalidParams = {
        prompt: 'Valid long prompt here',
        style: 'invalid-style',
        size: '1024x1024',
      };

      const result = ImageGenerationSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });

    it('should reject invalid size', () => {
      const invalidParams = {
        prompt: 'Valid long prompt here',
        style: 'professional',
        size: '500x500',
      };

      const result = ImageGenerationSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });

    it('should accept optional context', () => {
      const validParams = {
        prompt: 'A professional team working',
        style: 'professional',
        size: '1024x1024',
        quality: 'hd',
        context: 'LinkedIn post about winning a tender',
      };

      const result = ImageGenerationSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });
  });

  describe('PresentationGenerationSchema', () => {
    it('should validate correct presentation params', () => {
      const validParams = {
        topic: 'Innovation in public procurement',
        slideCount: 8,
        style: 'professional',
        includeImages: true,
        language: 'en',
      };

      const result = PresentationGenerationSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it('should reject slide count too low', () => {
      const invalidParams = {
        topic: 'Valid topic',
        slideCount: 2,
        style: 'professional',
      };

      const result = PresentationGenerationSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });

    it('should reject slide count too high', () => {
      const invalidParams = {
        topic: 'Valid topic',
        slideCount: 25,
        style: 'professional',
      };

      const result = PresentationGenerationSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });
  });
  describe('DocumentSchema', () => {
    it('should validate correct document data', () => {
      const validDocument = {
        name: 'KBIS.pdf',
        type: 'KBIS',
        file_url: 'https://example.com/kbis.pdf',
      };

      const result = DocumentSchema.safeParse(validDocument);
      expect(result.success).toBe(true);
    });

    it('should accept optional fields', () => {
      const validDocument = {
        name: 'Technical Memo.pdf',
        type: 'TECHNICAL_MEMO',
        file_url: 'https://example.com/memo.pdf',
        content: 'Detailed technical specifications...',
        tender_id: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = DocumentSchema.safeParse(validDocument);
      expect(result.success).toBe(true);
    });

    it('should reject invalid type', () => {
      const invalidDocument = {
        name: 'Test.pdf',
        type: 'INVALID_TYPE',
        file_url: 'https://example.com/test.pdf',
      };

      const result = DocumentSchema.safeParse(invalidDocument);
      expect(result.success).toBe(false);
    });
  });

  describe('LoginSchema', () => {
    it('should validate correct login data', () => {
      const validLogin = {
        email: 'user@example.com',
        password: 'securePassword123',
      };

      const result = LoginSchema.safeParse(validLogin);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidLogin = {
        email: 'not-an-email',
        password: 'password123',
      };

      const result = LoginSchema.safeParse(invalidLogin);
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const invalidLogin = {
        email: 'user@example.com',
        password: '12345',
      };

      const result = LoginSchema.safeParse(invalidLogin);
      expect(result.success).toBe(false);
    });
  });

  describe('RegisterSchema', () => {
    it('should validate correct registration data', () => {
      const validRegister = {
        email: 'newuser@example.com',
        password: 'SecurePass123',
        confirmPassword: 'SecurePass123',
        fullName: 'John Doe',
        companyName: 'Acme Corp',
        acceptTerms: true,
      };

      const result = RegisterSchema.safeParse(validRegister);
      expect(result.success).toBe(true);
    });

    it('should reject name too short', () => {
      const invalidRegister = {
        email: 'user@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        fullName: 'J',
        companyName: 'Valid Company',
        acceptTerms: true,
      };

      const result = RegisterSchema.safeParse(invalidRegister);
      expect(result.success).toBe(false);
    });

    it('should reject password without uppercase', () => {
      const invalidRegister = {
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        fullName: 'John Doe',
        companyName: 'Test Company',
        acceptTerms: true,
      };

      const result = RegisterSchema.safeParse(invalidRegister);
      expect(result.success).toBe(false);
    });

    it('should reject mismatched passwords', () => {
      const invalidRegister = {
        email: 'user@example.com',
        password: 'Password123',
        confirmPassword: 'DifferentPass123',
        fullName: 'John Doe',
        companyName: 'Test Company',
        acceptTerms: true,
      };

      const result = RegisterSchema.safeParse(invalidRegister);
      expect(result.success).toBe(false);
    });
  });
});
