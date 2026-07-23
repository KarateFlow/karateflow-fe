import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  
  // Locators
  readonly homeNav: Locator;
  readonly athletesNav: Locator;
  readonly settingsNav: Locator;
  readonly templatesNav: Locator;
  
  constructor(page: Page) {
    this.page = page;
    
    // Mappatura esatta basata su layout/sidebar/sidebar.component.html
    this.homeNav = page.getByRole('link', { name: /^home$/i });
    this.athletesNav = page.getByRole('link', { name: /^atleti$/i });
    this.settingsNav = page.getByRole('link', { name: /^impostazioni$/i });
    // Usiamo una regex flessibile che prende sia "Templates" (desktop) che "Template di Test" (mobile)
    this.templatesNav = page.getByRole('link', { name: /template/i });
  }

  async navigate() {
    await this.page.goto('/');
  }

  async goToAthletes() {
    await this.athletesNav.click();
  }

  async goToTests() {
    await this.templatesNav.click();
  }
}
