import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (isOpen()) {
      <div 
        class="modal-backdrop" 
        (click)="onCancel()" 
        (keydown.escape)="onCancel()"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
      >
        <div class="modal-container" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()" role="document" tabindex="0">
          <header class="modal-header">
            <h2>{{ title() }}</h2>
          </header>
          
          <div class="modal-body">
            <p>{{ message() }}</p>
          </div>
          
          <footer class="modal-footer">
            <button class="btn-secondary" (click)="onCancel()">
              {{ cancelText() }}
            </button>
            <button class="btn-confirm" (click)="onConfirm()">
              {{ confirmText() }}
            </button>
          </footer>
        </div>
      </div>
    }
  `,
  styles: `
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: oklch(0 0 0 / 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .modal-container {
      background: var(--color-surface);
      border-radius: var(--radius-xl);
      width: 90%;
      max-width: 400px;
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--color-border);
      overflow: hidden;
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-header {
      padding: 1.5rem 1.5rem 1rem;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-text-main);
    }

    .modal-body {
      padding: 0 1.5rem 1.5rem;
    }

    .modal-body p {
      margin: 0;
      color: var(--color-text-muted);
      line-height: 1.5;
    }

    .modal-footer {
      padding: 1rem 1.5rem 1.5rem;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      background: var(--color-bg-canvas);
    }

    .btn-secondary {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      color: var(--color-text-main);
      padding: 0.5rem 1.25rem;
      border-radius: var(--radius-md);
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      outline: none;
    }

    .btn-secondary:focus-visible {
      box-shadow: var(--shadow-focus);
    }

    .btn-secondary:hover {
      background: var(--color-surface-hover);
    }

    .btn-confirm {
      background: var(--color-primary-aka);
      color: white;
      border: 1px solid transparent;
      padding: 0.5rem 1.25rem;
      border-radius: var(--radius-md);
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      outline: none;
    }

    .btn-confirm:focus-visible {
      box-shadow: var(--shadow-focus);
    }

    .btn-confirm:hover {
      background: var(--color-primary-aka-hover);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  isOpen = input<boolean>(false);
  title = input<string>('Conferma');
  message = input<string>('Sei sicuro di voler procedere?');
  confirmText = input<string>('Conferma');
  cancelText = input<string>('Annulla');

  confirmed = output<void>();
  cancelled = output<void>();

  protected onConfirm(): void {
    this.confirmed.emit();
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }
}
