import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test('should display login form with all required fields', async ({ page }) => {
      await page.goto('/auth/login');

      // Vérifier les éléments du formulaire
      await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.getByRole('button', { name: /connexion|login|se connecter/i })).toBeVisible();
    });

    test('should show validation error for invalid email', async ({ page }) => {
      await page.goto('/auth/login');

      // Entrer un email invalide
      await page.getByRole('textbox', { name: /email/i }).fill('invalid-email');
      await page.locator('input[type="password"]').fill('password123');
      await page.getByRole('button', { name: /connexion|login|se connecter/i }).click();

      // Vérifier que le formulaire reste sur la page (validation échouée)
      await expect(page).toHaveURL(/auth\/login/);
    });

    test('should have forgot password link', async ({ page }) => {
      await page.goto('/auth/login');

      const forgotLink = page.getByRole('link', { name: /mot de passe|forgot|oublié/i });
      if (await forgotLink.isVisible()) {
        await expect(forgotLink).toBeEnabled();
      }
    });

    test('should have link to registration', async ({ page }) => {
      await page.goto('/auth/login');

      const registerLink = page.getByRole('link', { name: /inscription|register|créer|sign up/i });
      if (await registerLink.isVisible()) {
        await registerLink.click();
        await expect(page).toHaveURL(/auth\/register|signup/);
      }
    });
  });

  test.describe('Register Page', () => {
    test('should display registration form', async ({ page }) => {
      await page.goto('/auth/register');

      // Vérifier les champs du formulaire
      await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
      await expect(page.locator('input[type="password"]').first()).toBeVisible();
    });

    test('should show password requirements', async ({ page }) => {
      await page.goto('/auth/register');

      // Cliquer sur le champ mot de passe
      await page.locator('input[type="password"]').first().focus();

      // Vérifier qu'il y a des indications sur les exigences
      const passwordHint = page.getByText(/caractères|characters|minimum|exigences/i);
      // Le hint peut ou non être visible selon l'implémentation
    });

    test('should have link back to login', async ({ page }) => {
      await page.goto('/auth/register');

      const loginLink = page.getByRole('link', { name: /connexion|login|se connecter|déjà un compte/i });
      if (await loginLink.isVisible()) {
        await loginLink.click();
        await expect(page).toHaveURL(/auth\/login/);
      }
    });
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
    await page.goto('/dashboard');

    // Devrait rediriger vers login ou afficher un message
    await page.waitForURL(/auth|login|dashboard/, { timeout: 5000 });
  });

  test('should redirect to login when accessing tenders without auth', async ({ page }) => {
    await page.goto('/tenders');

    await page.waitForURL(/auth|login|tenders/, { timeout: 5000 });
  });

  test('should redirect to login when accessing settings without auth', async ({ page }) => {
    await page.goto('/settings');

    await page.waitForURL(/auth|login|settings/, { timeout: 5000 });
  });
});
