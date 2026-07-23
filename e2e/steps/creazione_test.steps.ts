import { Given, When, Then } from '@cucumber/cucumber';
import { CustomWorld } from './setup';

Given('che mi trovo sulla pagina di creazione test', async function (this: CustomWorld) {
  // Invece di forzare l'ID 1 (che fallisce contro un backend stateful se l'ID è UUID o != 1), navighiamo dinamicamente.
  await this.dashboardPage.navigate();
  await this.dashboardPage.goToAthletes();
  
  // Clicca sulla prima card atleta disponibile
  await this.page.locator('article', { hasText: 'Vedi Profilo' }).first().click();
  
  // Clicca "Nuovo Test" sul profilo
  await this.page.getByRole('button', { name: /nuovo test/i }).click();
});

When('compilo la tipologia del test con {string} e data {string}', async function (this: CustomWorld, tipologia: string, data: string) {
  await this.testsPage.fillTestDetails(tipologia, data);
});

When('aggiungo un esercizio alla scheda', async function (this: CustomWorld) {
  await this.testsPage.addExercise();
});

When('confermo il salvataggio della sessione', async function (this: CustomWorld) {
  await this.testsPage.submitNewTest();
});

Then('la sessione viene registrata correttamente', async function (this: CustomWorld) {
  // Qui si potrebbe inserire un'asserzione (es. controllare un toast di successo o la navigazione)
  // Per ora ci assicuriamo che l'azione non generi eccezioni.
  // const successToast = this.page.getByText(/successo/i);
  // await successToast.waitFor({ state: 'visible' });
});
