import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { OwnerSettingsService } from '../../../core/services/owner-settings.service';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { DarkModeToggleComponent } from '../../../shared/components/dark-mode-toggle/dark-mode-toggle.component';
import { NotificationBellComponent } from '../../../shared/components/notification-bell/notification-bell.component';
import {
  OwnerSettings,
  AccountingReport,
  DEFAULT_OWNER_SETTINGS
} from '../../../core/models/owner-settings.model';
import { OwnerBranding } from '../../../core/models/branding.model';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-owner-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DarkModeToggleComponent,
    NotificationBellComponent
  ],
  templateUrl: './settings.component.html'
})
export class OwnerSettingsComponent implements OnInit {
  user: User | null = null;
  businessName = '';
  commissionRate = 10;

  get branding(): OwnerBranding {
    return this.themeService.currentBranding();
  }

  activeTab: 'whatsapp_sms' | 'subscriptions' | 'matchmaking' | 'loyalty' | 'accounting' = 'whatsapp_sms';

  settings: OwnerSettings = JSON.parse(JSON.stringify(DEFAULT_OWNER_SETTINGS));

  isLoading = true;
  isSaving = false;

  // Accounting Report State
  report: AccountingReport | null = null;
  isLoadingReport = false;
  selectedYear = new Date().getFullYear();
  selectedMonth: number | 'all' = new Date().getMonth() + 1;
  availableYears = [2026, 2025, 2024];
  months = [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' }
  ];

  // Variables de remplacement pour le message WhatsApp
  availableTags = [
    { tag: '{client_name}', label: 'Nom du Client' },
    { tag: '{field_name}', label: 'Nom du Terrain' },
    { tag: '{date}', label: 'Date du match' },
    { tag: '{time}', label: 'Heure du match' },
    { tag: '{business_name}', label: 'Nom de votre complexe' }
  ];

  // Feedback visuel de copie du lien parrainage
  copiedCode = false;

