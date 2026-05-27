# Folders Structure

Questo documento descrive in dettaglio le decisioni che hanno portato alla definizione della struttura delle cartelle per la piattaforma KarateFlow.

L'architettura proposta si ispira ai principi del **Domain-Driven Design (DDD)** e della **Separazione delle Responsabilità (Separation of Concerns)**, adattati all'ecosistema Angular moderno.

---

## 1. Principi Cardine dell'Architettura

Per garantire che l'applicazione rimanga scalabile, manutenibile e facilmente testabile nel corso tempo, la struttura delle cartelle è stata progettata seguendo tre regole fondamentali:

1. **Isolamento dei Domini (Features):** Le entità di business principali (*Atleti*, *Test*) non devono mescolarsi tra loro. Ogni dominio vive in un ecosistema autonomo e autosufficiente.
2. **Unidirezionalità delle Dipendenze:** I layer inferiori (UI pura, utility) non possono mai dipendere da layer superiori (Business logic, State Management). Il flusso di dipendenza va sempre dall'alto verso il basso o verso l'interno del dominio.
3. **Disaccoppiamento della persistenza dalla presentazione:** I componenti visivi non sanno *come* i dati vengono recuperati o salvati (se via REST API, GraphQL o cache locale); consumano semplicemente flussi di dati forniti dal livello di accesso ai dati.

---

## 2. Mappa della Struttura delle Cartelle

```text
src/
└── app/
    ├── core/                   
    │   ├── auth/               # Servizi di Login, Guards, Interceptors
    │   ├── http/               # Base HTTP service, Error Handling, API Interceptors
    │   ├── cache/              # Layer di caching globale (es. HTTP Cache Interceptor)
    │
    ├── shared/                 # UI riutilizzabile (Dumb Components)
    │   ├── components/         # Bottoni, tabelle, modali, spinner
    │   ├── directives/         # Direttive custom (es. click-outside, permissions)
    │   ├── pipes/              # Formattazione date, valute
    │   └── utils/              # Funzioni helper pure
    │
    ├── layout/                 # Struttura della pagina
    │   ├── header/
    │   ├── sidebar/
    │   └── layout.component.ts # Smart component che unisce header e sidebar
    │
    └── features/               # (o 'domains') I moduli funzionali dell'app
        ├── athletes/           # Dominio: Atleti
        │   ├── data-access/    # Layer Dati: API services, DTOs, State Management
        │   ├── utils/          # Business logic specifica per gli atleti
        │   ├── ui/             # Layer UI: Componenti presentazionali (Dumb)
        │   └── feature/        # Smart Components: Container, routing specifico
        │
        ├── testexecutions/              # Dominio: Test
        │   ├── data-access/
        │   ├── utils/
        │   ├── ui/
        │   └── feature/
        │
        └── dashboard/          # Dominio: Dashboard aggregata
            ├── data-access/
            ├── ui/
            └── feature/
```

## 3. Descrizione Accurata

### 📂 `src/app/core/` (Infrastruttura Globale)
Il livello `core` contiene configurazioni e servizi globali.

* **`auth/`:** Gestisce il ciclo di vita della sicurezza. Include l'`AuthService` per il login/logout, i `Guard` per la protezione delle rotte della dashboard e gli `HttpInterceptor` per allegare automaticamente il token JWT (es. Bearer Token) ad ogni richiesta.
* **`http/`:** Centralizza la configurazione dei client HTTP, la gestione standardizzata degli errori di rete (es. gestione dei codici 401, 403, 500) e gli endpoint base dell'ambiente.
* **`cache/`:** Implementa il layer di caching globale. Attraversal un `HttpCacheInterceptor` o un servizio dedicato, intercetta le richieste GET per evitare chiamate di rete ridondanti su dati che cambiano raramente, migliorando le performance della SPA.

### 📂 `src/app/shared/` (Libreria Componenti "Dumb")
Questa cartella contiene elementi riutilizzabili in tutta l'applicazione, ma rigorosamente **privi di logica di business**.
* I componenti in `shared/components/` (es. tabelle generiche, bottoni personalizzati, modali di conferma, spinner di caricamento) sono definiti **Presentational o "Dumb" Components**. 
* Comunicano esclusivamente tramite `@Input()` (dati in ingresso) e `@Output()` (eventi in uscita). Non iniettano servizi API e non conoscono i concetti di "Atleta" o "Test". Questo isolamento rende la UI agnostica, riutilizzabile e testabile al 100% con unit test grafici.

### 📂 `src/app/layout/` (Infrastruttura Visiva)
Contiene la struttura portante della dashboard (guscio visivo). Scompone la pagina in macro-aree stabili come l'`header/` e la `sidebar/`. Il `layout.component.ts` funge da orchestratore visivo, definendo dove iniettare le varie feature tramite il `router-outlet`.

### 📂 `src/app/features/` (I Domini di Business)
Suddiviso per aree funzionali (`athletes`, `tests`, `dashboard`). Ogni cartella di feature applica internamente la separazione dei livelli:

#### 1. `data-access/` (Layer di Accesso ai Dati)
È lo strato responsabile della gestione dello stato e delle comunicazioni di rete del singolo dominio.
* Contiene i servizi API specifici (es. `athletes-api.service.ts`), le interfacce e i modelli dati (DTO e Domain Models), e la logica di memorizzazione dello stato (tramite *Angular Signals* o *NgRx*).
* **Regola enterprise:** Nessun componente al di fuori di questo layer può effettuare chiamate dirette all'`HttpClient`.

#### 2. `ui/` (Layer Presentazionale di Dominio)
Contiene componenti riutilizzabili solo all'interno di quel determinato dominio. Ad esempio, `athlete-card.component.ts` o `test-row.component.ts`. Sono componenti presentazionali che conoscono il modello dati del dominio, ma non gestiscono azioni asincrone or logiche applicative complessive.

#### 3. `feature/` (Smart Components / Containers)
È il punto di ingresso del modulo, mappato direttamente dal sistema di routing (es. `athletes-list.page.ts`). 
* Questi componenti sono definiti **"Smart Components"** o **Container**: iniettano i servizi dal `data-access/`, orchestrano i dati reattivi, gestiscono l'interazione con l'utente e distribuiscono le informazioni ai componenti del livello `ui/`.

#### 4. `utils/` (Business Logic Pura)
Ospita funzioni helper e logiche di calcolo pure specifiche per il dominio (es. algoritmi per il calcolo della media dei punteggi dei test, formattatori di metriche atletiche). Isolare queste funzioni semplifica enormemente la scrittura di unit test algoritmici liberi da dipendenze Angular.

---

## 3. Vantaggi per la Testabilità e Manutenibilità

L'adozione di questa struttura offre enormi benefici pratici durante il ciclo di vita del software:

* **Mocking Semplificato nei Test:** Poiché la logica visiva (`ui/`) è separata dall'accesso ai dati (`data-access/`), è possibile testare i componenti UI passando semplicemente dati fittizi (*mock*), senza dover configurare complessi sistemi di simulazione delle chiamate HTTP.
* **Isolamento dei Bug:** Se si verifica un errore nel salvataggio di un test atletico, lo sviluppatore sa esattamente che l'origine del problema risiede in `features/tests/data-access/`, riducendo a zero i tempi di ricerca nel codice.

