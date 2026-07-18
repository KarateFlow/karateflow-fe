import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-ui-textarea',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="form-group" [class.full-width]="fullWidth">
      @if (label) {
        <label [for]="id">{{ label }}</label>
      }
      <textarea
        [id]="id"
        [value]="value"
        (input)="onInput($event)"
        (blur)="onTouchedFn()"
        [disabled]="disabled"
        [placeholder]="placeholder"
        [class.invalid]="invalid"
        [rows]="rows"
      ></textarea>
      @if (invalid && errorMessage) {
        <span class="error-msg">{{ errorMessage }}</span>
      }
    </div>
  `,
  styleUrl: './ui-textarea.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiTextareaComponent),
      multi: true
    }
  ]
})
export class UiTextareaComponent implements ControlValueAccessor {
  @Input() id: string = `ui-textarea-${Math.random().toString(36).substring(2, 9)}`;
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() invalid: boolean = false;
  @Input() errorMessage: string = '';
  @Input() fullWidth: boolean = false;
  @Input() rows: number = 4;

  value: any = '';
  disabled: boolean = false;

  onChangeFn: any = () => {};
  onTouchedFn: any = () => {};

  onInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
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
