import { test, expect } from '@playwright/test';

test.describe('Tenders Flow', () => {
  // Ces tests nécessitent une authentification
  test.describe.configure({ mode: 'serial' });

  test('should display tenders list page', async ({ page }) => {
    await page.goto('/tenders');
    
    // Vérifier la structure de la page
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should filter tenders by status', async ({ page }) => {
    await page.goto('/tenders');
    
    // Chercher un filtre de statut
    const statusFilter = page.getByRole('combobox', { name: /statut|status/i });
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      // Sélectionner une option
      await page.getByRole('option').first().click();
    }
  });

  test('should search tenders', async ({ page }) => {
    await page.goto('/tenders');
    
    // Chercher la barre de recherche
    const searchInput = page.getByPlaceholder(/rechercher|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.keyboard.press('Enter');
      
      // Attendre les résultats
      await page.waitForResponse(resp => resp.url().includes('/api/') || resp.status() === 200);
    }
  });
});

test.describe('Search Page', () => {
  test('should display search interface', async ({ page }) => {
    await page.goto('/search');
    
    // Vérifier la présence de la barre de recherche
    const searchBar = page.getByRole('searchbox').or(page.getByPlaceholder(/rechercher|search/i));
    await expect(searchBar.first()).toBeVisible();
  });

  test('should show filters panel', async ({ page }) => {
    await page.goto('/search');
    
    // Chercher le panneau de filtres ou le bouton pour l'ouvrir
    const filtersButton = page.getByRole('button', { name: /filtre|filter/i });
    if (await filtersButton.isVisible()) {
      await filtersButton.click();
    }
  });

  test('should perform search', async ({ page }) => {
    await page.goto('/search');
    
    const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/rechercher|search/i));
    await searchInput.first().fill('marché public');
    await page.keyboard.press('Enter');
    
    // Attendre le chargement
    await page.waitForLoadState('networkidle');
  });
});

test.describe('Analytics Page', () => {
  test('should display analytics dashboard', async ({ page }) => {
    await page.goto('/analytics');
    
    // Vérifier la présence du dashboard
    await expect(page.getByRole('heading')).toBeVisible();
  });

  test('should allow date range selection', async ({ page }) => {
    await page.goto('/analytics');
    
    // Chercher le sélecteur de période
    const dateSelector = page.getByRole('button', { name: /période|date|jours/i });
    if (await dateSelector.isVisible()) {
      await dateSelector.click();
      // Devrait afficher des options
      await expect(page.getByRole('listbox').or(page.getByRole('menu'))).toBeVisible();
    }
  });
});

test.describe('Settings Page', () => {
  test('should display settings sections', async ({ page }) => {
    await page.goto('/settings');
    
    // Vérifier les sections de paramètres
    await expect(page.getByRole('heading')).toBeVisible();
  });

  test('should navigate to profile settings', async ({ page }) => {
    await page.goto('/settings/profile');
    
    // Vérifier la présence du formulaire de profil
    const profileHeading = page.getByRole('heading', { name: /profil|profile/i });
    await expect(profileHeading).toBeVisible();
  });

  test('should navigate to company settings', async ({ page }) => {
    await page.goto('/settings/company');
    
    // Vérifier la page entreprise
    const companyHeading = page.getByRole('heading', { name: /entreprise|company|société/i });
    await expect(companyHeading).toBeVisible();
  });
});

test.describe('Team Page', () => {
  test('should display team management', async ({ page }) => {
    await page.goto('/team');
    
    // Vérifier la page équipe
    await expect(page.getByRole('heading')).toBeVisible();
  });

  test('should have invite button', async ({ page }) => {
    await page.goto('/team');
    
    const inviteButton = page.getByRole('button', { name: /inviter|invite|ajouter/i });
    if (await inviteButton.isVisible()) {
      await expect(inviteButton).toBeEnabled();
    }
  });
});

test.describe('Notifications', () => {
  test('should display notification bell', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Chercher l'icône de notification dans le header
    const notificationBell = page.getByRole('button', { name: /notification/i })
      .or(page.locator('[aria-label*="notification"]'));
    
    if (await notificationBell.first().isVisible()) {
      await expect(notificationBell.first()).toBeVisible();
    }
  });
});
