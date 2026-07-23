import { Given, When, Then } from '@cucumber/cucumber';
import { CustomWorld } from './setup';

Given('che mi trovo sulla dashboard di KarateFlow', async function (this: CustomWorld) {
  await this.dashboardPage.navigate();
});

When('navigo nella sezione Atleti', async function (this: CustomWorld) {
  await this.dashboardPage.goToAthletes();
});

When('avvio la procedura di creazione nuovo atleta', async function (this: CustomWorld) {
  await this.athletesPage.clickNewAthlete();
});

When('compilo i dati anagrafici con nome {string}, cognome {string} e data {string}', async function (this: CustomWorld, nome: string, cognome: string, data: string) {
  await this.athletesPage.fillAthleteDetails(nome, cognome, data);
});

Then('il sistema deve procedere con la registrazione', async function (this: CustomWorld) {
  await this.athletesPage.submitNewAthlete();
});
