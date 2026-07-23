import { setWorldConstructor, World, Before, After, setDefaultTimeout } from '@cucumber/cucumber';
import { chromium, Browser, BrowserContext, Page } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { AthletesPage } from '../pages/AthletesPage';
import { TestsPage } from '../pages/TestsPage';

setDefaultTimeout(60000);

export class CustomWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  
  // Page Objects
  dashboardPage!: DashboardPage;
  athletesPage!: AthletesPage;
  testsPage!: TestsPage;
}

setWorldConstructor(CustomWorld);

Before(async function (this: CustomWorld) {
  // Avvia il browser. In un ambiente reale baseURL verrebbe preso da variabili d'ambiente
  this.browser = await chromium.launch({ headless: true });
  this.context = await this.browser.newContext({ baseURL: 'http://localhost:4200' });
  
  // Opzionale: abilita il tracing per il debug in caso di fallimento
  await this.context.tracing.start({ screenshots: true, snapshots: true });
  
  this.page = await this.context.newPage();
  
  // Inizializza i Page Object per renderli disponibili negli step
  this.dashboardPage = new DashboardPage(this.page);
  this.athletesPage = new AthletesPage(this.page);
  this.testsPage = new TestsPage(this.page);
});

After(async function (this: CustomWorld, scenario) {
  // Se il test fallisce, salvia la traccia per il debug
  if (scenario.result?.status === 'FAILED') {
    const tracePath = `e2e/traces/${scenario.pickle.name.replace(/\s+/g, '_')}_trace.zip`;
    await this.context.tracing.stop({ path: tracePath });
  } else {
    await this.context.tracing.stop();
  }

  await this.page?.close();
  await this.context?.close();
  await this.browser?.close();
});
