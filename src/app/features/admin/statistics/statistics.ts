import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './statistics.html',
  styleUrls: ['./statistics.scss'],
})
export class Statistics implements OnInit {
  loading = true;
  error = false;
  
  public lineChartData: ChartConfiguration['data'] = {
    datasets: [],
    labels: []
  };
  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      line: { tension: 0.4 }
    }
  };
  public lineChartType: ChartType = 'line';

  public pieChartData: ChartConfiguration['data'] = {
    datasets: [],
    labels: []
  };
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false
  };
  public pieChartType: ChartType = 'pie';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.adminService.getDetailedStats().subscribe({
      next: (data) => {
        // Setup Line Chart (Monthly Revenue)
        const reversedRevenue = [...data.monthly_revenue].reverse();
        this.lineChartData = {
          labels: reversedRevenue.map((r: any) => r.month),
          datasets: [
            {
              data: reversedRevenue.map((r: any) => parseFloat(r.revenue)),
              label: 'Revenu Mensuel (XOF)',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderColor: 'rgba(0, 0, 0, 1)',
              pointBackgroundColor: 'rgba(0, 0, 0, 1)',
              pointBorderColor: '#fff',
              fill: 'origin',
            }
          ]
        };

        // Setup Pie Chart (Reservations by Status)
        this.pieChartData = {
          labels: data.reservations_by_status.map((r: any) => r.status),
          datasets: [
            {
              data: data.reservations_by_status.map((r: any) => r.total),
              backgroundColor: ['#eab308', '#22c55e', '#ef4444', '#3b82f6'],
            }
          ]
        };

        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur stats', err);
        this.error = true;
        this.loading = false;
      }
    });
  }
}
