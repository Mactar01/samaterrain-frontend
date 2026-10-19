import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
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

  /** 3-dots action dropdown state */
  activeDropdownFieldId: number | null = null;

  /** Edit Modal State (aligned with creation) */
  showEditModal = false;
  isUpdating = false;
  editingField: Field | null = null;
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

  /** Filter pills shown in the toolbar (kept for reference) */
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
        (f.location && f.location.toLowerCase().includes(term)) ||
        (f.reference && f.reference.toLowerCase().includes(term)) ||
        (f.surface_type && f.surface_type.toLowerCase().includes(term));

      const matchType = this.selectedType === 'all' || (f.type && f.type.toLowerCase() === this.selectedType);
      return matchSearch && matchType;
    });
  }

  goToField(field: Field, event?: Event): void {
    if (event) event.stopPropagation();
    this.router.navigate(['/dashboard/fields', field.id]);
  }

  goToSlots(field: Field, event?: Event): void {
    if (event) event.stopPropagation();
    this.closeActionDropdown();
    this.router.navigate(['/dashboard/fields', field.id, 'slots']);
  }

  toggleActionDropdown(fieldId: number, event: Event): void {
    event.stopPropagation();
    if (this.activeDropdownFieldId === fieldId) {
      this.activeDropdownFieldId = null;
    } else {
      this.activeDropdownFieldId = fieldId;
    }
  }

  closeActionDropdown(): void {
    this.activeDropdownFieldId = null;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeActionDropdown();
  }

  openEditModal(field: Field, event?: Event): void {
    if (event) event.stopPropagation();
    this.closeActionDropdown();
    this.editingField = field;
    this.editForm = {
      name: field.name || '',
      surface_type: field.surface_type || field.type || 'artificial_grass',
      location: field.location || '',
      capacity: field.capacity || 10,
      price_per_hour: field.price_per_hour || field.hourly_rate || 0,
      city: field.city || '',
      address: field.address || '',
      description: field.description || '',
      is_active: field.is_active !== false
    };
    this.editSelectedFiles = [];
    this.editImagePreviews = [];
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingField = null;
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
    if (!this.editingField || !imageId) return;
    Swal.fire({
      title: 'Supprimer cette photo ?',
      text: 'Cette photo sera retirée du terrain.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed && this.editingField) {
        this.fieldService.deleteFieldImage(this.editingField.id, imageId).subscribe({
          next: () => {
            this.toastService.success('Photo supprimée.');
            if (this.editingField && this.editingField.images) {
              this.editingField.images = this.editingField.images.filter(img => img.id !== imageId);
            }
            this.loadFields();
          },
          error: (err) => {
            this.toastService.error(formatApiError(err));
          }
        });
      }
    });
  }

  saveFieldEdit(): void {
    if (!this.editingField) return;
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

    this.fieldService.updateField(this.editingField.id, payload).subscribe({
      next: () => {
        this.isUpdating = false;
        this.toastService.success('Terrain mis à jour avec succès.');
        this.closeEditModal();
        this.loadFields();
      },
      error: (err) => {
        this.isUpdating = false;
        this.toastService.error(formatApiError(err));
        this.cdr.detectChanges();
      }
    });
  }

  deleteField(field: Field, event?: Event): void {
    if (event) event.stopPropagation();
    this.closeActionDropdown();
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
    if (field.images && field.images.length > 0) {
      const primary = field.images.find(img => img.is_primary);
      const first = primary || field.images[0];
      if (first?.url) return first.url;
    }
    return field.photo_url || field.photo || field.image_url || PLACEHOLDER_IMG;
  }

  /** Returns the field's unique code terrain */
  getFieldRef(field: Field): string {
    if (field.reference) return field.reference;
    return 'TER-' + field.id.toString().padStart(4, '0');
  }

  /** Format clean surface name */
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

  /** Fallback if image fails to load */
  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && img.src !== PLACEHOLDER_IMG) {
      img.src = PLACEHOLDER_IMG;
    }
  }
}

