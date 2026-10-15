import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, DatePipe],
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

  formatFCFA(val: number | null | undefined): string {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(num) + ' FCFA';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50';
      case 'pending':
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50';
      case 'failed':
        return 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/50';
      case 'refunded':
        return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700';
      default:
        return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300';
    }
  }
}
