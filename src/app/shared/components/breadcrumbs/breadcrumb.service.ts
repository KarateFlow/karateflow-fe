import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

export interface Breadcrumb {
  label: string;
  url?: string;
  action?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  private dynamicLabels = new Map<string, string>();
  private extraCrumbsSignal = signal<Breadcrumb[]>([]);
  labelChanges = signal<number>(0);
  extraCrumbs = this.extraCrumbsSignal.asReadonly();
  routeClicked = new Subject<string>();

  setLabel(key: string, label: string): void {
    if (this.dynamicLabels.get(key) !== label) {
      this.dynamicLabels.set(key, label);
      this.labelChanges.update(v => v + 1);
    }
  }

  getLabel(key: string): string | undefined {
    return this.dynamicLabels.get(key);
  }

  setExtraCrumbs(crumbs: Breadcrumb[]): void {
    this.extraCrumbsSignal.set(crumbs);
  }

  clearExtraCrumbs(): void {
    this.extraCrumbsSignal.set([]);
  }
}
