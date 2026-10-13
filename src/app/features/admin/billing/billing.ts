import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  templateUrl: './billing.html',
  styleUrls: ['./billing.scss'],
})
export class Billing implements OnInit {
  billingData: any = {
    global_revenue: 0,
    total_commission: 0,
    pending_payouts: 0,
    recent_transactions: []
  };
  loading = true;
  error = false;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadBilling();
  }

  loadBilling(): void {
    this.loading = true;
    this.adminService.getBilling().subscribe({
      next: (data) => {
        this.billingData = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement facturation', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
