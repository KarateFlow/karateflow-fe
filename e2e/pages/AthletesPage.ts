import { Page, Locator } from '@playwright/test';

export class AthletesPage {
  readonly page: Page;
  
  // Locators
  readonly newAthleteButton: Locator;
  readonly nameInput: Locator;
  readonly surnameInput: Locator;
  readonly birthDateInput: Locator;
  readonly referenceContactInput: Locator;
  readonly submitButton: Locator;
  
  constructor(page: Page) {
    this.page = page;
    
    // Mappatura esatta basata su athlete-list.page.html
    this.newAthleteButton = page.getByRole('button', { name: /nuovo atleta/i });
    
    // Mappatura esatta basata su athlete-form.component.html
    this.nameInput = page.getByLabel(/^nome$/i);
    this.surnameInput = page.getByLabel(/^cognome$/i);
    this.birthDateInput = page.getByLabel(/data di nascita/i);
    this.referenceContactInput = page.getByLabel(/contatto di riferimento/i);
    
    this.submitButton = page.getByRole('button', { name: /registra atleta/i });
  }

  async navigate() {
    await this.page.goto('/athletes');
  }

  async clickNewAthlete() {
    await this.newAthleteButton.click();
  }

  async fillAthleteDetails(name: string, surname: string, birthDate: string) {
    await this.nameInput.fill(name);
    await this.surnameInput.fill(surname);
    await this.birthDateInput.fill(birthDate);
  }

  async submitNewAthlete() {
    await this.submitButton.click();
  }
}
