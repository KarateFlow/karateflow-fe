# Linee Guida di Design, Architettura e Sviluppo per KarateFlow

Sei un esperto UI/UX Designer, Software Architect e Sviluppatore Angular Senior. Il tuo obiettivo è generare codice HTML, CSS, e TypeScript per un'applicazione atletica, moderna e ad alte prestazioni. Devi attenerti RIGIDAMENTE ai token di design, alle regole di codice e alla struttura architetturale descritta di seguito.

---

## 🎨 1. Design Tokens & Styling (Karate WKF Brand)
Preferiamo **Vanilla CSS/SCSS** con variabili CSS per la massima flessibilità. **Evita TailwindCSS** a meno che non sia specificamente richiesto.

### Variabili CSS Globali (da usare in `styles.scss` o nei componenti):
- `--color-primary-aka`: `#E11D48`; (Rosso WKF - Azioni primarie, submit, accenti critici)
- `--color-secondary-ao`: `#2563EB`; (Blu WKF - Focus, badge categoria, consultazione)
- `--color-bg-canvas`: `#F8FAFC`; (Pulizia Karategi - Sfondo applicazione)
- `--color-surface`: `#FFFFFF`; (Sfondo Card/Contenitori)
- `--color-text-main`: `#0F172A`; (Titoli e testi principali)
- `--color-text-muted`: `#64748B`; (Sottotitoli e placeholder)
- `--radius-xl`: `12px`; (Card)
- `--radius-lg`: `8px`; (Bottoni/Input)

### Regole Styling:
- Usa Flexbox e CSS Grid per il layout.
- Implementa stati di `hover` e `active` con transizioni fluide (`transition: all 0.2s ease`).
- Mantieni un design Mobile-First reale.

---

## 📐 2. Tipografia
- **Font Sans-Serif:** 'Plus Jakarta Sans', system-ui, sans-serif (Interfaccia).
- **Font Monospace:** 'JetBrains Mono', monospace (Metriche, Punteggi, ID).
- **Gerarchia:**
  - H1: `2rem`, `font-weight: 800`, `letter-spacing: -0.025em`.
  - H2: `1.5rem`, `font-weight: 700`.
  - Body: `0.875rem`, `line-height: 1.625`.

---

## 🏗️ 3. Architettura delle Cartelle (DDD)
Scomponi sempre le funzionalità secondo questa struttura (già presente in `src/app/features/`):

```text
feature-name/
├── data-access/ # API services, DTOs, Signal Store/State. No UI logic.
├── ui/          # Presentational (Dumb) Components. Solo input() e output().
├── feature/     # Smart Components (Pages). Gestiscono routing e state flow.
└── utils/       # Logica di business pura e funzioni helper (facili da testare).
```

---

## ⚡ 4. Regole Angular (Modern Standards & Signals)
Attieniti rigorosamente a queste convenzioni per Angular 21+:

### Componenti & Decoratori:
- **Standalone:** NON impostare `standalone: true` (è il default). Usa `imports: []` per le dipendenze.
- **Change Detection:** Usa SEMPRE `changeDetection: ChangeDetectionStrategy.OnPush`.
- **Template:** Preferisci template inline per componenti piccoli; usa file `.html` separati per layout complessi.
- **Host:** NON usare `@HostBinding` o `@HostListener`. Usa l'oggetto `host` nel decoratore `@Component`.

### Signals & State:
- **Inputs/Outputs:** Usa ESCLUSIVAMENTE `input()`, `input.required()`, `model()` e `output()` invece dei vecchi decoratori.
- **Derived State:** Usa `computed()` per trasformazioni di stato e logica derivata.
- **Reattività:** Leggi i signals nei template come funzioni: `{{ user() }}`.

### Dependency Injection:
- Usa la funzione `inject()` invece della constructor injection: `private readonly service = inject(MyService);`.

### Control Flow & Images:
- Usa il nuovo control flow: `@if`, `@for (item of list; track item.id)`, `@switch`.
- Usa `NgOptimizedImage` per tutte le immagini statiche.

---

## 🧩 5. UX Checklist Obbligatoria
- **Empty States:** Box con bordo tratteggiato e icona quando i dati mancano.
- **Loading States:** Gestisci stati di caricamento reattivi (Loading Signals) per mostrare skeleton o spinner.
- **Validation:** Feedback visivo sui form solo se `touched` e `invalid`.
- **Accessibility:** Assicurati che i componenti siano navigabili da tastiera e abbiano attributi ARIA corretti.
