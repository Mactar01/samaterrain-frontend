import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FieldService } from '../../../core/services/field.service';
import { ToastService } from '../../../core/services/toast.service';
import { ThemeService } from '../../../core/services/theme.service';
import { Field, TimeSlot } from '../../../core/models/field.model';
import { DarkModeToggleComponent } from '../../../shared/components/dark-mode-toggle/dark-mode-toggle.component';
import { NotificationBellComponent } from '../../../shared/components/notification-bell/notification-bell.component';
import { formatApiError } from '../../../core/utils/error-formatter';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-field-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DarkModeToggleComponent, NotificationBellComponent],
  templateUrl: './field-detail.component.html',
  styleUrls: ['./field-detail.component.scss']
})
export class FieldDetailComponent implements OnInit {
  fieldId!: number;
  field: Field | null = null;
  slots: TimeSlot[] = [];
  isLoading = true;
  selectedImageUrl: string | null = null;

  // Edit State
  showEditModal = false;
  isUpdating = false;
  editForm = {
    name: '',
    type: 'football',
    surface_type: '',
    price_per_hour: 0,
    address: '',
    city: '',
    description: '',
    is_active: true
  };

  get primaryColor(): string {
    return this.themeService.currentBranding().primaryColor || '#16a34a';
  }

  get allImages(): string[] {
    const list: string[] = [];
    if (this.field?.photo_url || this.field?.photo) {
      list.push(this.field.photo_url || this.field.photo!);
    }
    if (this.field?.images && Array.isArray(this.field.images)) {
      this.field.images.forEach(img => {
        if (img.url && !list.includes(img.url)) {
          list.push(img.url);
        }
      });
    }
    return list;
  }

  get activeImage(): string {
    if (this.selectedImageUrl) return this.selectedImageUrl;
    if (this.allImages.length > 0) return this.allImages[0];
    return 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200';
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fieldService: FieldService,
    private toastService: ToastService,
    public themeService: ThemeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.fieldId = +id;
        this.loadField();
      }
    });
  }

  loadField(): void {
    this.isLoading = true;
    this.fieldService.getField(this.fieldId).subscribe({
      next: (res) => {
        this.field = res;
        this.selectedImageUrl = null;
        this.isLoading = false;
        this.loadSlots();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.error(formatApiError(err));
        this.cdr.detectChanges();
      }
    });
  }

  loadSlots(): void {
    const today = new Date().toISOString().split('T')[0];
    this.fieldService.getSlots(this.fieldId, today).subscribe({
      next: (slots) => {
        this.slots = slots || [];
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  selectImage(url: string): void {
    this.selectedImageUrl = url;
  }

  goToSlots(): void {
    this.router.navigate(['/dashboard/fields', this.fieldId, 'slots']);
  }

  openEditModal(): void {
    if (!this.field) return;
    this.editForm = {
      name: this.field.name || '',
      type: this.field.type || 'football',
      surface_type: this.field.surface_type || '',
      price_per_hour: this.field.price_per_hour || this.field.hourly_rate || 0,
      address: this.field.address || '',
      city: this.field.city || '',
      description: this.field.description || '',
      is_active: this.field.is_active !== false
    };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
  }

  saveFieldEdit(): void {
    if (!this.editForm.name.trim()) {
      this.toastService.error('Le nom du terrain est obligatoire.');
      return;
    }

    this.isUpdating = true;
    this.fieldService.updateField(this.fieldId, this.editForm).subscribe({
      next: (updated) => {
        this.isUpdating = false;
        this.toastService.success('Terrain mis à jour avec succès.');
        this.closeEditModal();
        this.loadField();
      },
      error: (err) => {
        this.isUpdating = false;
        this.toastService.error(formatApiError(err));
        this.cdr.detectChanges();
      }
    });
  }

  deleteField(): void {
    if (!this.field) return;
    Swal.fire({
      title: 'Supprimer ce terrain ?',
      text: `Êtes-vous sûr de vouloir supprimer définitivement le terrain "${this.field.name}" et tous ses créneaux associés ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Oui, supprimer définitivement',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.fieldService.deleteField(this.fieldId).subscribe({
          next: () => {
            this.toastService.success('Le terrain a été supprimé.');
            this.router.navigate(['/dashboard/fields']);
          },
          error: (err) => {
            this.toastService.error(formatApiError(err));
          }
        });
      }
    });
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
