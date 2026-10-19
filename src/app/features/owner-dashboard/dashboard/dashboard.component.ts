import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { FieldService } from '../../../core/services/field.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { ThemeService } from '../../../core/services/theme.service';
import { OwnerBranding, DEFAULT_OWNER_BRANDING, BRAND_COLOR_PRESETS, BackgroundStyle, LogoPosition } from '../../../core/models/branding.model';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import Swal from 'sweetalert2';
import { environment } from '../../../../environments/environment';
import { Field } from '../../../core/models/field.model';
import { User } from '../../../core/models/user.model';

import { DarkModeToggleComponent } from '../../../shared/components/dark-mode-toggle/dark-mode-toggle.component';
import { NotificationBellComponent } from '../../../shared/components/notification-bell/notification-bell.component';

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
    DarkModeToggleComponent,
    NotificationBellComponent
  ],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, OnDestroy {
  fields: Field[] = [];
  user: User | null = null;
  notifications: any[] = [];
  unreadCount = 0;
  activeTab = 'home';
  showUserDropdown = false;
  isSettingsMenuOpen = false;
  isTeamMenuOpen = false;

  toggleSettingsMenu(): void {
    this.isSettingsMenuOpen = !this.isSettingsMenuOpen;
  }

  toggleTeamMenu(): void {
    this.isTeamMenuOpen = !this.isTeamMenuOpen;
  }

  isLoadingFields = true;
  isLoadingStats = true;

  // Owner Dashboard Stats
  ownerStats: any = null;

  // Branding & White-label State
  branding: OwnerBranding = { ...DEFAULT_OWNER_BRANDING };
  brandPresets = BRAND_COLOR_PRESETS;
  isSavingBranding = false;

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
    public themeService: ThemeService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  goToCreateField() {
    if (!this.canAccess('fields:manage')) return;
    this.router.navigate(['/dashboard/fields/new']);
  }

  goToSlots(fieldId?: number) {
    if (!this.canAccess('slots:manage')) return;
    if (fieldId) {
      this.router.navigate(['/dashboard/fields', fieldId, 'slots']);
    } else if (this.fields && this.fields.length > 0) {
      this.router.navigate(['/dashboard/fields', this.fields[0].id, 'slots']);
    } else if (this.canAccess('fields:manage')) {
      this.setTab('fields');
    }
  }

  avatarFailed = false;
  readonly defaultFieldPhoto = 'https://images.unsplash.com/photo-1575361204481-4d3b6707ea20?q=80&w=1000&auto=format&fit=crop';
  private brokenFieldUrls = new Set<string>();

  get avatarUrl(): string | null {
    if (this.avatarFailed) return null;
    return this.authService.getAvatarUrl(this.user?.avatar);
  }

  onAvatarError(): void {
    this.avatarFailed = true;
  }

  getUserRoleLabel(): string {
    return this.authService.getUserRoleLabel(this.user);
  }

  ngOnInit() {
    let loadedForUserId: number | null = null;
    this.authService.currentUser.subscribe(u => {
      const prevAvatar = this.user?.avatar;
      this.user = u;
      if (u?.avatar !== prevAvatar) {
        this.avatarFailed = false;
      }
      if (this.user?.role === 'owner') {
        this.themeService.initBranding(this.user.owner?.id || this.user.id, this.user.owner?.branding);
        this.branding = { ...this.themeService.currentBranding() };
        if (loadedForUserId !== this.user.id) {
          loadedForUserId = this.user.id;
          this.loadOwnerData();
          this.loadOwnerStats();
        }
      }
    });

    this.authService.fetchCurrentUser().subscribe();

    this.loadNotifications();
    this.notifInterval = setInterval(() => {
      this.loadNotifications();
    }, 20000);
  }

  setTab(tab: string) {
    if (tab === 'fields' && !this.canAccess('fields:manage')) return;
    if (tab === 'stats' && !this.canAccess('accounting:view')) return;
    if (tab === 'branding' && !this.canAccess('settings:manage')) return;
    this.activeTab = tab;
  }

  canAccess(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  readonly quickModules = [
    {
      title: 'Mes Terrains',
      type: 'fields',
      icon: 'ph ph-soccer-ball',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/60',
      textClass: 'text-emerald-600 dark:text-emerald-400',
      rights: ['fields:manage']
    },
    {
      title: 'Réservations',
      type: 'reservations',
      link: '/dashboard/reservations',
      icon: 'ph ph-calendar-check',
      bgClass: 'bg-blue-50 dark:bg-blue-950/60',
      textClass: 'text-blue-600 dark:text-blue-400',
      rights: ['reservations:manage']
    },
    {
      title: 'Créneaux & Tarifs',
      type: 'slots',
      icon: 'ph ph-clock',
      bgClass: 'bg-amber-50 dark:bg-amber-950/60',
      textClass: 'text-amber-600 dark:text-amber-400',
      rights: ['slots:manage']
    },
    {
      title: 'Statistiques & CA',
      type: 'stats',
      icon: 'ph ph-chart-line-up',
      bgClass: 'bg-purple-50 dark:bg-purple-950/60',
      textClass: 'text-purple-600 dark:text-purple-400',
      rights: ['accounting:view']
    },
    {
      title: 'WhatsApp & SMS',
      type: 'whatsapp_sms',
      link: '/dashboard/settings',
      queryParams: { tab: 'whatsapp_sms' },
      icon: 'ph ph-whatsapp-logo',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/60',
      textClass: 'text-emerald-500',
      rights: ['settings:manage']
    },
    {
      title: 'Abonnements',
      type: 'subscriptions',
      link: '/dashboard/settings',
      queryParams: { tab: 'subscriptions' },
      icon: 'ph ph-arrows-clockwise',
      bgClass: 'bg-blue-50 dark:bg-blue-950/60',
      textClass: 'text-blue-500',
      rights: ['settings:manage']
    },
    {
      title: 'Matchmaking',
      type: 'matchmaking',
      link: '/dashboard/settings',
      queryParams: { tab: 'matchmaking' },
      icon: 'ph ph-users',
      bgClass: 'bg-amber-50 dark:bg-amber-950/60',
      textClass: 'text-amber-500',
      rights: ['settings:manage']
    },
    {
      title: 'Fidélité & Bonus',
      type: 'loyalty',
      link: '/dashboard/settings',
      queryParams: { tab: 'loyalty' },
      icon: 'ph ph-gift',
      bgClass: 'bg-purple-50 dark:bg-purple-950/60',
      textClass: 'text-purple-500',
      rights: ['settings:manage']
    },
    {
      title: 'Export Comptable',
      type: 'accounting',
      link: '/dashboard/settings',
      queryParams: { tab: 'accounting' },
      icon: 'ph ph-file-csv',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/60',
      textClass: 'text-emerald-600 dark:text-emerald-400',
      rights: ['accounting:view']
    },
    {
      title: 'Gestion Utilisateurs (Teams)',
      type: 'team',
      link: '/dashboard/team',
      icon: 'ph ph-users-three',
      bgClass: 'bg-slate-100 dark:bg-slate-800',
      textClass: 'text-slate-700 dark:text-slate-300',
      rights: ['team:manage']
    },
    {
      title: 'Paramétrage',
      type: 'settings',
      link: '/dashboard/settings',
      icon: 'ph ph-gear',
      bgClass: 'bg-teal-50 dark:bg-teal-950/60',
      textClass: 'text-teal-600 dark:text-teal-400',
      rights: ['settings:manage']
    },
    {
      title: 'Personnaliser',
      type: 'branding',
      icon: 'ph ph-palette',
      bgClass: 'bg-slate-100 dark:bg-slate-800',
      textClass: 'text-slate-600 dark:text-slate-300',
      rights: ['settings:manage']
    }
  ];

  get modules() {
    return this.quickModules.filter(m => {
      if (!m.rights || m.rights.length === 0) return true;
      return this.authService.hasAnyPermission(m.rights);
    });
  }

  handleModuleClick(module: any) {
    if (module.type === 'fields') {
      this.setTab('fields');
    } else if (module.type === 'stats') {
      this.setTab('stats');
    } else if (module.type === 'branding') {
      this.setTab('branding');
    } else if (module.type === 'slots') {
      this.goToSlots();
    } else if (module.link) {
      if (module.queryParams) {
        this.router.navigate([module.link], { queryParams: module.queryParams });
      } else {
        this.router.navigate([module.link]);
      }
    }
  }

  // --- Loueur White-Label Branding Handlers ---

  setLogoPosition(pos: LogoPosition) {
    this.branding.logoPosition = pos;
  }

  selectPresetColor(color: string, secondaryColor?: string) {
    this.branding.primaryColor = color;
    if (secondaryColor) {
      this.branding.secondaryColor = secondaryColor;
    }
  }

  setBackgroundStyle(style: BackgroundStyle) {
    this.branding.bgStyle = style;
  }

  onLogoFileSelected(event: any) {
    const file = event.target?.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        this.toastService.warning('Le fichier est trop volumineux (max 2 Mo).');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.branding.logoUrl = e.target.result;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  private compressImage(file: File, maxWidth: number, maxHeight: number, quality: number = 0.85): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target.result);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  onCustomBgSelected(event: any) {
    const file = event.target?.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        this.toastService.warning('Le fichier d\'arrière-plan est trop volumineux (max 15 Mo).');
        return;
      }
      this.compressImage(file, 1600, 600, 0.82).then(base64Data => {
        this.branding.customBgUrl = base64Data;
        this.branding.coverUrl = base64Data;
        this.branding.bgStyle = 'stadium';
        this.cdr.detectChanges();
      }).catch(() => {
        this.toastService.error('Erreur lors du traitement de l\'image.');
      });
    }
  }

  removeCustomBg() {
    this.branding.customBgUrl = undefined;
    this.branding.coverUrl = undefined;
    if (this.branding.bgStyle === 'stadium') {
      this.branding.bgStyle = 'clean';
    }
    this.cdr.detectChanges();
  }

  removeLogo() {
    this.branding.logoUrl = undefined;
  }

  saveBranding() {
    this.isSavingBranding = true;
    this.themeService.saveBranding(this.branding, this.user?.owner?.id || this.user?.id);
    setTimeout(() => {
      this.isSavingBranding = false;
      this.toastService.success('Vos préférences de personnalisation ont été enregistrées avec succès !');
      this.cdr.detectChanges();
    }, 400);
  }

  resetBranding() {
    this.themeService.resetBranding(this.user?.owner?.id || this.user?.id);
    this.branding = { ...DEFAULT_OWNER_BRANDING };
    this.toastService.info('La personnalisation a été réinitialisée au thème par défaut.');
    this.cdr.detectChanges();
  }

  formatFieldType(type?: string): string {
    return this.formatSurface(type);
  }

  formatSurface(surface?: string | null): string {
    if (!surface) return '—';
    const s = surface.toLowerCase().trim();
    const map: Record<string, string> = {
      'artificial_grass': 'Pelouse synthétique',
      'natural_grass': 'Gazon naturel',
      'synthetic': 'Pelouse synthétique',
      'synthetique': 'Pelouse synthétique',
      'futsal': 'Futsal (Indoor / Parquet)',
      'indoor': 'Salle (Indoor)',
      'concrete': 'Béton / Goudron',
      'clay': 'Terre battue',
      'parquet': 'Parquet',
      'sand': 'Sable',
      'tartan': 'Tartan',
      'resin': 'Résine',
      'hybrid': 'Hybride',
      'herbe': 'Gazon naturel'
    };
    if (map[s]) return map[s];
    return s.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  private normalizeMediaUrl(raw?: string | null): string | null {
    if (!raw || typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('data:image')) return trimmed;

    const baseUrl = environment.apiUrl.replace(/\/api\/v1\/?$/, '');

    const storageMatch = trimmed.match(/\/storage\/(.+)$/);
    if (storageMatch) {
      return `${baseUrl}/storage/${storageMatch[1]}`;
    }

    if (trimmed.startsWith('storage/')) {
      return `${baseUrl}/${trimmed}`;
    }

    if (
      trimmed.includes('trycloudflare.com') ||
      trimmed.includes('ngrok') ||
      trimmed.includes('loca.lt') ||
      /^https?:\/\/(localhost|127\.0\.0\.1|backend)(:\d+)?(\/|$)/.test(trimmed)
    ) {
      return trimmed.replace(/^https?:\/\/[^\/]+/, baseUrl);
    }

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return `${baseUrl}/storage/${trimmed.replace(/^\/+/, '')}`;
    }

    return trimmed;
  }

  getFieldPhoto(field: Field): string {
    const candidates = [
      field?.photo_url,
      field?.photo,
      ((field as any)?.primary_image || (field as any)?.primaryImage)?.url,
      ...(field?.images?.map(i => i?.url) || [])
    ];

    for (const candidate of candidates) {
      const resolved = this.normalizeMediaUrl(candidate);
      if (resolved && !this.brokenFieldUrls.has(resolved)) {
        return resolved;
      }
    }

    return this.defaultFieldPhoto;
  }

  getImageUrl(url?: string): string {
    const resolved = this.normalizeMediaUrl(url);
    if (!resolved || this.brokenFieldUrls.has(resolved)) {
      return this.defaultFieldPhoto;
    }
    return resolved;
  }

  onFieldImageError(event: Event, badUrl?: string): void {
    if (badUrl) {
      this.brokenFieldUrls.add(badUrl);
    }
    const imgEl = event.target as HTMLImageElement;
    if (imgEl && imgEl.src !== this.defaultFieldPhoto) {
      if (imgEl.src) {
        this.brokenFieldUrls.add(imgEl.src);
      }
      imgEl.src = this.defaultFieldPhoto;
    }
  }

  fieldPhotoIndex: { [fieldId: number]: number } = {};
  private photoCarouselInterval: any = null;

  startPhotoCarousel() {
    if (this.photoCarouselInterval) {
      clearInterval(this.photoCarouselInterval);
    }
    this.photoCarouselInterval = setInterval(() => {
      if (!this.fields || this.fields.length === 0) return;
      let hasChanges = false;
      for (const field of this.fields) {
        const photos = this.getFieldPhotos(field);
        if (photos.length > 1) {
          const currentIdx = this.fieldPhotoIndex[field.id] || 0;
          this.fieldPhotoIndex[field.id] = (currentIdx + 1) % photos.length;
          hasChanges = true;
        }
      }
      if (hasChanges) {
        this.cdr.detectChanges();
      }
    }, 2000);
  }

  getFieldPhotos(field: Field): string[] {
    if (!field) return [];
    if (field.images && field.images.length > 0) {
      const valid = field.images
        .map(img => this.normalizeMediaUrl(img?.url))
        .filter((u): u is string => !!u && !this.brokenFieldUrls.has(u));
      if (valid.length > 0) {
        return valid;
      }
    }
    const single = this.getFieldPhoto(field);
    return single ? [single] : [];
  }

  getCurrentPhotoIndex(field: Field): number {
    const photos = this.getFieldPhotos(field);
    if (photos.length <= 1) return 0;
    return (this.fieldPhotoIndex[field.id] || 0) % photos.length;
  }

  formatPrice(price: any): string {
    if (!price) return '0';
    const num = Math.round(Number(price) || 0);
    return num.toLocaleString('fr-FR');
  }

  getFieldDisplayLocation(field: Field): string {
    if (!field) return 'Dakar, Sénégal';
    const parts: string[] = [];
    if (field.address && field.address.trim()) {
      parts.push(field.address.trim());
    }
    if (field.city && field.city.trim()) {
      const cityTrimmed = field.city.trim();
      if (!field.address || !field.address.toLowerCase().includes(cityTrimmed.toLowerCase())) {
        parts.push(cityTrimmed);
      }
    }
    if (parts.length > 0) {
      return parts.join(', ');
    }
    return field.location || 'Dakar, Sénégal';
  }

  activeDropdownFieldId: number | null = null;

  toggleFieldDropdown(fieldId: number, event: Event) {
    event.stopPropagation();
    if (this.activeDropdownFieldId === fieldId) {
      this.activeDropdownFieldId = null;
    } else {
      this.activeDropdownFieldId = fieldId;
    }
  }

  toggleActionDropdown(fieldId: number, event: Event) {
    this.toggleFieldDropdown(fieldId, event);
  }

  closeFieldDropdown() {
    this.activeDropdownFieldId = null;
  }

  closeActionDropdown() {
    this.closeFieldDropdown();
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.closeFieldDropdown();
  }

  fieldsSearchTerm: string = '';
  fieldsSelectedType: string = 'all';

  readonly fieldTypeFilters = [
    { value: 'football',   label: '⚽ Football' },
    { value: 'basketball', label: '🏀 Basketball' },
    { value: 'padel',      label: '🏓 Padel' },
    { value: 'tennis',     label: '🎾 Tennis' },
    { value: 'volleyball', label: '🏐 Volleyball' },
    { value: 'autre',      label: '🏟️ Multisport' },
  ];

  get filteredFieldsForDashboard(): Field[] {
    const term = (this.fieldsSearchTerm || '').toLowerCase().trim();
    return (this.fields || []).filter(f => {
      const matchSearch = !term ||
        f.name.toLowerCase().includes(term) ||
        (f.reference && f.reference.toLowerCase().includes(term)) ||
        (f.address && f.address.toLowerCase().includes(term)) ||
        (f.city && f.city.toLowerCase().includes(term)) ||
        (f.location && f.location.toLowerCase().includes(term)) ||
        (f.surface_type && f.surface_type.toLowerCase().includes(term));

      const matchType = this.fieldsSelectedType === 'all' || 
        (f.type && f.type.toLowerCase() === this.fieldsSelectedType.toLowerCase());

      return matchSearch && matchType;
    });
  }

  getFieldRef(field: Field): string {
    if (field.reference) return field.reference;
    return 'TER-' + field.id.toString().padStart(4, '0');
  }

  copyRef(field: Field, event: Event): void {
    event.stopPropagation();
    const ref = this.getFieldRef(field);
    navigator.clipboard?.writeText(ref).then(() => {
      this.toastService.success(`Référence ${ref} copiée !`);
    }).catch(() => {
      this.toastService.error('Impossible de copier la référence.');
    });
  }

  openMap(field: Field, event: Event): void {
    event.stopPropagation();
    if (field.latitude && field.longitude) {
      const url = `https://www.google.com/maps?q=${field.latitude},${field.longitude}`;
      window.open(url, '_blank', 'noopener');
    }
  }

  getTypeBadgeClass(type?: string): string {
    const map: Record<string, string> = {
      football:   'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
      basketball: 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300',
      tennis:     'bg-yellow-100 dark:bg-yellow-950/60 text-yellow-700 dark:text-yellow-300',
      padel:      'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300',
      volleyball: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300',
      autre:      'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
    };
    return (type && map[type.toLowerCase()]) || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
  }

  getTypeLabel(type?: string): string {
    const map: Record<string, string> = {
      football:   'Football',
      basketball: 'Basketball',
      tennis:     'Tennis',
      padel:      'Padel',
      volleyball: 'Volleyball',
      autre:      'Multisport'
    };
    return (type && map[type.toLowerCase()]) || type || 'Terrain';
  }

  loadOwnerData() {
    this.isLoadingFields = true;
    this.fieldService.getOwnerFields().subscribe({
      next: (data) => {
        this.fields = data || [];
        this.isLoadingFields = false;
        this.startPhotoCarousel();
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

  loadNotifications() {
    this.http.get<any>(`${environment.apiUrl}/owner/notifications`).subscribe({
      next: (data) => {
        this.notifications = data.notifications || [];
        this.unreadCount = data.unread_count || 0;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  markAsRead(id: string) {
    this.http.post(`${environment.apiUrl}/owner/notifications/${id}/read`, {}).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.cdr.detectChanges();
      }
    });
  }

  exportToCSV() {
    window.open(`${environment.apiUrl}/owner/stats/export`, '_blank');
  }

  deleteField(id: number) {
    this.confirmationService.confirm({
      title: 'Supprimer ce terrain ?',
      text: 'Cette action est irréversible et supprimera les créneaux associés.',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#ef4444'
    }).then((confirmed) => {
      if (confirmed) {
        this.fieldService.deleteField(id).subscribe({
          next: () => {
            this.fields = this.fields.filter(f => f.id !== id);
            this.toastService.success('Terrain supprimé avec succès');
            this.loadOwnerStats();
            this.cdr.detectChanges();
          },
          error: () => this.toastService.error('Erreur lors de la suppression')
        });
      }
    });
  }

  logout() {
    this.authService.logout();
  }

  async editField(field: Field) {
    const existingImages: any[] = (field.images && field.images.length > 0)
      ? field.images
      : (field.photo ? [{ id: 0, url: this.getFieldPhoto(field), is_primary: true }] : []);

    let existingHtml = '';
    if (existingImages.length > 0) {
      existingHtml = `
        <div class="mb-3">
          <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Photos actuelles (${existingImages.length}) :</p>
          <div id="swal-existing-grid" class="flex gap-2 overflow-x-auto py-1">
            ${existingImages.map((img) => `
              <div class="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800" id="existing-img-card-${img.id}">
                <img src="${this.getImageUrl(img.url)}" class="w-full h-full object-cover">
                ${img.id > 0 ? `
                  <button type="button" class="swal-delete-existing absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-600/90 text-white flex items-center justify-center text-[10px] font-bold hover:bg-red-700 cursor-pointer shadow" data-id="${img.id}" title="Supprimer cette photo">✕</button>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    let selectedFiles: File[] = [];

    const { value: formValues } = await Swal.fire({
      title: 'Modifier le terrain',
      html: `
        <div class="text-left px-1">
          <div class="mb-4 relative">
            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Nom du terrain</label>
            <div class="relative">
              <input id="swal-input1" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 transition-all text-sm outline-none" placeholder="Ex: Terrain Synthétique A" value="${field.name}">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Type de surface</label>
              <select id="swal-input-surface" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 transition-all text-sm outline-none">
                <option value="artificial_grass" ${(field.surface_type || field.type) === 'artificial_grass' ? 'selected' : ''}>Pelouse synthétique</option>
                <option value="natural_grass" ${(field.surface_type || field.type) === 'natural_grass' ? 'selected' : ''}>Gazon naturel</option>
                <option value="futsal" ${(field.surface_type || field.type) === 'futsal' ? 'selected' : ''}>Futsal (Indoor / Parquet)</option>
                <option value="concrete" ${(field.surface_type || field.type) === 'concrete' ? 'selected' : ''}>Béton / Goudron</option>
                <option value="clay" ${(field.surface_type || field.type) === 'clay' ? 'selected' : ''}>Terre battue</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Position dans le complexe</label>
              <input id="swal-input-location" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 transition-all text-sm outline-none" placeholder="Ex: Terrain 1 au fond, Salle A..." value="${field.location || ''}">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Capacité (joueurs)</label>
              <input id="swal-input-capacity" type="number" min="2" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 transition-all text-sm outline-none" placeholder="10" value="${field.capacity || 10}">
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Prix par heure</label>
              <div class="relative">
                <input id="swal-input3" type="number" class="w-full pl-3 pr-12 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 transition-all text-sm outline-none" placeholder="10000" value="${field.price_per_hour}">
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span class="text-gray-500 text-sm font-medium">FCFA</span>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Ville</label>
              <input id="swal-input-city" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 transition-all text-sm outline-none" placeholder="Ex: Dakar" value="${field.city || ''}">
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Adresse exacte</label>
              <input id="swal-input2" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 transition-all text-sm outline-none" placeholder="Ex: Sacré Cœur 3" value="${field.address || ''}">
            </div>
          </div>

          <div class="mt-2">
            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Photos du terrain <span class="text-xs text-gray-400 font-normal">(Multi-sélection acceptée)</span></label>
            
            ${existingHtml}

            <!-- Aperçu instantané des nouvelles photos sélectionnées -->
            <div id="swal-preview-container" class="hidden mb-3 p-2.5 bg-green-50 dark:bg-emerald-950/40 border border-green-200 dark:border-emerald-800 rounded-xl animate-fade-in">
              <div class="flex items-center justify-between mb-2">
                <span id="swal-files-count" class="text-xs font-bold text-green-700 dark:text-emerald-300 flex items-center gap-1">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                  <span>Nouvelle(s) photo(s)</span>
                </span>
                <button id="swal-clear-all" type="button" class="text-[11px] text-red-500 hover:text-red-700 font-bold cursor-pointer">Tout retirer</button>
              </div>
              <div id="swal-previews-grid" class="grid grid-cols-4 gap-2"></div>
            </div>

            <label for="swal-file" class="relative flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl p-4 bg-gray-50 dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-slate-700 hover:border-green-400 transition-colors cursor-pointer group text-center">
              <svg class="w-7 h-7 text-gray-400 group-hover:text-green-600 mb-1 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              <span id="swal-select-text" class="text-sm font-semibold text-green-600 group-hover:text-green-700">+ Ajouter une ou plusieurs photos</span>
              <p class="text-xs text-gray-400 mt-0.5">PNG, JPG, WEBP jusqu'à 5 Mo chacune</p>
              <input id="swal-file" type="file" multiple class="sr-only" accept="image/*">
            </label>
          </div>
        </div>
      `,
      customClass: {
        popup: 'rounded-2xl max-w-lg',
        title: 'text-xl text-slate-800 dark:text-white font-bold',
        confirmButton: '!bg-green-600 hover:!bg-green-700 !rounded-xl !px-6 !py-2.5 !font-semibold transition-colors',
        cancelButton: '!bg-slate-100 dark:!bg-slate-800 hover:!bg-slate-200 dark:hover:!bg-slate-700 !text-slate-700 dark:!text-slate-300 !rounded-xl !px-6 !py-2.5 !font-semibold transition-colors'
      },
      didOpen: () => {
        const fileInput = document.getElementById('swal-file') as HTMLInputElement;
        const previewContainer = document.getElementById('swal-preview-container') as HTMLElement;
        const previewsGrid = document.getElementById('swal-previews-grid') as HTMLElement;
        const filesCount = document.getElementById('swal-files-count') as HTMLElement;
        const clearAllBtn = document.getElementById('swal-clear-all') as HTMLElement;
        const selectText = document.getElementById('swal-select-text') as HTMLElement;

        const updateGrid = () => {
          if (selectedFiles.length === 0) {
            previewContainer?.classList.add('hidden');
            if (previewsGrid) previewsGrid.innerHTML = '';
            if (selectText) selectText.textContent = '+ Ajouter une ou plusieurs photos';
            return;
          }

          previewContainer?.classList.remove('hidden');
          if (filesCount) {
            filesCount.innerHTML = `<span>✓ ${selectedFiles.length} nouvelle(s) photo(s)</span>`;
          }
          if (selectText) {
            selectText.textContent = '+ Ajouter d\'autres photos';
          }
          if (previewsGrid) {
            previewsGrid.innerHTML = '';
            selectedFiles.forEach((file, idx) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                const card = document.createElement('div');
                card.className = 'relative w-full h-16 rounded-xl overflow-hidden border border-green-300 dark:border-emerald-700 group shrink-0';
                card.innerHTML = `
                  <img src="${e.target?.result}" class="w-full h-full object-cover">
                  <button type="button" class="swal-remove-single absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold hover:bg-red-700 cursor-pointer shadow" data-idx="${idx}">✕</button>
                `;
                card.querySelector('.swal-remove-single')?.addEventListener('click', (ev) => {
                  ev.preventDefault();
                  ev.stopPropagation();
                  selectedFiles.splice(idx, 1);
                  updateGrid();
                });
                previewsGrid.appendChild(card);
              };
              reader.readAsDataURL(file);
            });
          }
        };

        fileInput?.addEventListener('change', () => {
          if (fileInput.files) {
            const files = Array.from(fileInput.files);
            selectedFiles = [...selectedFiles, ...files];
            fileInput.value = '';
            updateGrid();
          }
        });

        clearAllBtn?.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          selectedFiles = [];
          if (fileInput) fileInput.value = '';
          updateGrid();
        });

        // Suppression d'images existantes
        document.querySelectorAll('.swal-delete-existing').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const imgId = Number((btn as HTMLElement).getAttribute('data-id'));
            if (imgId) {
              this.fieldService.deleteFieldImage(field.id, imgId).subscribe({
                next: () => {
                  document.getElementById(`existing-img-card-${imgId}`)?.remove();
                  this.toastService.success('Photo supprimée');
                  this.loadOwnerData();
                },
                error: () => this.toastService.error('Erreur lors de la suppression')
              });
            }
          });
        });
      },
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Enregistrer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#16a34a',
      preConfirm: () => {
        const surfaceVal = (document.getElementById('swal-input-surface') as HTMLSelectElement)?.value || 'artificial_grass';
        const data: any = {
          name: (document.getElementById('swal-input1') as HTMLInputElement).value,
          surface_type: surfaceVal,
          type: surfaceVal,
          location: (document.getElementById('swal-input-location') as HTMLInputElement)?.value || '',
          capacity: (document.getElementById('swal-input-capacity') as HTMLInputElement)?.value || 10,
          city: (document.getElementById('swal-input-city') as HTMLInputElement)?.value || '',
          address: (document.getElementById('swal-input2') as HTMLInputElement).value,
          price_per_hour: (document.getElementById('swal-input3') as HTMLInputElement).value
        };
        if (selectedFiles.length > 0) {
          data.photos = selectedFiles;
          data.photo = selectedFiles[0];
        }
        return data;
      }
    });

    if (formValues) {
      this.fieldService.updateField(field.id, formValues).subscribe({
        next: () => {
          this.toastService.success('Terrain mis à jour avec succès !');
          this.loadOwnerData();
        },
        error: () => this.toastService.error('Erreur lors de la modification')
      });
    }
  }

  getUserInitial(): string {
    return this.user?.name ? this.user.name.charAt(0).toUpperCase() : 'U';
  }

  toggleUserDropdown() {
    this.showUserDropdown = !this.showUserDropdown;
  }

  closeUserDropdown() {
    this.showUserDropdown = false;
  }

  ngOnDestroy() {
    if (this.notifInterval) {
      clearInterval(this.notifInterval);
    }
    if (this.photoCarouselInterval) {
      clearInterval(this.photoCarouselInterval);
    }
  }
}
