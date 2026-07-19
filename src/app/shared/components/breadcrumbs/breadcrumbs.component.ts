import { Component, inject, computed } from '@angular/core';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { Breadcrumb, BreadcrumbService } from './breadcrumb.service';

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <nav aria-label="Breadcrumb" class="mb-4 flex px-4 md:px-0 w-full overflow-hidden">
      <ol class="flex flex-wrap items-center gap-y-2 space-x-2 text-sm text-text-muted">
        @for (crumb of breadcrumbs(); track $index; let last = $last) {
          <li class="flex items-center">
            @if (!last) {
              @if (crumb.url) {
                <a [routerLink]="crumb.url" (click)="onCrumbClick($event, crumb)" class="hover:text-primary-aka transition-colors focus-ring rounded-sm outline-none">{{ crumb.label }}</a>
              } @else if (crumb.action) {
                <a href="javascript:void(0)" (click)="onCrumbClick($event, crumb)" class="hover:text-primary-aka transition-colors focus-ring rounded-sm outline-none">{{ crumb.label }}</a>
              } @else {
                <span class="text-text-muted">{{ crumb.label }}</span>
              }
              <svg aria-hidden="true" class="w-4 h-4 mx-2 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            } @else {
              <span class="text-text-main font-medium" aria-current="page">{{ crumb.label }}</span>
            }
          </li>
        }
      </ol>
    </nav>
  `
})
export class BreadcrumbsComponent {
  private router = inject(Router);
  private breadcrumbService = inject(BreadcrumbService);

  private navEnd = toSignal(
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)),
    { initialValue: null }
  );

  breadcrumbs = computed(() => {
    this.navEnd(); // Trigger re-evaluation on navigation
    this.breadcrumbService.labelChanges(); // Trigger re-evaluation on dynamic label updates
    const base = this.buildBreadcrumbs(this.router.url);
    const extra = this.breadcrumbService.extraCrumbs();
    return [...base, ...extra];
  });

  private routeLabels: Record<string, string> = {
    'athletes': 'Atleti',
    'new': 'Nuovo',
    'edit': 'Modifica',
    'tests': 'Test',
    'templates': 'Templates'
  };

  onCrumbClick(event: Event, crumb: Breadcrumb) {
    if (crumb.action) {
      event.preventDefault();
      crumb.action();
    }
    if (crumb.url) {
      this.breadcrumbService.routeClicked.next(crumb.url);
    }
  }

  private buildBreadcrumbs(url: string): Breadcrumb[] {
    const segments = url.split('?')[0].split('/').filter(segment => segment);
    const crumbs: Breadcrumb[] = [{ label: 'Home', url: '/' }];
    
    let currentUrl = '';
    
    for (const segment of segments) {
      if (segment === 'list') continue; 

      currentUrl += `/${segment}`;
      
      let label = this.routeLabels[segment];
      if (!label) {
        const dynamicLabel = this.breadcrumbService.getLabel(segment);
        if (dynamicLabel) {
          label = dynamicLabel;
        } else {
          label = segment.charAt(0).toUpperCase() + segment.slice(1);
        }
      }
      
      crumbs.push({ label, url: currentUrl });
    }
    
    return crumbs;
  }
}

