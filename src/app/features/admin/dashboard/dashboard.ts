import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import Swal from 'sweetalert2';

import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { formatApiError } from '../../../core/utils/error-formatter';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SkeletonLoaderComponent, EmptyStateComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit {
  stats: any = {
    total_owners: 0,
    total_fields: 0,
    total_players: 0,
    total_reservations: 0
  };
  owners: any[] = [];
  loadingStats = true;
  loadingOwners = true;
  adminName = '';

  // Modals state
  showCreateModal = false;
  showInviteModal = false;

  // 3-dots actions dropdown state
  activeDropdownOwnerId: number | null = null;

  toggleOwnerDropdown(ownerId: number, event: Event) {
    event.stopPropagation();
    if (this.activeDropdownOwnerId === ownerId) {
      this.activeDropdownOwnerId = null;
    } else {
      this.activeDropdownOwnerId = ownerId;
    }
  }

  closeOwnerDropdown() {
    this.activeDropdownOwnerId = null;
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.closeOwnerDropdown();
  }

  // Create Owner Form Model
  newOwner = {
    name: '',
    email: '',
    phone: '',
    business_name: '',
    password: '',
    password_confirmation: '',
    send_email: true,
    send_whatsapp: true
  };
  createError = '';
  isCreating = false;
  showCreatePassword = false;
  createSuccessData: {
    name: string;
    email: string;
    phone: string;
    business_name: string;
    temporary_password: string;
    whatsapp_link: string;
    whatsapp_message: string;
    mailto_link: string;
    login_link: string;
    email_sent: boolean;
  } | null = null;
  createdCredentialsCopied = false;

  // Invite Owner Form Model
  inviteData = {
    email: '',
    business_name: ''
  };
  inviteError = '';
  isInviting = false;
  inviteResult: { invite_link: string; whatsapp_link: string; mailto_link?: string; email?: string } | null = null;
  linkCopied = false;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    this.adminName = user ? user.name : 'Administrateur';
    this.loadStats();
    this.loadOwners();
  }

  loadStats() {
    this.adminService.getStats().subscribe({
      next: (res) => {
        this.stats = res;
        this.loadingStats = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement stats', err);
        this.loadingStats = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadOwners() {
    this.adminService.getOwners().subscribe({
      next: (res) => {
        this.owners = res;
        this.loadingOwners = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement owners', err);
        this.loadingOwners = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleOwnerStatus(owner: any) {
    this.adminService.toggleOwnerStatus(owner.id).subscribe({
      next: (res) => {
        if (owner.user) {
          owner.user.is_active = !owner.user.is_active;
        }
        this.toastService.success(res.message || 'Statut mis à jour avec succès.');
        this.cdr.detectChanges();
      },
      error: () => {
        this.toastService.error('Impossible de modifier le statut.');
      }
    });
  }

  // --- Modal: Ajouter un Loueur ---
  openCreateOwnerModal() {
    this.newOwner = {
      name: '',
      email: '',
      phone: '',
      business_name: '',
      password: '',
      password_confirmation: '',
      send_email: true,
      send_whatsapp: true
    };
    this.createError = '';
    this.isCreating = false;
    this.showCreatePassword = true;
    this.createSuccessData = null;
    this.createdCredentialsCopied = false;
    this.generateTempPassword();
    this.showCreateModal = true;
  }

  closeCreateOwnerModal() {
    this.showCreateModal = false;
    this.createSuccessData = null;
  }

  generateTempPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const numbers = '23456789';
    const specials = '!#@$';
    let res = 'Temp';
    for (let i = 0; i < 2; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
    for (let i = 0; i < 3; i++) res += numbers.charAt(Math.floor(Math.random() * numbers.length));
    res += specials.charAt(Math.floor(Math.random() * specials.length));
    this.newOwner.password = res;
    this.newOwner.password_confirmation = res;
  }

  buildWhatsAppLink(phone: string, name: string, business: string, email: string, password: string): string {
    let cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.length === 9 && ['70', '75', '76', '77', '78', '33'].includes(cleanPhone.substring(0, 2))) {
      cleanPhone = '221' + cleanPhone;
    }
    const loginLink = window.location.origin + '/login';
    const text = `Bonjour ${name},\n\nVotre compte Loueur Partenaire sur myTerrain a bien été créé pour votre complexe *${business}* !\n\nVoici vos identifiants pour vous connecter :\n📧 Email : ${email}\n🔑 Mot de passe temporaire : ${password}\n🌐 Connexion : ${loginLink}\n\n⚠️ Important : Ce mot de passe est temporaire, vous devrez le modifier dès votre première connexion pour accéder à votre espace partenaire.`;
    const encoded = encodeURIComponent(text);
    return cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`;
  }

  buildMailtoLink(email: string, name: string, business: string, password: string): string {
    const loginLink = window.location.origin + '/login';
    const subject = encodeURIComponent(`Vos accès Loueur Partenaire myTerrain (${business})`);
    const body = encodeURIComponent(
      `Bonjour ${name},\n\nVotre compte Loueur Partenaire sur myTerrain a bien été créé pour votre complexe ${business} !\n\nVoici vos identifiants pour vous connecter :\nEmail : ${email}\nMot de passe temporaire : ${password}\nLien de connexion : ${loginLink}\n\nImportant : Ce mot de passe est temporaire, vous devrez le modifier dès votre première connexion pour accéder à votre espace partenaire.\n\nCordialement,\nL'équipe myTerrain`
    );
    return `mailto:${email}?subject=${subject}&body=${body}`;
  }

  copyCreatedCredentials() {
    if (!this.createSuccessData) return;
    const text = `Accès Loueur Partenaire myTerrain\nNom : ${this.createSuccessData.name}\nComplexe : ${this.createSuccessData.business_name}\nEmail : ${this.createSuccessData.email}\nMot de passe temporaire : ${this.createSuccessData.temporary_password}\nLien : ${this.createSuccessData.login_link}\n(Modification de mot de passe obligatoire à la première connexion)`;
    navigator.clipboard.writeText(text).then(() => {
      this.createdCredentialsCopied = true;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.createdCredentialsCopied = false;
        this.cdr.detectChanges();
      }, 3000);
    });
  }

  submitCreateOwner() {
    if (!this.newOwner.name || !this.newOwner.email || !this.newOwner.business_name || !this.newOwner.password) {
      this.createError = 'Veuillez remplir tous les champs obligatoires (*).';
      return;
    }

    if (this.newOwner.password.length < 8) {
      this.createError = 'Le mot de passe doit comporter au moins 8 caractères.';
      return;
    }

    this.newOwner.password_confirmation = this.newOwner.password;
    this.isCreating = true;
    this.createError = '';

    // Déclencher l'ouverture de fenêtre WhatsApp de manière synchrone au clic pour éviter le blocage pop-up du navigateur
    let waWindow: Window | null = null;
    if (this.newOwner.send_whatsapp && this.newOwner.phone) {
      try {
        waWindow = window.open('about:blank', '_blank');
      } catch (e) {
        waWindow = null;
      }
    }

    const payload = {
      name: this.newOwner.name,
      email: this.newOwner.email,
      phone: this.newOwner.phone,
      business_name: this.newOwner.business_name,
      password: this.newOwner.password,
      send_email: this.newOwner.send_email
    };

    this.adminService.createOwner(payload).subscribe({
      next: (res: any) => {
        this.isCreating = false;
        const creds = res.credentials || {};
        const waLink = creds.whatsapp_link || this.buildWhatsAppLink(
          this.newOwner.phone,
          this.newOwner.name,
          this.newOwner.business_name,
          this.newOwner.email,
          this.newOwner.password
        );
        const mailtoLink = this.buildMailtoLink(
          this.newOwner.email,
          this.newOwner.name,
          this.newOwner.business_name,
          this.newOwner.password
        );

        this.createSuccessData = {
          name: this.newOwner.name,
          email: this.newOwner.email,
          phone: this.newOwner.phone,
          business_name: this.newOwner.business_name,
          temporary_password: this.newOwner.password,
          whatsapp_link: waLink,
          whatsapp_message: creds.whatsapp_message || '',
          mailto_link: mailtoLink,
          login_link: creds.login_link || (window.location.origin + '/login'),
          email_sent: creds.email_sent !== false
        };

        this.toastService.success('Le compte loueur a été créé avec succès.');
        this.loadOwners();
        this.loadStats();

        // Mettre à jour l'URL de la fenêtre WhatsApp ouverte
        if (waWindow && waLink) {
          waWindow.location.href = waLink;
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isCreating = false;
        if (waWindow) {
          waWindow.close();
        }
        this.createError = formatApiError(err);
        this.cdr.detectChanges();
      }
    });
  }

  // --- Modal: Inviter un Loueur par Lien ---
  openInviteOwnerModal() {
    this.inviteData = {
      email: '',
      business_name: ''
    };
    this.inviteError = '';
    this.isInviting = false;
    this.inviteResult = null;
    this.linkCopied = false;
    this.showInviteModal = true;
  }

  closeInviteOwnerModal() {
    this.showInviteModal = false;
  }

  submitInviteOwner() {
    this.isInviting = true;
    this.inviteError = '';

    const payload: { email?: string; business_name?: string } = {};
    if (this.inviteData.email?.trim()) {
      payload.email = this.inviteData.email.trim();
    }
    if (this.inviteData.business_name?.trim()) {
      payload.business_name = this.inviteData.business_name.trim();
    }

    this.adminService.inviteOwner(payload).subscribe({
      next: (res) => {
        this.isInviting = false;
        let inviteMailto = '';
        if (payload.email) {
          inviteMailto = `mailto:${encodeURIComponent(payload.email)}?subject=${encodeURIComponent("Invitation à rejoindre myTerrain - Espace Loueur")}&body=${encodeURIComponent(
            `Bonjour,\n\nVous êtes invité à rejoindre la plateforme myTerrain pour gérer vos réservations et vos terrains${payload.business_name ? ' pour "' + payload.business_name + '"' : ''}.\n\nCliquez sur ce lien sécurisé pour finaliser votre inscription :\n${res.invite_link}\n\nCe lien est valable pendant 7 jours.\n\nCordialement,\nL'équipe myTerrain`
          )}`;
        }
        this.inviteResult = {
          invite_link: res.invite_link,
          whatsapp_link: res.whatsapp_link,
          mailto_link: inviteMailto || undefined,
          email: payload.email
        };
        this.toastService.success('Lien d\'invitation généré avec succès !');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isInviting = false;
        this.inviteError = formatApiError(err);
        this.toastService.error(this.inviteError);
        this.cdr.detectChanges();
      }
    });
  }

  copyInviteLink() {
    if (!this.inviteResult?.invite_link) return;
    navigator.clipboard.writeText(this.inviteResult.invite_link).then(() => {
      this.linkCopied = true;
      this.toastService.info('Lien copié dans le presse-papier !');
      setTimeout(() => {
        this.linkCopied = false;
        this.cdr.detectChanges();
      }, 3000);
      this.cdr.detectChanges();
    });
  }

  deleteOwner(ownerId: number) {
    Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: "La suppression d'un loueur est définitive et supprimera également tous ses terrains.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Oui, supprimer !',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.deleteOwner(ownerId).subscribe({
          next: () => {
            this.toastService.success('Le partenaire a été supprimé.');
            this.owners = this.owners.filter(o => o.id !== ownerId);
            this.loadStats();
            this.cdr.detectChanges();
          },
          error: () => {
            this.toastService.error('Impossible de supprimer ce loueur.');
          }
        });
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

}

