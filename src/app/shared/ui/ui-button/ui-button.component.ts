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
      (click)="onClick.emit($event)"
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
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() loadingText: string = '';
  @Input() fullWidth: boolean = false;
  
  @Output() onClick = new EventEmitter<Event>();
}
