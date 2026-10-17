import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { formatApiError } from '../../../core/utils/error-formatter';
import Swal from 'sweetalert2';

interface PlatformRoleItem {
  id: number;
  name: string;
  key: string;
  description: string | null;
  permissions: string[];
  is_system: boolean;
  created_at?: string;
}

interface AvailablePermission {
  key: string;
  label: string;
  description: string;
  group: string;
}

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './roles.html',
  styleUrls: ['./roles.scss']
})
export class AdminRolesComponent implements OnInit {
  roles: PlatformRoleItem[] = [];
  availablePermissions: AvailablePermission[] = [];
  isLoading = true;

  // Modal State
  showModal = false;
  isEditing = false;
  editingRoleId: number | null = null;
  isSaving = false;
  modalError = '';

  // Form Model
  formRole = {
    name: '',
    key: '',
    description: '',
    permissions: [] as string[]
  };

  constructor(
    private adminService: AdminService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.isLoading = true;
    this.adminService.getPlatformRoles().subscribe({
      next: (res) => {
        this.roles = res.roles || [];
        this.availablePermissions = res.available_permissions || [];
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

  openCreateModal(): void {
    this.isEditing = false;
    this.editingRoleId = null;
    this.modalError = '';
    this.formRole = {
      name: '',
      key: '',
      description: '',
      permissions: []
    };
    this.showModal = true;
  }

  openEditModal(role: PlatformRoleItem): void {
    this.isEditing = true;
    this.editingRoleId = role.id;
    this.modalError = '';
    this.formRole = {
      name: role.name,
      key: role.key,
      description: role.description || '',
      permissions: [...(role.permissions || [])]
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.modalError = '';
  }

  onNameChange(): void {
    if (!this.isEditing) {
      // Auto-generate key from name
      this.formRole.key = this.formRole.name
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    }
  }

  togglePermission(permKey: string): void {
    const idx = this.formRole.permissions.indexOf(permKey);
    if (idx > -1) {
      this.formRole.permissions.splice(idx, 1);
    } else {
      this.formRole.permissions.push(permKey);
    }
  }

  hasPermission(permKey: string): boolean {
    return this.formRole.permissions.includes(permKey);
  }

  selectAllPermissions(): void {
    this.formRole.permissions = this.availablePermissions.map(p => p.key);
  }

  deselectAllPermissions(): void {
    this.formRole.permissions = [];
  }

  saveRole(): void {
    if (!this.formRole.name.trim()) {
      this.modalError = 'Le nom du rôle est obligatoire.';
      return;
    }
    if (this.formRole.permissions.length === 0) {
      this.modalError = 'Veuillez sélectionner au moins un droit d\'accès pour ce rôle.';
      return;
    }

    this.isSaving = true;
    this.modalError = '';

    const payload = {
      name: this.formRole.name.trim(),
      key: this.formRole.key.trim() || undefined,
      description: this.formRole.description.trim() || null,
      permissions: this.formRole.permissions
    };

    if (this.isEditing && this.editingRoleId) {
      this.adminService.updatePlatformRole(this.editingRoleId, payload).subscribe({
        next: (res) => {
          this.isSaving = false;
          this.toastService.success(res.message || 'Rôle mis à jour avec succès.');
          this.closeModal();
          this.loadRoles();
        },
        error: (err) => {
          this.isSaving = false;
          this.modalError = formatApiError(err);
          this.cdr.detectChanges();
        }
      });
    } else {
      this.adminService.createPlatformRole(payload).subscribe({
        next: (res) => {
          this.isSaving = false;
          this.toastService.success(res.message || 'Rôle créé avec succès.');
          this.closeModal();
          this.loadRoles();
        },
        error: (err) => {
          this.isSaving = false;
          this.modalError = formatApiError(err);
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteRole(role: PlatformRoleItem): void {
    if (role.is_system) {
      this.toastService.warning('Les rôles système fondamentaux ne peuvent pas être supprimés.');
      return;
    }

    Swal.fire({
      title: 'Supprimer ce rôle ?',
      text: `Êtes-vous sûr de vouloir supprimer définitivement le rôle "${role.name}" de la plateforme ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.deletePlatformRole(role.id).subscribe({
          next: (res) => {
            this.toastService.success(res.message || 'Rôle supprimé.');
            this.roles = this.roles.filter(r => r.id !== role.id);
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.toastService.error(formatApiError(err));
          }
        });
      }
    });
  }

  getPermissionLabel(key: string): string {
    const p = this.availablePermissions.find(x => x.key === key);
    return p ? p.label : key;
  }
}
