import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-ui-button',
  standalone: true,
  template: `
    <button 
      [type]="type"
      [disabled]="disabled || loading"
      [class]="'btn-' + variant"
      [class.full-width]="fullWidth"
      (click)="btnClick.emit($event)"
    >
      @if (loading) {
        <span class="spinner"></span>
        {{ loadingText || 'Caricamento...' }}
      } @else {
        <ng-content></ng-content>
      }
    </button>
  `,
  styleUrl: './ui-button.component.scss'
})
export class UiButtonComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() variant: 'primary' | 'secondary' | 'danger' | 'outline' = 'primary';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() loadingText = '';
  @Input() fullWidth = false;
  
  @Output() btnClick = new EventEmitter<Event>();
}
