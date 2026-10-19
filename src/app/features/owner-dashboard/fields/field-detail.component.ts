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
    surface_type: 'artificial_grass',
    location: '',
    capacity: 10,
    price_per_hour: 0,
    city: '',
    address: '',
    description: '',
    is_active: true
  };
  editSelectedFiles: File[] = [];
  editImagePreviews: string[] = [];

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
      surface_type: this.field.surface_type || this.field.type || 'artificial_grass',
      location: this.field.location || '',
      capacity: this.field.capacity || 10,
      price_per_hour: this.field.price_per_hour || this.field.hourly_rate || 0,
      city: this.field.city || '',
      address: this.field.address || '',
      description: this.field.description || '',
      is_active: this.field.is_active !== false
    };
    this.editSelectedFiles = [];
    this.editImagePreviews = [];
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editSelectedFiles = [];
    this.editImagePreviews = [];
  }

  onEditFilesSelected(event: any): void {
    const files: FileList = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        this.editSelectedFiles.push(file);
        const reader = new FileReader();
        reader.onload = (e: any) => this.editImagePreviews.push(e.target.result);
        reader.readAsDataURL(file);
      }
    }
  }

  removeEditPreview(index: number): void {
    this.editSelectedFiles.splice(index, 1);
    this.editImagePreviews.splice(index, 1);
  }

  deleteExistingImage(imageId: number): void {
    if (!imageId) return;
    Swal.fire({
      title: 'Supprimer cette photo ?',
      text: 'Cette photo sera définitivement retirée du terrain.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.fieldService.deleteFieldImage(this.fieldId, imageId).subscribe({
          next: () => {
            this.toastService.success('Photo supprimée.');
            if (this.field && this.field.images) {
              this.field.images = this.field.images.filter(img => img.id !== imageId);
            }
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.toastService.error(formatApiError(err));
          }
        });
      }
    });
  }

  saveFieldEdit(): void {
    if (!this.editForm.name.trim()) {
      this.toastService.error('Le nom du terrain est obligatoire.');
      return;
    }

    this.isUpdating = true;
    const payload: any = {
      ...this.editForm,
      type: this.editForm.surface_type,
      surface_type: this.editForm.surface_type
    };

    if (this.editSelectedFiles.length > 0) {
      payload.photos = this.editSelectedFiles;
      payload.photo = this.editSelectedFiles[0];
    }

    this.fieldService.updateField(this.fieldId, payload).subscribe({
      next: () => {
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

  formatSurface(surface?: string | null): string {
    if (!surface) return '—';
    const s = surface.toLowerCase().trim();
    const map: Record<string, string> = {
      'artificial_grass': 'Pelouse synthétique',
      'natural_grass': 'Gazon naturel',
      'synthetic': 'Pelouse synthétique',
      'synthetique': 'Pelouse synthétique',
      'futsal': 'Futsal (Indoor / Parquet)',
      'indoor': 'Salle (Indoor)',
      'concrete': 'Béton / Goudron',
      'clay': 'Terre battue',
      'parquet': 'Parquet',
      'sand': 'Sable',
      'tartan': 'Tartan',
      'resin': 'Résine',
      'hybrid': 'Hybride',
      'herbe': 'Gazon naturel'
    };
    if (map[s]) return map[s];
    return s.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  getFieldRef(): string {
    if (this.field?.reference) return this.field.reference;
    if (this.field?.id) return 'TER-' + this.field.id.toString().padStart(4, '0');
    return 'TER-0000';
  }

  copyRef(event?: Event): void {
    if (event) event.stopPropagation();
    const ref = this.getFieldRef();
    navigator.clipboard?.writeText(ref).then(() => {
      this.toastService.success(`Référence ${ref} copiée !`);
    }).catch(() => {
      this.toastService.error('Impossible de copier la référence.');
    });
  }

  openMap(): void {
    if (this.field?.latitude && this.field?.longitude) {
      const url = `https://www.google.com/maps?q=${this.field.latitude},${this.field.longitude}`;
      window.open(url, '_blank', 'noopener');
    }
  }
}
