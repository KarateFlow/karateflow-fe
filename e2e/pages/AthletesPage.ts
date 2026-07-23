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
    
    // Mappatura usando gli ID degli input per aggirare il bug delle label nei Web Components Angular
    this.nameInput = page.locator('input#firstName');
    this.surnameInput = page.locator('input#lastName');
    this.birthDateInput = page.locator('input#birthDate');
    this.referenceContactInput = page.locator('input#referenceContact');
    
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
