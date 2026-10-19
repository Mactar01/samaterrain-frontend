import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import Swal from 'sweetalert2';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { formatApiError } from '../../../core/utils/error-formatter';

@Component({
  selector: 'app-super-admins',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SkeletonLoaderComponent],
  templateUrl: './super-admins.html',
  styleUrls: ['./super-admins.scss']
})
export class SuperAdminsComponent implements OnInit {
  superAdmins: any[] = [];
  loadingSuperAdmins = true;

  // 3-dots actions dropdown state (horizontal)
  activeDropdownSuperAdminId: number | null = null;

  toggleSuperAdminDropdown(id: number, event: Event) {
    event.stopPropagation();
    this.activeDropdownSuperAdminId = this.activeDropdownSuperAdminId === id ? null : id;
  }

  closeSuperAdminDropdown() {
    this.activeDropdownSuperAdminId = null;
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.closeSuperAdminDropdown();
  }

  // Modal: Create Super Admin
  showCreateSuperAdminModal = false;
  newSuperAdmin = {
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    cni: '',
    adresse: '',
    send_email: true
  };
  createSuperAdminError = '';
  isCreatingSuperAdmin = false;
  showCreateSuperAdminPassword = false;

  // Modal: Edit Super Admin
  showEditSuperAdminModal = false;
  editingSuperAdmin: any = null;
  editSuperAdmin = {
    name: '',
    email: '',
    phone: '',
    cni: '',
    adresse: '',
    new_password: '',
    new_password_confirmation: ''
  };
  editSuperAdminError = '';
  isEditingSuperAdmin = false;
  showEditSuperAdminPassword = false;

  constructor(
    private adminService: AdminService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSuperAdmins();
  }

  loadSuperAdmins() {
    this.loadingSuperAdmins = true;
    this.adminService.getSuperAdmins().subscribe({
      next: (res) => {
        this.superAdmins = res;
        this.loadingSuperAdmins = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement super admins', err);
        this.loadingSuperAdmins = false;
        this.cdr.detectChanges();
      }
    });
  }

  openCreateSuperAdminModal() {
    this.newSuperAdmin = {
      name: '',
      email: '',
      phone: '',
      password: '',
      password_confirmation: '',
      cni: '',
      adresse: '',
      send_email: true
    };
    this.createSuperAdminError = '';
    this.isCreatingSuperAdmin = false;
    this.showCreateSuperAdminPassword = false;
    this.generateSuperAdminPassword();
    this.showCreateSuperAdminModal = true;
  }

  closeCreateSuperAdminModal() {
    this.showCreateSuperAdminModal = false;
  }

  generateSuperAdminPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const numbers = '23456789';
    const specials = '!#@$';
    let res = 'Admin';
    for (let i = 0; i < 2; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
    for (let i = 0; i < 3; i++) res += numbers.charAt(Math.floor(Math.random() * numbers.length));
    res += specials.charAt(Math.floor(Math.random() * specials.length));
    this.newSuperAdmin.password = res;
    this.newSuperAdmin.password_confirmation = res;
  }

  submitCreateSuperAdmin() {
    if (!this.newSuperAdmin.name || !this.newSuperAdmin.email || !this.newSuperAdmin.password) {
      this.createSuperAdminError = 'Veuillez remplir tous les champs obligatoires (*).';
      return;
    }
    if (this.newSuperAdmin.password.length < 8) {
      this.createSuperAdminError = 'Le mot de passe doit comporter au moins 8 caractères.';
      return;
    }
    this.newSuperAdmin.password_confirmation = this.newSuperAdmin.password;
    this.isCreatingSuperAdmin = true;
    this.createSuperAdminError = '';

    const payload = {
      name: this.newSuperAdmin.name,
      email: this.newSuperAdmin.email,
      phone: this.newSuperAdmin.phone,
      password: this.newSuperAdmin.password,
      password_confirmation: this.newSuperAdmin.password_confirmation,
      cni: this.newSuperAdmin.cni,
      adresse: this.newSuperAdmin.adresse,
      send_email: this.newSuperAdmin.send_email
    };

    this.adminService.createSuperAdmin(payload).subscribe({
      next: () => {
        this.isCreatingSuperAdmin = false;
        this.toastService.success('Super administrateur créé avec succès.');
        this.loadSuperAdmins();
        this.closeCreateSuperAdminModal();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isCreatingSuperAdmin = false;
        this.createSuperAdminError = formatApiError(err);
        this.cdr.detectChanges();
      }
    });
  }

