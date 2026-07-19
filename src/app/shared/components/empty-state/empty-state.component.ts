import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center p-12 text-center h-full min-h-[300px]">
      <div class="text-text-muted mb-4">
        <!-- Default icon if none provided -->
        @if (!iconPath()) {
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        } @else {
          <!-- Render custom icon path using ng-content or safe html/img if needed, or simply standard svg if iconPath is an SVG element string. Actually, we can just use ng-content for the icon to allow SVGs -->
          <ng-content select="[icon]"></ng-content>
        }
      </div>
      <h3 class="text-xl font-bold text-text-main mb-2">{{ title() }}</h3>
      <p class="text-text-muted max-w-md">{{ message() }}</p>
      
      <div class="mt-6">
        <ng-content select="[actions]"></ng-content>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {
  title = input.required<string>();
  message = input.required<string>();
  iconPath = input<string>();
}
