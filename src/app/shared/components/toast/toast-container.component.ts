import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  template: `
    <div class="fixed bottom-5 right-5 z-50 flex flex-col gap-3 pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div 
          class="toast-card pointer-events-auto flex items-center justify-between p-4 shadow-lg"
          [class.toast-success]="toast.type === 'success'"
          [class.toast-error]="toast.type === 'error'"
          [class.toast-warning]="toast.type === 'warning'"
          [class.toast-info]="toast.type === 'info'"
          role="alert"
        >
          <div class="flex items-center gap-3">
            @if (toast.type === 'success') {
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>
            } @else if (toast.type === 'error') {
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            } @else if (toast.type === 'warning') {
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            } @else {
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            }
            <span class="font-medium text-sm">{{ toast.message }}</span>
          </div>
          <button (click)="toastService.remove(toast.id)" class="ml-4 opacity-70 hover:opacity-100 transition-opacity" aria-label="Chiudi">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-card {
      border-radius: var(--radius-xl);
      min-width: 300px;
      max-width: 400px;
      animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      border: 1px solid transparent;
    }

    .toast-success {
      background-color: var(--color-success-bg);
      color: var(--color-success);
      border-color: var(--color-success);
    }

    .toast-error {
      background-color: var(--color-error-bg);
      color: var(--color-error);
      border-color: var(--color-error);
    }

    .toast-warning {
      background-color: #fef3c7;
      color: #92400e;
      border-color: #fcd34d;
    }
    
    :host-context(.dark) .toast-warning {
      background-color: rgba(146, 64, 14, 0.2);
      border-color: rgba(252, 211, 77, 0.3);
      color: #fcd34d;
    }

    .toast-info {
      background-color: #e0f2fe;
      color: #0369a1;
      border-color: #7dd3fc;
    }

    :host-context(.dark) .toast-info {
      background-color: rgba(3, 105, 161, 0.2);
      border-color: rgba(125, 211, 252, 0.3);
      color: #7dd3fc;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(100%) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
    }
  `]
})
export class ToastContainerComponent {
  public toastService = inject(ToastService);
}
