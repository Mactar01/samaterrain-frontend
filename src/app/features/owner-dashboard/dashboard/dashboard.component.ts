import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { FieldService } from '../../../core/services/field.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import Swal from 'sweetalert2';
import { environment } from '../../../../environments/environment';
import { Field } from '../../../core/models/field.model';
import { User } from '../../../core/models/user.model';

import { DarkModeToggleComponent } from '../../../shared/components/dark-mode-toggle/dark-mode-toggle.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    BaseChartDirective,
    SkeletonLoaderComponent,
    EmptyStateComponent,
    DarkModeToggleComponent
  ],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, OnDestroy {
  fields: Field[] = [];
  user: User | null = null;
  notifications: any[] = [];
  unreadCount = 0;
  activeTab = 'fields';

  isLoadingFields = true;
  isLoadingStats = true;

  // Owner Dashboard Stats
  ownerStats: any = null;

  // Chart configuration
  public lineChartData: ChartConfiguration['data'] = { datasets: [], labels: [] };
  public lineChartOptions: ChartConfiguration['options'] = { responsive: true, plugins: { legend: { display: false } } };
  public pieChartData: ChartConfiguration['data'] = { datasets: [], labels: [] };
  public pieChartOptions: ChartConfiguration['options'] = { responsive: true };
  public barChartData: ChartConfiguration['data'] = { datasets: [], labels: [] };
  public barChartOptions: ChartConfiguration['options'] = { responsive: true, plugins: { legend: { display: false } } };

  private notifInterval: any;

  constructor(
    private fieldService: FieldService,
    private authService: AuthService,
    private toastService: ToastService,
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
      }
    });

    this.loadNotifications();
    this.notifInterval = setInterval(() => {
      this.loadNotifications();
    }, 20000);
  }

  setTab(tab: string) {
    this.activeTab = tab;
  }

  formatFieldType(type?: string): string {
    if (!type) return 'Standard';
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

  loadOwnerData() {
    this.isLoadingFields = true;
    this.fieldService.getOwnerFields().subscribe({
      next: (data) => {
        this.fields = data || [];
        this.isLoadingFields = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.toastService.error("Impossible de charger vos terrains");
        this.isLoadingFields = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadOwnerStats() {
    this.isLoadingStats = true;
    this.http.get<any>(`${environment.apiUrl}/owner/dashboard`).subscribe({
      next: (data) => {
        this.ownerStats = data;
        this.isLoadingStats = false;

        // Setup Line Chart (Revenue over months)
        if (data.monthly_revenue && data.monthly_revenue.length > 0) {
          const reversed = [...data.monthly_revenue].reverse();
          this.lineChartData = {
            labels: reversed.map(m => m.month),
            datasets: [{
              data: reversed.map(m => m.revenue),
              label: 'Revenus (FCFA)',
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
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
      error: () => {
        this.isLoadingStats = false;
        this.cdr.detectChanges();
      }
    });
  }

  exportToCSV() {
    if (!this.ownerStats) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += '=== RAPPORT FINANCIER MYTERRAIN ===\n\n';
    csvContent += 'Moyen de paiement,Revenus (FCFA)\n';

    let total = 0;
    if (this.ownerStats.revenue_by_method) {
      this.ownerStats.revenue_by_method.forEach((m: any) => {
        csvContent += `${m.method},${m.total}\n`;
        total += Number(m.total);
      });
    }
    csvContent += `TOTAL,${total}\n\n`;

    csvContent += '=== REVENUS PAR TERRAIN ===\n';
    csvContent += 'Terrain,Revenus (FCFA)\n';
    if (this.ownerStats.revenue_by_field) {
      this.ownerStats.revenue_by_field.forEach((f: any) => {
        csvContent += `${f.name},${f.revenue}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Export_Comptable_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toastService.success('Export comptable téléchargé avec succès');
  }

  loadNotifications() {
    this.http.get<any>(`${environment.apiUrl}/notifications`).subscribe({
      next: (data) => {
        const newUnreadCount = data.unread_count || 0;
        if (newUnreadCount > this.unreadCount && this.unreadCount !== 0) {
          const latestNotif = data.notifications?.data?.[0];
          if (latestNotif) {
            this.toastService.info(latestNotif.data.message || 'Nouvelle réservation', 'Nouvelle notification');
          }
        }
        this.notifications = data.notifications?.data || [];
        this.unreadCount = newUnreadCount;
      },
      error: () => {}
    });
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
              <input id="swal-input1" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm outline-none" placeholder="Ex: Terrain Synthétique A" value="${field.name}">
            </div>
          </div>

          <div class="mb-4 relative">
            <label class="block text-sm font-semibold text-slate-700 mb-1.5">Adresse exacte</label>
            <div class="relative">
              <input id="swal-input2" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm outline-none" placeholder="Ex: 45 rue de la Paix" value="${field.address || ''}">
            </div>
          </div>

          <div class="mb-5 relative">
            <label class="block text-sm font-semibold text-slate-700 mb-1.5">Prix par heure</label>
            <div class="relative">
              <input id="swal-input3" type="number" class="w-full pl-3 pr-12 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm outline-none" placeholder="10000" value="${field.price_per_hour}">
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span class="text-gray-500 text-sm font-medium">FCFA</span>
              </div>
            </div>
          </div>

          <div class="mt-2">
            <label class="block text-sm font-semibold text-slate-700 mb-2">Photo du terrain <span class="text-xs text-gray-400 font-normal">(Optionnel)</span></label>
            <label for="swal-file" class="relative flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 hover:bg-green-50 hover:border-green-400 transition-colors cursor-pointer group text-center">
              <span class="text-sm font-medium text-green-600 group-hover:text-green-700">Sélectionner une photo</span>
              <p id="file-name" class="text-xs text-gray-500 mt-1 truncate max-w-[200px]">PNG, JPG jusqu'à 2MB</p>
              <input id="swal-file" type="file" class="sr-only" accept="image/*" onchange="document.getElementById('file-name').textContent = this.files[0] ? this.files[0].name : 'PNG, JPG jusqu\'à 2MB'">
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
          this.toastService.success('Terrain mis à jour !');
          this.loadOwnerData();
        },
        error: () => this.toastService.error('Erreur lors de la modification')
      });
    }
  }

  ngOnDestroy() {
    if (this.notifInterval) {
      clearInterval(this.notifInterval);
    }
  }
}
