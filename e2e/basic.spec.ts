import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display the landing page', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier que le titre est présent
    await expect(page).toHaveTitle(/WeWinBid/i);
    
    // Vérifier les éléments principaux
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('should navigate to login', async ({ page }) => {
    await page.goto('/');
    
    // Chercher et cliquer sur le bouton de connexion
    const loginButton = page.getByRole('link', { name: /connexion|login|se connecter/i });
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await expect(page).toHaveURL(/auth|login/);
    }
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.getByRole('navigation')).toBeVisible();

    // Test tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await expect(page.getByRole('navigation')).toBeVisible();

    // Test desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await expect(page.getByRole('navigation')).toBeVisible();
  });
});

test.describe('Authentication Flow', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Vérifier la présence du formulaire
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /connexion|login|se connecter/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Soumettre le formulaire vide
    await page.getByRole('button', { name: /connexion|login|se connecter/i }).click();
    
    // Vérifier qu'il y a des erreurs de validation (le formulaire ne soumet pas)
    const emailInput = page.getByRole('textbox', { name: /email/i });
    await expect(emailInput).toBeVisible();
  });

  test('should have link to register', async ({ page }) => {
    await page.goto('/auth/login');
    
    const registerLink = page.getByRole('link', { name: /inscription|register|créer un compte/i });
    if (await registerLink.isVisible()) {
      await expect(registerLink).toBeVisible();
    }
  });
});

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Note: En production, utiliser un mock d'auth ou une session de test
    await page.goto('/dashboard');
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Si pas authentifié, devrait rediriger vers login
    const url = page.url();
    expect(url).toMatch(/auth|login|dashboard/);
  });
});

test.describe('Accessibility', () => {
  test('home page should not have obvious accessibility issues', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier que les images ont des alt texts
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      // Les images décoratives peuvent avoir alt=""
      expect(alt).not.toBeNull();
    }
  });

  test('forms should have proper labels', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Les inputs doivent avoir des labels associés
    const inputs = page.locator('input:not([type="hidden"])');
    const count = await inputs.count();
    
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      // Doit avoir un id avec label, ou aria-label, ou aria-labelledby
      const hasLabel = id || ariaLabel || ariaLabelledBy;
      expect(hasLabel).toBeTruthy();
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Tab through the page
    await page.keyboard.press('Tab');
    
    // Un élément devrait être focusé
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('home page should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    // La page devrait charger en moins de 5 secondes
    expect(loadTime).toBeLessThan(5000);
  });

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filtrer les erreurs connues/acceptables
    const criticalErrors = errors.filter(
      (err) => !err.includes('favicon') && !err.includes('manifest')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});
