import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Athlete } from '../../data-access/athlete.model';

@Component({
  selector: 'app-athlete-card-list',
  imports: [DatePipe],
  template: `
    <div class="card-grid">
      @for (athlete of athletes(); track athlete.athleteId) {
        <article 
          class="athlete-card" 
          (click)="view.emit(athlete)"
          (keydown.enter)="view.emit(athlete)"
          (keydown.space)="view.emit(athlete)"
          role="button"
          tabindex="0"
        >
          <div class="card-header">
            <div class="profile-placeholder">
              <span class="initials">{{ getInitials(athlete) }}</span>
            </div>
          </div>
          
          <div class="card-body">
            <h3 class="athlete-name">{{ athlete.firstName }} {{ athlete.lastName }}</h3>
            <div class="athlete-info">
              <div class="info-item">
                <span class="label">Nascita:</span>
                <span class="value">{{ athlete.birthDate | date: 'dd/MM/yyyy' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Contatto:</span>
                <span class="value">{{ athlete.referenceContact || 'Non specificato' }}</span>
              </div>
            </div>
          </div>
          
          <div class="card-footer">
            <button class="btn-details">
              Vedi Profilo
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="arrow-icon">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>
        </article>
      } @empty {
        <div class="empty-state">
          <p>Nessun atleta registrato nel sistema.</p>
        </div>
      }
    </div>
  `,
  styles: `
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
      padding: 1rem 0;
    }

    .athlete-card {
      background: var(--color-surface);
      border-radius: var(--radius-xl);
      border: 1px solid #e2e8f0;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .athlete-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.1);
      border-color: var(--color-primary-aka);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .profile-placeholder {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .initials {
      font-weight: 700;
      font-size: 1.25rem;
      color: var(--color-text-muted);
      text-transform: uppercase;
    }

    .status-badge {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 0.25rem 0.5rem;
      border-radius: 20px;
      background: #f1f5f9;
      color: #64748b;
    }

    .status-badge.active {
      background: #dcfce7;
      color: #166534;
    }

    .athlete-name {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--color-text-main);
      margin: 0;
    }

    .athlete-info {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
    }

    .label {
      color: var(--color-text-muted);
    }

    .value {
      font-weight: 500;
      color: var(--color-text-main);
    }

    .card-footer {
      margin-top: auto;
      padding-top: 1rem;
      border-top: 1px solid #f1f5f9;
    }

    .btn-details {
      width: 100%;
      background: transparent;
      border: 1px solid #e2e8f0;
      padding: 0.6rem;
      border-radius: var(--radius-lg);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-text-main);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.2s;
      cursor: pointer;
    }

    .athlete-card:hover .btn-details {
      background: var(--color-primary-aka);
      border-color: var(--color-primary-aka);
      color: white;
    }

    .arrow-icon {
      transition: transform 0.2s;
    }

    .athlete-card:hover .arrow-icon {
      transform: translateX(3px);
    }

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 4rem;
      background: #f8fafc;
      border: 2px dashed #e2e8f0;
      border-radius: var(--radius-xl);
      color: var(--color-text-muted);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AthleteCardListComponent {
  athletes = input.required<Athlete[]>();
  view = output<Athlete>();

  protected getInitials(athlete: Athlete): string {
    return `${athlete.firstName.charAt(0)}${athlete.lastName.charAt(0)}`;
  }
}
