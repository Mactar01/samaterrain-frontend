import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
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

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
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
        // Toggle local state
        if (owner.user) {
          owner.user.is_active = !owner.user.is_active;
        }
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: res.message,
          timer: 2000,
          showConfirmButton: false
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        Swal.fire('Erreur', 'Impossible de modifier le statut.', 'error');
      }
    });
  }

  openCreateOwnerModal() {
    Swal.fire({
      title: 'Ajouter un nouveau loueur',
      html: `
        <div class="space-y-4 text-left">
          <div>
            <label class="block text-sm font-medium text-gray-700">Nom Complet</label>
            <input id="swal-name" type="text" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-black focus:border-black" placeholder="Jean Dupont">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Adresse Email</label>
            <input id="swal-email" type="email" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-black focus:border-black" placeholder="jean@example.com">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Téléphone</label>
            <input id="swal-phone" type="text" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-black focus:border-black" placeholder="77 123 45 67">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Nom de l'entreprise / Complexe</label>
            <input id="swal-business" type="text" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-black focus:border-black" placeholder="Complexe Sportif Dakar">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Mot de passe provisoire</label>
            <input id="swal-password" type="password" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-black focus:border-black" placeholder="********">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Créer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#000000',
      cancelButtonColor: '#6b7280',
      preConfirm: () => {
        const name = (document.getElementById('swal-name') as HTMLInputElement).value;
        const email = (document.getElementById('swal-email') as HTMLInputElement).value;
        const phone = (document.getElementById('swal-phone') as HTMLInputElement).value;
        const business_name = (document.getElementById('swal-business') as HTMLInputElement).value;
        const password = (document.getElementById('swal-password') as HTMLInputElement).value;

        if (!name || !email || !business_name || !password) {
          Swal.showValidationMessage('Veuillez remplir tous les champs obligatoires.');
          return false;
        }
        return { name, email, phone, business_name, password, password_confirmation: password };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.createOwner(result.value).subscribe({
          next: (res) => {
            Swal.fire({ icon: 'success', title: 'Succès', text: 'Le compte a été créé.', timer: 2000, showConfirmButton: false });
            this.loadOwners();
            this.loadStats();
          },
          error: (err) => {
            let errorMsg = err.error?.message || 'Erreur lors de la création.';
            if (err.error?.errors) {
              const errors = Object.values(err.error.errors).flat();
              errorMsg = errors.join('<br>');
            }
            Swal.fire({
              title: 'Erreur',
              html: errorMsg,
              icon: 'error'
            });
          }
        });
      }
    });
  }

  openInviteOwnerModal() {
    Swal.fire({
      title: '📧 Inviter un loueur',
      html: `
        <div class="space-y-4 text-left">
          <p class="text-sm text-gray-500">Le loueur recevra un lien unique pour créer son compte.</p>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email du futur loueur *</label>
            <input id="swal-invite-email" type="email" class="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 focus:ring-green-500 focus:border-green-500" placeholder="loueur@exemple.com">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nom du complexe *</label>
            <input id="swal-invite-business" type="text" class="mt-1 block w-full rounded-lg border border-gray-300 p-2.5 focus:ring-green-500 focus:border-green-500" placeholder="Complexe Sportif de Dakar">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Générer le lien',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#6b7280',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        const email = (document.getElementById('swal-invite-email') as HTMLInputElement).value;
        const business_name = (document.getElementById('swal-invite-business') as HTMLInputElement).value;
        if (!email || !business_name) {
          Swal.showValidationMessage('Veuillez remplir l\'email et le nom du complexe.');
          return false;
        }
        return new Promise((resolve, reject) => {
          this.adminService.inviteOwner({ email, business_name }).subscribe({
            next: (res) => resolve(res),
            error: (err) => {
              Swal.showValidationMessage(err.error?.message || 'Erreur lors de la génération.');
              reject();
            }
          });
        });
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const res = result.value as any;
        const inviteLink = res.invite_link;
        const whatsappLink = res.whatsapp_link;
        Swal.fire({
          title: '✅ Lien généré !',
          html: `
            <div class="text-left space-y-4">
              <div class="bg-gray-50 border rounded-lg p-3">
                <p class="text-xs text-gray-500 mb-1">Lien d'invitation (valable 7 jours)</p>
                <p class="text-sm font-mono break-all text-green-700">${inviteLink}</p>
              </div>
              <div class="flex gap-2 justify-center">
                <button onclick="navigator.clipboard.writeText('${inviteLink}').then(() => alert('Lien copié !'))"
                  class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">
                  📋 Copier le lien
                </button>
                <a href="${whatsappLink}" target="_blank"
                  class="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium">
                  💬 Envoyer par WhatsApp
                </a>
              </div>
            </div>
          `,
          confirmButtonText: 'Fermer',
          confirmButtonColor: '#16a34a',
          width: 600
        });
      }
    });
  }

  deleteOwner(ownerId: number) {
    Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: "La suppression d'un loueur est définitive et supprimera ses terrains.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Oui, supprimer !',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.deleteOwner(ownerId).subscribe({
          next: () => {
            Swal.fire('Supprimé!', 'Le loueur a été supprimé.', 'success');
            this.owners = this.owners.filter(o => o.id !== ownerId);
            this.loadStats();
            this.cdr.detectChanges();
          },
          error: () => {
            Swal.fire('Erreur', 'Impossible de supprimer ce loueur.', 'error');
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
