import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="not-found-container">
      <div class="content">
        <h1>404</h1>
        <h2>Oops! La pagina che cerchi non esiste.</h2>
        <p>Il percorso è libero, ma questa stanza è vuota. Forse la strada che cerchi è da un'altra parte...</p>
        <div class="actions">
          <a routerLink="/" class="btn-primary">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Torna alla Dashboard
          </a>
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 120px);
      padding: 2rem;
    }

    .not-found-container {
      background: var(--color-surface);
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      max-width: 600px;
      width: 100%;
      display: flex;
      flex-direction: column;
    }

    .content {
      padding: 2.5rem 2rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    h1 {
      font-size: 4rem;
      font-weight: 900;
      line-height: 1;
      margin: 0;
      color: var(--color-primary);
      text-shadow: 2px 2px 0px rgba(37, 99, 235, 0.1);
    }

    h2 {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0;
      color: var(--color-text-main);
    }

    p {
      color: var(--color-text-muted);
      font-size: 1.125rem;
      line-height: 1.6;
      max-width: 450px;
      margin: 0;
    }

    .actions {
      margin-top: 1.5rem;
    }

    .btn-primary {
      background-color: var(--color-primary);
      color: white;
      text-decoration: none;
      font-weight: 700;
      padding: 0.875rem 1.5rem;
      border-radius: var(--radius-xl);
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
      filter: brightness(1.1);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotFoundPageComponent {
}
