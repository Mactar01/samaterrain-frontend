import { Component, OnInit, inject } from '@angular/core';
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

  applyFilters() {
    let result = [...this.reservations];

    // Status filter
    if (this.selectedStatus !== 'all') {
      result = result.filter(r => r.status === this.selectedStatus);
    }

    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(r => {
        const playerName = (r.player_name || (r as any).guest_name || r.user?.name || '').toLowerCase();
        const playerPhone = (r.player_phone || (r as any).guest_phone || r.user?.phone || '').toLowerCase();
        const fieldName = (r.field?.name || '').toLowerCase();
        return playerName.includes(term) || playerPhone.includes(term) || fieldName.includes(term);
      });
    }

    this.filteredReservations = result;
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
