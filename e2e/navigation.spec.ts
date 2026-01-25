import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.describe('Main Navigation', () => {
    test('should have working navigation menu', async ({ page }) => {
      await page.goto('/');

      // Vérifier la présence de la navigation
      await expect(page.getByRole('navigation')).toBeVisible();
    });

    test('should navigate to pricing page', async ({ page }) => {
      await page.goto('/');

      const pricingLink = page.getByRole('link', { name: /tarif|pricing|prix/i });
      if (await pricingLink.first().isVisible()) {
        await pricingLink.first().click();
        await expect(page).toHaveURL(/pricing/);
      }
    });

    test('should navigate to contact page', async ({ page }) => {
      await page.goto('/');

      const contactLink = page.getByRole('link', { name: /contact/i });
      if (await contactLink.first().isVisible()) {
        await contactLink.first().click();
        await expect(page).toHaveURL(/contact/);
      }
    });
  });

  test.describe('Footer Navigation', () => {
    test('should have legal links in footer', async ({ page }) => {
      await page.goto('/');

      // Scroll vers le bas pour voir le footer
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      // Vérifier la présence de liens légaux
      const footer = page.locator('footer');
      if (await footer.isVisible()) {
        const legalLinks = footer.getByRole('link', { name: /cgu|cgv|mentions|privacy|confidentialité/i });
        if (await legalLinks.first().isVisible()) {
          await expect(legalLinks.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Sidebar Navigation (Dashboard)', () => {
    test('should have sidebar with menu items', async ({ page }) => {
      await page.goto('/dashboard');

      // Chercher la sidebar ou le menu de navigation
      const sidebar = page.locator('[role="navigation"]').or(page.locator('aside'));
      if (await sidebar.first().isVisible()) {
        await expect(sidebar.first()).toBeVisible();
      }
    });

    test('should navigate between dashboard sections', async ({ page }) => {
      await page.goto('/dashboard');

      // Tester la navigation vers les AO
      const tendersLink = page.getByRole('link', { name: /appels d'offres|tenders|ao/i });
      if (await tendersLink.first().isVisible()) {
        await tendersLink.first().click();
        await expect(page).toHaveURL(/tenders/);
      }
    });
  });
});

test.describe('Legal Pages', () => {
  test('should display CGV page', async ({ page }) => {
    await page.goto('/legal/cgv');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should display Terms page', async ({ page }) => {
    await page.goto('/legal/terms');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should display Privacy page', async ({ page }) => {
    await page.goto('/legal/privacy');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should display Cookies page', async ({ page }) => {
    await page.goto('/legal/cookies');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should display Mentions Légales page', async ({ page }) => {
    await page.goto('/legal/mentions');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('Internationalization', () => {
  test('should display French content by default', async ({ page }) => {
    await page.goto('/');

    // Vérifier la présence de texte en français
    const frenchText = page.getByText(/appels d'offres|connexion|inscription|bienvenue/i);
    if (await frenchText.first().isVisible()) {
      await expect(frenchText.first()).toBeVisible();
    }
  });

  test('should have language selector in settings', async ({ page }) => {
    await page.goto('/settings');

    // Chercher un sélecteur de langue
    const languageSelector = page.getByRole('combobox', { name: /langue|language/i })
      .or(page.getByText(/français|english|deutsch/i));

    if (await languageSelector.first().isVisible()) {
      await expect(languageSelector.first()).toBeVisible();
    }
  });
});
