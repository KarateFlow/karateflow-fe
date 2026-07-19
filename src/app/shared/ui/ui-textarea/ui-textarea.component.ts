import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-ui-textarea',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass],
  template: `
    <div class="flex flex-col gap-1.5" [class.w-full]="fullWidth">
      @if (label) {
        <label [for]="id" class="font-bold text-text-main text-sm">{{ label }}</label>
      }
      <textarea
        [id]="id"
        [value]="value"
        (input)="onInput($event)"
        (blur)="onTouchedFn()"
        [disabled]="disabled"
        [placeholder]="placeholder"
        [rows]="rows"
        class="w-full p-3 border rounded-xl font-sans text-sm outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        [ngClass]="invalid ? 'border-error text-error placeholder-error focus:ring-error/20 focus:border-error bg-error-bg' : 'border-border text-text-main bg-surface focus:border-primary focus:ring-2 focus:ring-primary/10'"
      ></textarea>
      @if (invalid && errorMessage) {
        <span class="text-xs font-semibold text-error">{{ errorMessage }}</span>
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
  @Input() id = `ui-textarea-${Math.random().toString(36).substring(2, 9)}`;
  @Input() label = '';
  @Input() placeholder = '';
  @Input() invalid = false;
  @Input() errorMessage = '';
  @Input() fullWidth = false;
  @Input() rows = 4;

  value: unknown = '';
  disabled = false;

  onChangeFn: (value: unknown) => void = () => { /* empty */ };
  onTouchedFn: () => void = () => { /* empty */ };

  onInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.value = target.value;
    this.onChangeFn(this.value);
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
