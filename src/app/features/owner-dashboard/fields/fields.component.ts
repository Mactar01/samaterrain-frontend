import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FieldService } from '../../../core/services/field.service';
import { ToastService } from '../../../core/services/toast.service';
import { ThemeService } from '../../../core/services/theme.service';
import { Field } from '../../../core/models/field.model';
import { DarkModeToggleComponent } from '../../../shared/components/dark-mode-toggle/dark-mode-toggle.component';
import { NotificationBellComponent } from '../../../shared/components/notification-bell/notification-bell.component';
import { formatApiError } from '../../../core/utils/error-formatter';
import Swal from 'sweetalert2';

/** Fallback image used when a field has no photo */
const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=400';

@Component({
  selector: 'app-fields',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DarkModeToggleComponent, NotificationBellComponent],
  templateUrl: './fields.component.html',
  styleUrls: ['./fields.component.scss']
})
export class FieldsComponent implements OnInit {
  fields: Field[] = [];
  filteredFields: Field[] = [];
  isLoading = true;
  searchTerm = '';
  selectedType = 'all';

  /** Filter pills shown in the toolbar */
  readonly typeFilters = [
    { value: 'football',   label: '⚽ Football' },
    { value: 'basketball', label: '🏀 Basketball' },
    { value: 'padel',      label: '🏓 Padel' },
    { value: 'tennis',     label: '🎾 Tennis' },
    { value: 'volleyball', label: '🏐 Volleyball' },
    { value: 'autre',      label: '🏟️ Multisport' },
  ];

  get primaryColor(): string {
    return this.themeService.currentBranding().primaryColor || '#16a34a';
  }

  constructor(
    private fieldService: FieldService,
    private toastService: ToastService,
    private router: Router,
    public themeService: ThemeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadFields();
  }

  loadFields(): void {
    this.isLoading = true;
    this.fieldService.getOwnerFields().subscribe({
      next: (res) => {
        this.fields = res || [];
        this.filterFields();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.error(formatApiError(err));
        this.cdr.detectChanges();
      }
    });
  }

  filterFields(): void {
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredFields = this.fields.filter(f => {
      const matchSearch = !term ||
        f.name.toLowerCase().includes(term) ||
        (f.address && f.address.toLowerCase().includes(term)) ||
        (f.city && f.city.toLowerCase().includes(term)) ||
        (f.surface_type && f.surface_type.toLowerCase().includes(term));

      const matchType = this.selectedType === 'all' || (f.type && f.type.toLowerCase() === this.selectedType);
      return matchSearch && matchType;
    });
  }

  goToField(field: Field, event?: Event): void {
    if (event) event.stopPropagation();
    this.router.navigate(['/dashboard/fields', field.id]);
  }

  goToSlots(field: Field, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/dashboard/fields', field.id, 'slots']);
  }

  /** Open Google Maps with field GPS coordinates */
  openMap(field: Field, event: Event): void {
    event.stopPropagation();
    if (field.latitude && field.longitude) {
      const url = `https://www.google.com/maps?q=${field.latitude},${field.longitude}`;
      window.open(url, '_blank', 'noopener');
    }
  }

  deleteField(field: Field, event: Event): void {
    event.stopPropagation();
    Swal.fire({
      title: 'Supprimer ce terrain ?',
      text: `Êtes-vous sûr de vouloir supprimer le terrain "${field.name}" ainsi que tous ses créneaux associés ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.fieldService.deleteField(field.id).subscribe({
          next: () => {
            this.toastService.success('Terrain supprimé.');
            this.fields = this.fields.filter(f => f.id !== field.id);
            this.filterFields();
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.toastService.error(formatApiError(err));
          }
        });
      }
    });
  }

  getFieldImage(field: Field): string {
    // Primary image from images array
    if (field.images && field.images.length > 0) {
      const primary = field.images.find(img => img.is_primary);
      const first = primary || field.images[0];
      if (first?.url) return first.url;
    }
    return field.photo_url || field.photo || field.image_url || PLACEHOLDER_IMG;
  }

  /** Returns the field's unique reference code.
   *  Uses the backend `reference` field if available,
   *  otherwise generates a formatted code from the numeric id. */
  getFieldRef(field: Field): string {
    if (field.reference) return field.reference;
    return 'TER-' + field.id.toString().padStart(4, '0');
  }

  /** Copy reference to clipboard */
  copyRef(field: Field, event: Event): void {
    event.stopPropagation();
    const ref = this.getFieldRef(field);
    navigator.clipboard?.writeText(ref).then(() => {
      this.toastService.success(`Référence ${ref} copiée !`);
    }).catch(() => {
      this.toastService.error('Impossible de copier la référence.');
    });
  }

  /** Fallback if image fails to load */
  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && img.src !== PLACEHOLDER_IMG) {
      img.src = PLACEHOLDER_IMG;
    }
  }

  /** Human-readable label for field type */
  getTypeLabel(type?: string): string {
    const map: Record<string, string> = {
      football:   'Football',
      basketball: 'Basketball',
      tennis:     'Tennis',
      padel:      'Padel',
      volleyball: 'Volleyball',
      autre:      'Multisport'
    };
    return (type && map[type.toLowerCase()]) || type || 'Terrain';
  }

  /** Tailwind classes for sport badge color */
  getTypeBadgeClass(type?: string): string {
    const map: Record<string, string> = {
      football:   'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
      basketball: 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300',
      tennis:     'bg-yellow-100 dark:bg-yellow-950/60 text-yellow-700 dark:text-yellow-300',
      padel:      'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300',
      volleyball: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300',
      autre:      'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
    };
    return (type && map[type.toLowerCase()]) || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
  }
}
