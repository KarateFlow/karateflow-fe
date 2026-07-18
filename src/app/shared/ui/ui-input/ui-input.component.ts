import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-ui-input',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="form-group" [class.full-width]="fullWidth">
      @if (label) {
        <label [for]="id">{{ label }}</label>
      }
      <input
        [id]="id"
        [type]="type"
        [value]="value"
        (input)="onInput($event)"
        (blur)="onTouchedFn()"
        [disabled]="disabled"
        [placeholder]="placeholder"
        [class.invalid]="invalid"
      />
      @if (invalid && errorMessage) {
        <span class="error-msg">{{ errorMessage }}</span>
      }
    </div>
  `,
  styleUrl: './ui-input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiInputComponent),
      multi: true
    }
  ]
})
export class UiInputComponent implements ControlValueAccessor {
  @Input() id: string = `ui-input-${Math.random().toString(36).substring(2, 9)}`;
  @Input() label: string = '';
  @Input() type: 'text' | 'number' | 'password' | 'email' | 'date' | 'datetime-local' | 'time' = 'text';
  @Input() placeholder: string = '';
  @Input() invalid: boolean = false;
  @Input() errorMessage: string = '';
  @Input() fullWidth: boolean = false;

  value: any = '';
  disabled: boolean = false;

  onChangeFn: any = () => {};
  onTouchedFn: any = () => {};

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChangeFn(this.value);
  }

  // ControlValueAccessor methods
  writeValue(value: any): void {
    this.value = value || '';
  }

  registerOnChange(fn: any): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
