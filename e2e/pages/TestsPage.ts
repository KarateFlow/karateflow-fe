import { Page, Locator } from '@playwright/test';

export class TestsPage {
  readonly page: Page;
  
  // Locators for Test Creation Form (basato su test-create.page.html)
  readonly templateSelect: Locator;
  readonly typeInput: Locator;
  readonly dateInput: Locator;
  readonly coachNotesInput: Locator;
  readonly addExerciseButton: Locator;
  readonly saveSessionButton: Locator;
  readonly confirmSaveButton: Locator;
  
  constructor(page: Page) {
    this.page = page;
    
    // Mappatura esatta basata su test-create.page.html
    this.templateSelect = page.getByLabel(/seleziona template/i);
    this.typeInput = page.getByLabel(/tipologia sessione/i);
    this.dateInput = page.getByLabel(/data esecuzione/i);
    this.coachNotesInput = page.getByLabel(/note del coach/i);
    
    this.addExerciseButton = page.getByRole('button', { name: /\+ aggiungi esercizio/i });
    this.saveSessionButton = page.getByRole('button', { name: /salva sessione/i });
    
    // Per il dialog di conferma finale ("Sì, salva")
    this.confirmSaveButton = page.getByRole('button', { name: /sì, salva/i });
  }

  async fillTestDetails(type: string, dateStr: string) {
    await this.typeInput.fill(type);
    await this.dateInput.fill(dateStr);
  }
  
  async addExercise() {
    await this.addExerciseButton.click();
  }

  async submitNewTest() {
    await this.saveSessionButton.click();
    // Aspetta l'apertura del dialog di conferma e clicca il tasto finale
    await this.confirmSaveButton.click();
  }
}
