import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReservationService } from '../../../core/services/reservation.service';
import { ToastService } from '../../../core/services/toast.service';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { Reservation } from '../../../core/models/reservation.model';

import { DarkModeToggleComponent } from '../../../shared/components/dark-mode-toggle/dark-mode-toggle.component';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SkeletonLoaderComponent, EmptyStateComponent, DarkModeToggleComponent],
  providers: [DatePipe],
  templateUrl: './reservations.component.html'
})
export class ReservationsComponent implements OnInit {
  private reservationService = inject(ReservationService);
  private toastService = inject(ToastService);

  reservations: Reservation[] = [];
  filteredReservations: Reservation[] = [];
  loading = true;

  searchTerm = '';
  selectedStatus: 'all' | 'confirmed' | 'pending' | 'cancelled' = 'all';

  activeDropdownReservationId: number | null = null;

  toggleReservationDropdown(resId: number, event: Event) {
    event.stopPropagation();
    if (this.activeDropdownReservationId === resId) {
      this.activeDropdownReservationId = null;
    } else {
      this.activeDropdownReservationId = resId;
    }
  }

  closeReservationDropdown() {
    this.activeDropdownReservationId = null;
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.closeReservationDropdown();
  }

  ngOnInit() {
    this.loadReservations();
  }

  loadReservations() {
    this.loading = true;
    this.reservationService.getOwnerReservations().subscribe({
      next: (res: any) => {
        this.reservations = res.data || res || [];
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.toastService.error('Impossible de charger les réservations');
        this.loading = false;
      }
    });
  }

  // Dynamic status counters
  get countAll(): number {
    return this.reservations.length;
  }

  get countConfirmed(): number {
    return this.reservations.filter(r => {
      const s = (r.status || '').toLowerCase().trim();
      return s === 'confirmed' || s === 'completed';
    }).length;
  }

  get countPending(): number {
    return this.reservations.filter(r => (r.status || '').toLowerCase().trim() === 'pending').length;
  }

  get countCancelled(): number {
    return this.reservations.filter(r => {
      const s = (r.status || '').toLowerCase().trim();
      return s === 'cancelled' || s === 'canceled';
    }).length;
  }

  setStatusFilter(status: 'all' | 'confirmed' | 'pending' | 'cancelled') {
    this.selectedStatus = status;
    this.applyFilters();
  }

  applyFilters() {
    let result = [...this.reservations];

    // Status filter
    if (this.selectedStatus !== 'all') {
      result = result.filter(r => {
        const s = (r.status || '').toLowerCase().trim();
        if (this.selectedStatus === 'confirmed') {
          return s === 'confirmed' || s === 'completed';
        }
        if (this.selectedStatus === 'pending') {
          return s === 'pending';
        }
        if (this.selectedStatus === 'cancelled') {
          return s === 'cancelled' || s === 'canceled';
        }
        return s === this.selectedStatus;
      });
    }

    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(r => {
        const playerName = (r.player_name || (r as any).guest_name || r.user?.name || '').toLowerCase();
        const playerPhone = (r.player_phone || (r as any).guest_phone || r.user?.phone || '').toLowerCase();
        const fieldName = (r.field?.name || '').toLowerCase();
        return playerName.includes(term) || playerPhone.includes(term) || fieldName.includes(term);
      });
    }

    this.filteredReservations = result;
  }

  getStatusLabel(status?: string): string {
    const s = (status || '').toLowerCase().trim();
    if (s === 'confirmed') return 'Confirmé';
    if (s === 'completed') return 'Terminé';
    if (s === 'pending') return 'En attente';
    if (s === 'cancelled' || s === 'canceled') return 'Annulé';
    return status || 'Inconnu';
  }

  getStatusClass(status?: string): string {
    const s = (status || '').toLowerCase().trim();
    if (s === 'confirmed' || s === 'completed') {
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60';
    }
    if (s === 'pending') {
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60';
    }
    if (s === 'cancelled' || s === 'canceled') {
      return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60';
    }
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
  }

  onFilterChange() {
    this.applyFilters();
  }

  getPaidAmount(payment: any): number {
    if (!payment || payment.status !== 'completed') return 0;
    return payment.amount || 0;
  }

  getWhatsAppLink(phone?: string, playerName?: string, fieldName?: string, date?: string): string {
    if (!phone) return '#';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const standardPhone = cleanPhone.startsWith('221') ? cleanPhone : `221${cleanPhone}`;
    const text = encodeURIComponent(
      `Bonjour ${playerName || ''}, concernant votre réservation myTerrain${fieldName ? ' pour le terrain ' + fieldName : ''}${date ? ' le ' + date : ''} :`
    );
    return `https://wa.me/${standardPhone}?text=${text}`;
  }

  cancelReservation(id: number) {
    if (confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      this.reservationService.cancelReservation(id).subscribe({
        next: () => {
          this.toastService.success('Réservation annulée avec succès');
          this.loadReservations();
        },
        error: () => {
          this.toastService.error("Erreur lors de l'annulation de la réservation");
        }
      });
    }
  }

  exportToCSV() {
    if (!this.reservations.length) {
      this.toastService.warning('Aucune réservation à exporter');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Date Création,Joueur,Téléphone,Terrain,Date Match,Heure,Prix Total,Statut\n';

    this.filteredReservations.forEach((r: any) => {
      const created = r.created_at || '';
      const player = r.player_name || r.guest_name || r.user?.name || 'Inconnu';
      const phone = r.player_phone || r.guest_phone || r.user?.phone || '';
      const field = r.field?.name || '';
      const matchDate = r.time_slot?.date || '';
      const matchTime = `${r.time_slot?.start_time || ''} - ${r.time_slot?.end_time || ''}`;
      const price = r.total_price || 0;
      const status = r.status || '';

      csvContent += `"${created}","${player}","${phone}","${field}","${matchDate}","${matchTime}","${price}","${status}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Reservations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toastService.success('Fichier CSV généré avec succès');
  }
}