  openEditSuperAdminModal(admin: any) {
    this.editingSuperAdmin = admin;
    this.editSuperAdmin = {
      name: admin.name || '',
      email: admin.email || '',
      phone: admin.phone || '',
      cni: admin.cni || '',
      adresse: admin.adresse || '',
      new_password: '',
      new_password_confirmation: ''
    };
    this.editSuperAdminError = '';
    this.isEditingSuperAdmin = false;
    this.showEditSuperAdminPassword = false;
    this.showEditSuperAdminModal = true;
    this.closeSuperAdminDropdown();
  }

  closeEditSuperAdminModal() {
    this.showEditSuperAdminModal = false;
    this.editingSuperAdmin = null;
  }

  submitEditSuperAdmin() {
    if (!this.editSuperAdmin.name || !this.editSuperAdmin.email) {
      this.editSuperAdminError = 'Le nom et l\'email sont obligatoires.';
      return;
    }
    if (this.editSuperAdmin.new_password && this.editSuperAdmin.new_password.length < 8) {
      this.editSuperAdminError = 'Le nouveau mot de passe doit comporter au moins 8 caractères.';
      return;
    }
    if (this.editSuperAdmin.new_password !== this.editSuperAdmin.new_password_confirmation) {
      this.editSuperAdminError = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.isEditingSuperAdmin = true;
    this.editSuperAdminError = '';

    const payload: any = {
      name: this.editSuperAdmin.name,
      email: this.editSuperAdmin.email,
      phone: this.editSuperAdmin.phone,
      cni: this.editSuperAdmin.cni,
      adresse: this.editSuperAdmin.adresse
    };
    if (this.editSuperAdmin.new_password) {
      payload.new_password = this.editSuperAdmin.new_password;
      payload.new_password_confirmation = this.editSuperAdmin.new_password_confirmation;
    }

    this.adminService.updateSuperAdmin(this.editingSuperAdmin.id, payload).subscribe({
      next: () => {
        this.isEditingSuperAdmin = false;
        this.toastService.success('Super administrateur mis à jour avec succès.');
        this.loadSuperAdmins();
        this.closeEditSuperAdminModal();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isEditingSuperAdmin = false;
        this.editSuperAdminError = formatApiError(err);
        this.cdr.detectChanges();
      }
    });
  }

  deleteSuperAdmin(adminId: number) {
    this.closeSuperAdminDropdown();
    Swal.fire({
      title: 'Supprimer ce super admin ?',
      text: 'Cette action est irréversible. Le compte sera définitivement supprimé.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Oui, supprimer !',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.deleteSuperAdmin(adminId).subscribe({
          next: () => {
            this.toastService.success('Super administrateur supprimé.');
            this.superAdmins = this.superAdmins.filter((a) => a.id !== adminId);
            this.cdr.detectChanges();
          },
          error: () => {
            this.toastService.error('Impossible de supprimer ce super administrateur.');
          }
        });
      }
    });
  }

  toggleSuperAdminStatus(admin: any) {
    this.closeSuperAdminDropdown();
    this.adminService.toggleSuperAdminStatus(admin.id).subscribe({
      next: (res) => {
        admin.is_active = !admin.is_active;
        this.toastService.success(res.message || 'Statut mis à jour avec succès.');
        this.cdr.detectChanges();
      },
      error: () => {
        this.toastService.error('Impossible de modifier le statut.');
      }
    });
  }
}