  constructor(
    private settingsService: OwnerSettingsService,
    private authService: AuthService,
    public themeService: ThemeService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  canAccess(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  getUserRoleLabel(): string {
    return this.authService.getUserRoleLabel(this.user);
  }

  hasTabAccess(tab: 'whatsapp_sms' | 'subscriptions' | 'matchmaking' | 'loyalty' | 'accounting'): boolean {
    switch (tab) {
      case 'whatsapp_sms':
      case 'subscriptions':
      case 'matchmaking':
      case 'loyalty':
        return this.canAccess('settings:manage');
      case 'accounting':
        return this.canAccess('accounting:view');
      default:
        return false;
    }
  }

  get firstAccessibleTab(): 'whatsapp_sms' | 'subscriptions' | 'matchmaking' | 'loyalty' | 'accounting' | null {
    const candidateTabs: ('whatsapp_sms' | 'subscriptions' | 'matchmaking' | 'loyalty' | 'accounting')[] = [
      'whatsapp_sms',
      'subscriptions',
      'matchmaking',
      'loyalty',
      'accounting'
    ];
    return candidateTabs.find((tab) => this.hasTabAccess(tab)) || null;
  }

  ngOnInit(): void {
    this.user = this.authService.currentUserValue;

    // Écoute des queryParams
    this.route.queryParams.subscribe((params) => {
      const tabParam = params['tab'];
      const subParam = params['sub'];

      // Redirection transparente si l'utilisateur arrive avec ?tab=team ou ?tab=users vers /dashboard/team
      if (tabParam === 'team' || tabParam === 'users') {
        this.router.navigate(['/dashboard/team'], {
          queryParams: { sub: subParam || 'members' }
        });
        return;
      }

      let requestedTab: 'whatsapp_sms' | 'subscriptions' | 'matchmaking' | 'loyalty' | 'accounting' = 'whatsapp_sms';

      if (tabParam === 'accounting') {
        requestedTab = 'accounting';
      } else if (tabParam === 'subscriptions') {
        requestedTab = 'subscriptions';
      } else if (tabParam === 'matchmaking') {
        requestedTab = 'matchmaking';
      } else if (tabParam === 'loyalty') {
        requestedTab = 'loyalty';
      } else if (tabParam === 'whatsapp_sms') {
        requestedTab = 'whatsapp_sms';
      }

      // Fail-closed permission check: If the collaborator cannot access the requested tab,
      // fallback to their first accessible tab. If they have none, redirect to dashboard.
      if (this.hasTabAccess(requestedTab)) {
        this.activeTab = requestedTab;
      } else {
        const fallback = this.firstAccessibleTab;
        if (fallback) {
          this.activeTab = fallback;
        } else {
          this.router.navigate(['/dashboard']);
          return;
        }
      }
    });

    this.loadSettings();
  }

  loadSettings(): void {
    this.isLoading = true;
    this.settingsService.getSettings().subscribe({
      next: (res) => {
        this.settings = res.settings;
        this.businessName = res.business_name || this.user?.name || 'Mon Complexe';
        this.commissionRate = res.commission_rate ?? 10;
        this.isLoading = false;
        this.cdr.detectChanges();

        if (this.activeTab === 'accounting' && !this.report && !this.isLoadingReport) {
          this.loadAccountingReport();
        }
      },
      error: (err) => {
        console.error('Erreur chargement paramètres loueur', err);
        this.isLoading = false;
        this.cdr.detectChanges();
        if (this.activeTab === 'accounting' && !this.report && !this.isLoadingReport) {
          this.loadAccountingReport();
        }
      }
    });
  }

  setTab(tab: 'whatsapp_sms' | 'subscriptions' | 'matchmaking' | 'loyalty' | 'accounting'): void {
    if (!this.hasTabAccess(tab)) return;
    this.activeTab = tab;
    if (tab === 'accounting' && !this.report && !this.isLoadingReport) {
      this.loadAccountingReport();
    }
  }

  saveSettings(): void {
    this.isSaving = true;
    this.settingsService.updateSettings(this.settings).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.settings = res.settings;
        this.confirmationService.success(
          'Toutes les préférences de votre complexe ont été mises à jour.',
          'Paramètres enregistrés !'
        );
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSaving = false;
        this.confirmationService.error(
          err?.error?.message || "Impossible d'enregistrer les paramètres.",
          'Erreur'
        );
        this.cdr.detectChanges();
      }
    });
  }

  // --- Module 1 : Helper Tags WhatsApp ---
  insertTag(tag: string): void {
    const current = this.settings.whatsapp_sms.custom_welcome_message || '';
    this.settings.whatsapp_sms.custom_welcome_message = current + ' ' + tag;
  }

  getLiveMessagePreview(): string {
    const template = this.settings.whatsapp_sms.custom_welcome_message || '';
    return template
      .replace(/{client_name}/g, 'Amadou Diop')
      .replace(/{field_name}/g, 'Terrain Synthétique Pro 1')
      .replace(/{date}/g, 'Samedi 18 Octobre')
      .replace(/{time}/g, '20:00 - 21:00')
      .replace(/{business_name}/g, this.businessName || 'myTerrain Arena');
  }

  // --- Module 4 : Parrainage Helpers ---
  copyReferralLink(): void {
    const code = this.settings.loyalty.custom_referral_code || 'PRO-' + (this.user?.id || 'PARTENAIRE');
    const link = `${window.location.origin}/register?ref=${code}`;
    navigator.clipboard.writeText(link).then(() => {
      this.copiedCode = true;
      setTimeout(() => (this.copiedCode = false), 2500);
      this.confirmationService.success(
        'Le lien de parrainage joueur a été copié dans votre presse-papier.',
        'Lien copié !'
      );
    });
  }

  // --- Module 6 : Accounting Report Handlers ---
  loadAccountingReport(): void {
    this.isLoadingReport = true;
    this.settingsService
      .getAccountingReport(this.selectedYear, this.selectedMonth)
      .subscribe({
        next: (data) => {
          this.report = data;
          this.isLoadingReport = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erreur rapport comptable', err);
          this.isLoadingReport = false;
          this.cdr.detectChanges();
        }
      });
  }

  onPeriodChange(): void {
    this.loadAccountingReport();
  }

  downloadCsv(): void {
    this.settingsService.exportAccountingCsv(this.selectedYear, this.selectedMonth);
    this.confirmationService.toast(
      'Votre fichier CSV est prêt et en cours de téléchargement.',
      'info'
    );
  }

  printReport(): void {
    window.print();
  }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('fr-FR').format(amount || 0);
  }
}
