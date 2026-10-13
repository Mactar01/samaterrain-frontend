import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReservationService } from '../../../core/services/reservation.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, RouterModule],
  providers: [DatePipe],
  templateUrl: './reservations.component.html'
})
export class ReservationsComponent implements OnInit {
  reservations: any[] = [];
  loading = true;

  constructor(private reservationService: ReservationService) {}

  ngOnInit() {
    this.reservationService.getOwnerReservations().subscribe({
      next: (res) => {
        this.reservations = res.data || res;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  getPaidAmount(payment: any): number {
    if (!payment || payment.status !== 'completed') return 0;
    return payment.amount || 0;
  }

  cancelReservation(id: number) {
    if (confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      this.reservationService.cancelReservation(id).subscribe({
        next: (res) => {
          alert('Réservation annulée avec succès');
          this.ngOnInit(); // reload
        },
        error: (err) => {
          console.error(err);
          alert("Erreur lors de l'annulation");
        }
      });
    }
  }
}

