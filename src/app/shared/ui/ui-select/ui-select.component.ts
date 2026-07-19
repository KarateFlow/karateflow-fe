import { Component, forwardRef, Input, EventEmitter, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-ui-select',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="form-group" [class.full-width]="fullWidth">
      @if (label) {
        <label [for]="id">{{ label }}</label>
      }
      <select
        [id]="id"
        [value]="value"
        (change)="onChange($event)"
        (blur)="onTouchedFn()"
        [disabled]="disabled"
        [class.invalid]="invalid"
      >
        <ng-content></ng-content>
      </select>
      @if (invalid && errorMessage) {
        <span class="error-msg">{{ errorMessage }}</span>
      }
    </div>
  `,
  styleUrl: './ui-select.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiSelectComponent),
      multi: true
    }
  ]
})
export class UiSelectComponent implements ControlValueAccessor {
  @Input() id = `ui-select-${Math.random().toString(36).substring(2, 9)}`;
  @Input() label = '';
  @Input() invalid = false;
  @Input() errorMessage = '';
  @Input() fullWidth = false;
  
  @Output() selectionChange = new EventEmitter<Event>();

  value: unknown = '';
  disabled = false;

  onChangeFn: (value: unknown) => void = () => { /* empty */ };
  onTouchedFn: () => void = () => { /* empty */ };

  onChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.value = target.value;
    this.onChangeFn(this.value);
    this.selectionChange.emit(event);
  }

  // ControlValueAccessor methods
  writeValue(value: unknown): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
