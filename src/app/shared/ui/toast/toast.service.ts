import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  public readonly toasts = this._toasts.asReadonly();

  show(type: ToastType, message: string, duration = 3000): void {
    // Generate a simple unique ID
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, type, message, duration };
    
    this._toasts.update(toasts => [...toasts, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  success(message: string, duration = 3000): void {
    this.show('success', message, duration);
  }

  error(message: string, duration = 4000): void {
    this.show('error', message, duration);
  }

  warning(message: string, duration = 4000): void {
    this.show('warning', message, duration);
  }

  info(message: string, duration = 3000): void {
    this.show('info', message, duration);
  }

  remove(id: string): void {
    this._toasts.update(toasts => toasts.filter(t => t.id !== id));
  }
}
