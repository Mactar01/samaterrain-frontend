import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { FieldService } from '../../../core/services/field.service';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService } from '../../../core/services/admin.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartEvent, ChartType } from 'chart.js';
import Swal from 'sweetalert2';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, BaseChartDirective],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, OnDestroy {
  fields: any[] = [];
  user: any;
  notifications: any[] = [];
  unreadCount = 0;
  activeTab = 'fields';

  newOwner = { name: '', email: '', password: '', password_confirmation: '', phone: '', business_name: '' };
  ownerCreating = false;

  // Admin Data
  stats: any = null;
  ownersList: any[] = [];
  editingOwner: any = null;
  editForm = { name: '', email: '', phone: '', business_name: '' };

  // Owner Dashboard Stats
  ownerStats: any = null;

  // Chart configuration
  public lineChartData: ChartConfiguration['data'] = { datasets: [], labels: [] };
  public lineChartOptions: ChartConfiguration['options'] = { responsive: true, plugins: { legend: { display: false } } };
  public pieChartData: ChartConfiguration['data'] = { datasets: [], labels: [] };
  public pieChartOptions: ChartConfiguration['options'] = { responsive: true };
  public barChartData: ChartConfiguration['data'] = { datasets: [], labels: [] };
  public barChartOptions: ChartConfiguration['options'] = { responsive: true, plugins: { legend: { display: false } } };

  constructor(
    private fieldService: FieldService, 
    private authService: AuthService,
    private adminService: AdminService,
    private http: HttpClient,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.authService.currentUser.subscribe(u => {
      this.user = u;
      if (this.user?.role === 'owner') {
        this.loadOwnerData();
        this.loadOwnerStats();
      } else if (this.user?.role === 'admin') {
        this.loadAdminData();
      }
    });

    this.loadNotifications();
    this.notifInterval = setInterval(() => {
      this.loadNotifications();
    }, 15000);
  }

  setTab(tab: string) { this.activeTab = tab; }

  formatFieldType(type: string): string {
    const types: { [key: string]: string } = {
      'artificial_grass': 'Gazon Synthétique',
      'natural_grass': 'Gazon Naturel',
      'indoor': 'En Salle (Indoor)',
      'clay': 'Terre Battue',
      'concrete': 'Béton / Dur',
      'parquet': 'Parquet'
    };
    return types[type] || type;
  }

  formatPrice(price: any): string {
    if (!price) return '0';
    return price.toString().split('.')[0];
  }

  loadOwnerStats() {
    this.http.get<any>(`${environment.apiUrl}/owner/dashboard`).subscribe({
      next: (data) => {
        this.ownerStats = data;
        
        // Setup Line Chart (Revenue over months)
        if (data.monthly_revenue && data.monthly_revenue.length > 0) {
          // Reverse to show chronological order
          const reversed = [...data.monthly_revenue].reverse();
          this.lineChartData = {
            labels: reversed.map(m => m.month),
            datasets: [{
              data: reversed.map(m => m.revenue),
              label: 'Revenus (FCFA)',
              backgroundColor: 'rgba(34, 197, 94, 0.2)', // green-500 with opacity
              borderColor: 'rgba(34, 197, 94, 1)',
              pointBackgroundColor: 'rgba(34, 197, 94, 1)',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: 'rgba(34, 197, 94, 1)',
              fill: 'origin',
            }]
          };
        }

        // Setup Pie Chart (Revenue by field)
        if (data.revenue_by_field && data.revenue_by_field.length > 0) {
          this.pieChartData = {
            labels: data.revenue_by_field.map((f: any) => f.name),
            datasets: [{
              data: data.revenue_by_field.map((f: any) => f.revenue),
              backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
            }]
          };
        }

        // Setup Bar Chart (Revenue by payment method)
        if (data.revenue_by_method && data.revenue_by_method.length > 0) {
          const methodNames: { [key: string]: string } = {
            'wave': 'Wave',
            'orange_money': 'Orange Money',
            'free_money': 'Free Money',
            'cash': 'Espèces',
            'card': 'Carte'
          };
          this.barChartData = {
            labels: data.revenue_by_method.map((m: any) => methodNames[m.method] || m.method),
            datasets: [{
              data: data.revenue_by_method.map((m: any) => m.total),
              label: 'Revenus (FCFA)',
              backgroundColor: ['#3b82f6', '#f97316', '#22c55e', '#94a3b8', '#8b5cf6']
            }]
          };
        }

        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading stats', err)
    });
  }

  exportToCSV() {
    if (!this.ownerStats) return;
    
    // Create CSV content for Revenue by Method
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "=== RAPPORT FINANCIER MYTERRAIN ===\n\n";
    csvContent += "Moyen de paiement,Revenus (FCFA)\n";
    
    let total = 0;
    if (this.ownerStats.revenue_by_method) {
      this.ownerStats.revenue_by_method.forEach((m: any) => {
        csvContent += `${m.method},${m.total}\n`;
        total += Number(m.total);
      });
    }
    csvContent += `TOTAL,${total}\n\n`;
    
    csvContent += "=== REVENUS PAR TERRAIN ===\n";
    csvContent += "Terrain,Revenus (FCFA)\n";
    if (this.ownerStats.revenue_by_field) {
      this.ownerStats.revenue_by_field.forEach((f: any) => {
        csvContent += `${f.name},${f.revenue}\n`;
      });
    }

    // Download the file
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Export_Comptable_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // --- End of new code, rest remains exactly the same ---
  loadAdminData() {
    this.adminService.getStats().subscribe(res => this.stats = res);
    this.loadOwnersList();
  }

  loadOwnersList() {
    this.adminService.getOwners().subscribe(res => this.ownersList = res);
  }

  loadOwnerData() {
    this.fieldService.getOwnerFields().subscribe({
      next: (data) => {
        this.fields = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  createOwner() {
    this.ownerCreating = true;
    this.adminService.createOwner(this.newOwner).subscribe({
      next: (res) => {
        this.ownerCreating = false;
        this.confirmationService.toast("Loueur créé avec succès !", "success");
        this.newOwner = { name: '', email: '', password: '', password_confirmation: '', phone: '', business_name: '' };
        this.loadOwnersList();
        this.loadAdminData();
      },
      error: (err) => {
        this.ownerCreating = false;
        this.confirmationService.error(err.error?.message || "Erreur lors de la création.");
      }
    });
  }

  startEdit(owner: any) {
    this.editingOwner = owner;
    this.editForm = {
      name: owner.user.name,
      email: owner.user.email,
      phone: owner.user.phone || '',
      business_name: owner.business_name
    };
  }

  cancelEdit() {
    this.editingOwner = null;
  }

  saveEdit() {
    if (!this.editingOwner) return;
    this.adminService.updateOwner(this.editingOwner.id, this.editForm).subscribe({
      next: () => {
        this.editingOwner = null;
        this.confirmationService.toast("Partenaire mis à jour", "success");
        this.loadOwnersList();
      },
      error: (err) => this.confirmationService.error("Erreur lors de la mise à jour.")
    });
  }

  toggleStatus(owner: any) {
    this.adminService.toggleOwnerStatus(owner.id).subscribe(() => {
      this.confirmationService.toast("Statut mis à jour", "success");
      this.loadOwnersList();
    });
  }

  async deleteOwner(owner: any) {
    const confirmed = await this.confirmationService.confirm({
      title: 'Supprimer ce partenaire ?',
      text: `Êtes-vous sûr de vouloir supprimer définitivement le partenaire ${owner.business_name} ?`,
      confirmButtonText: 'Oui, supprimer',
      confirmButtonColor: '#ef4444'
    });

    if (confirmed) {
      this.adminService.deleteOwner(owner.id).subscribe(() => {
        this.confirmationService.toast("Partenaire supprimé", "success");
        this.loadOwnersList();
        this.loadAdminData();
      });
    }
  }

  private notifInterval: any;

  loadNotifications() {
    this.http.get<any>(`${environment.apiUrl}/notifications`).subscribe({
      next: (data) => {
        const newUnreadCount = data.unread_count || 0;
        if (newUnreadCount > this.unreadCount && this.unreadCount !== 0) {
          const latestNotif = data.notifications?.data?.[0];
          if (latestNotif) {
            this.confirmationService.toast("🔔 " + latestNotif.data.message, "info");
          }
        } else if (newUnreadCount > 0 && this.unreadCount === 0) {
            this.confirmationService.toast(`Vous avez ${newUnreadCount} notification(s) non lue(s)`, "info");
        }
        
        this.notifications = data.notifications?.data || [];
        this.unreadCount = newUnreadCount;
      },
      error: (err) => console.error(err)
    });
  }

  ngOnDestroy() {
    if (this.notifInterval) {
      clearInterval(this.notifInterval);
    }
  }

  markAsRead(id: string) {
    this.http.patch(`${environment.apiUrl}/notifications/${id}/read`, {}).subscribe({
      next: () => this.loadNotifications()
    });
  }

  logout() {
    this.authService.logout();
  }

  async editField(field: any) {
    const { value: formValues } = await Swal.fire({
      title: 'Modifier les informations',
      html: `
        <div class="text-left px-1">
          <div class="mb-4 relative">
            <label class="block text-sm font-semibold text-slate-700 mb-1.5">Nom du terrain</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <input id="swal-input1" class="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm outline-none" placeholder="Ex: Terrain Synthétique A" value="${field.name}">
            </div>
          </div>

          <div class="mb-4 relative">
            <label class="block text-sm font-semibold text-slate-700 mb-1.5">Adresse exacte</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <input id="swal-input2" class="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm outline-none" placeholder="Ex: 45 rue de la Paix" value="${field.address || ''}">
            </div>
          </div>

          <div class="mb-5 relative">
            <label class="block text-sm font-semibold text-slate-700 mb-1.5">Prix par heure</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <input id="swal-input3" type="number" class="w-full pl-10 pr-12 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm outline-none" placeholder="10000" value="${field.price_per_hour}">
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span class="text-gray-500 text-sm font-medium">FCFA</span>
              </div>
            </div>
          </div>

          <div class="mt-2">
            <label class="block text-sm font-semibold text-slate-700 mb-2">Photo du terrain <span class="text-xs text-gray-400 font-normal">(Optionnel)</span></label>
            <label for="swal-file" class="relative flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 hover:bg-green-50 hover:border-green-400 transition-colors cursor-pointer group text-center">
              <svg class="mx-auto h-8 w-8 text-gray-400 group-hover:text-green-500 mb-2 transition-colors" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span class="text-sm font-medium text-green-600 group-hover:text-green-700">Sélectionner une photo</span>
              <p id="file-name" class="text-xs text-gray-500 mt-1 truncate max-w-[200px]">PNG, JPG jusqu'à 2MB</p>
              <input id="swal-file" type="file" class="sr-only" accept="image/*" onchange="document.getElementById('file-name').textContent = this.files[0] ? this.files[0].name : 'PNG, JPG jusqu'à 2MB'">
            </label>
          </div>
        </div>
      `,
      customClass: {
        popup: 'rounded-2xl',
        title: 'text-xl text-slate-800 font-bold',
        confirmButton: '!bg-green-600 hover:!bg-green-700 !rounded-xl !px-6 !py-2.5 !font-semibold transition-colors',
        cancelButton: '!bg-slate-100 hover:!bg-slate-200 !text-slate-700 !rounded-xl !px-6 !py-2.5 !font-semibold transition-colors'
      },
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Enregistrer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#16a34a',
      preConfirm: () => {
        const fileInput = document.getElementById('swal-file') as HTMLInputElement;
        const file = fileInput?.files?.[0];
        const data: any = {
          name: (document.getElementById('swal-input1') as HTMLInputElement).value,
          address: (document.getElementById('swal-input2') as HTMLInputElement).value,
          price_per_hour: (document.getElementById('swal-input3') as HTMLInputElement).value
        };
        if (file) {
          data.photo = file;
        }
        return data;
      }
    });

    if (formValues) {
      this.fieldService.updateField(field.id, formValues).subscribe({
        next: () => {
          this.confirmationService.toast("Terrain mis à jour !", "success");
          this.loadOwnerData();
          setTimeout(() => this.cdr.detectChanges(), 100);
        },
        error: () => this.confirmationService.error("Erreur lors de la modification")
      });
    }
  }
}
