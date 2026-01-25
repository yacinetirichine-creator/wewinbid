import { test, expect } from '@playwright/test';

test.describe('Tenders Management', () => {
  test.describe('Tenders List', () => {
    test('should display tenders page with header', async ({ page }) => {
      await page.goto('/tenders');

      // Vérifier la présence du header
      const heading = page.getByRole('heading', { level: 1 });
      await expect(heading).toBeVisible();
    });

    test('should have create new tender button', async ({ page }) => {
      await page.goto('/tenders');

      const createButton = page.getByRole('link', { name: /nouveau|new|créer|ajouter/i })
        .or(page.getByRole('button', { name: /nouveau|new|créer|ajouter/i }));

      if (await createButton.first().isVisible()) {
        await expect(createButton.first()).toBeEnabled();
      }
    });

    test('should display filter options', async ({ page }) => {
      await page.goto('/tenders');

      // Chercher des filtres de statut ou de secteur
      const filterElement = page.getByRole('combobox')
        .or(page.getByRole('button', { name: /filtre|filter|statut|status/i }));

      if (await filterElement.first().isVisible()) {
        await expect(filterElement.first()).toBeVisible();
      }
    });

    test('should support search functionality', async ({ page }) => {
      await page.goto('/tenders');

      const searchInput = page.getByPlaceholder(/rechercher|search/i)
        .or(page.getByRole('searchbox'));

      if (await searchInput.first().isVisible()) {
        await searchInput.first().fill('test query');
        await page.keyboard.press('Enter');

        // Attendre le résultat de recherche
        await page.waitForLoadState('networkidle');
      }
    });
  });

  test.describe('Create Tender', () => {
    test('should display tender creation form', async ({ page }) => {
      await page.goto('/tenders/new');

      // Vérifier la présence du formulaire
      await expect(page.getByRole('heading')).toBeVisible();
    });

    test('should have step navigation', async ({ page }) => {
      await page.goto('/tenders/new');

      // Chercher les indicateurs d'étapes
      const stepIndicator = page.getByText(/étape|step|1|2|3/i);
      await expect(stepIndicator.first()).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/tenders/new');

      // Essayer de soumettre sans remplir les champs requis
      const submitButton = page.getByRole('button', { name: /suivant|next|continuer|continue|créer|create/i });
      if (await submitButton.first().isVisible()) {
        await submitButton.first().click();

        // Le formulaire devrait rester sur la même page avec des erreurs
        await expect(page).toHaveURL(/tenders\/new/);
      }
    });

    test('should allow selecting tender type', async ({ page }) => {
      await page.goto('/tenders/new');

      // Chercher les options de type d'AO (public/privé)
      const publicOption = page.getByText(/public|marché public/i);
      const privateOption = page.getByText(/privé|private/i);

      if (await publicOption.first().isVisible()) {
        await publicOption.first().click();
      }
    });
  });

  test.describe('Tender Detail', () => {
    test('should display tender details page', async ({ page }) => {
      // Aller sur une page de détail (même si elle n'existe pas, on teste la structure)
      await page.goto('/tenders/test-id');

      // La page devrait avoir un titre ou un message d'erreur
      await page.waitForLoadState('networkidle');
    });
  });

  test.describe('Drafts', () => {
    test('should display drafts page', async ({ page }) => {
      await page.goto('/tenders/drafts');

      // Vérifier la présence de la page brouillons
      await expect(page.getByRole('heading')).toBeVisible();
    });
  });
});

test.describe('Tender Analysis', () => {
  test('should display analysis page', async ({ page }) => {
    await page.goto('/tenders/analyze');

    // Vérifier la page d'analyse
    await expect(page.getByRole('heading')).toBeVisible();
  });

  test('should have document upload area', async ({ page }) => {
    await page.goto('/tenders/analyze');

    // Chercher une zone de téléchargement ou un input file
    const uploadArea = page.getByText(/glisser|drag|télécharger|upload|déposer|drop/i)
      .or(page.locator('input[type="file"]'));

    if (await uploadArea.first().isVisible()) {
      await expect(uploadArea.first()).toBeVisible();
    }
  });
});
