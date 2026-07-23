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
    
    // Mappatura esatta basata su test-create.page.html usando gli ID
    this.templateSelect = page.locator('select#templateSelect');
    this.typeInput = page.locator('input#type');
    this.dateInput = page.locator('input#executionDate');
    this.coachNotesInput = page.locator('textarea#coachNotes');
    
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
    // Compila i campi obbligatori per sbloccare la validazione del form
    await this.page.locator('input[placeholder="Titolo"]').last().fill('Test Esercizio');
    await this.page.locator('input[placeholder="0.00"]').last().fill('100');
  }

  async submitNewTest() {
    await this.saveSessionButton.click();
    // Aspetta l'apertura del dialog di conferma e clicca il tasto finale
    await this.confirmSaveButton.click();
  }
}
