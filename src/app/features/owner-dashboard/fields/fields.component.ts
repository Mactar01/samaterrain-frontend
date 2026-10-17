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
    return field.photo_url || field.photo || field.image_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800';
  }

  getTypeLabel(type?: string): string {
    const map: Record<string, string> = {
      football: 'Football',
      basketball: 'Basketball',
      tennis: 'Tennis',
      padel: 'Padel',
      volleyball: 'Volleyball',
      autre: 'Multisport'
    };
    return (type && map[type.toLowerCase()]) || type || 'Terrain';
  }
}
