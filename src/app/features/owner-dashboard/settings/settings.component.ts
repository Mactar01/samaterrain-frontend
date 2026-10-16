import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { OwnerSettingsService } from '../../../core/services/owner-settings.service';
import { OwnerTeamService } from '../../../core/services/owner-team.service';
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
import {
  TeamMember,
  PermissionDefinition,
  RoleDefinition,
  CustomRole,
  PermissionsMatrixResponse
} from '../../../core/models/owner-team.model';
import { OwnerBranding, DEFAULT_OWNER_BRANDING } from '../../../core/models/branding.model';
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

  activeTab: 'whatsapp_sms' | 'subscriptions' | 'matchmaking' | 'loyalty' | 'accounting' | 'team' = 'whatsapp_sms';

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

  // Team & Permissions State
  teamMembers: TeamMember[] = [];
  availablePermissions: PermissionDefinition[] = [];
  defaultRoles: RoleDefinition[] = [];
  customRoles: CustomRole[] = [];
  allRoles: { role: string; label: string; description: string; permissions: string[]; is_system?: boolean; is_custom?: boolean }[] = [];
  isLoadingTeam = false;

  teamSubTab: 'members' | 'roles' | 'permissions' | 'assign' = 'members';
  selectedRoleId: string = 'manager';
  checkedPermissionKeys: Set<string> = new Set();
  searchAllPermissions: string = '';
  searchRolePermissions: string = '';
  searchCataloguePermissions: string = '';
  permissionGroupFilter: string = 'all';
  isSavingRoleRights: boolean = false;
  showCreateRoleModal: boolean = false;
  isSavingNewRole: boolean = false;
  newRole = {
    name: '',
    description: '',
    permissions: [] as string[]
  };

  showEditRoleModal: boolean = false;
  isSavingEditRole: boolean = false;
  editRoleForm = {
    id: '',
    name: '',
    description: '',
    permissions: [] as string[]
  };

  showAddMemberModal = false;
  showEditMemberModal = false;
  selectedMember: TeamMember | null = null;
  isSavingMember = false;

  newMember = {
    name: '',
    email: '',
    phone: '',
    role: 'receptionist',
    permissions: [] as string[],
    password: ''
  };

  editMemberForm = {
    role: 'receptionist',
    permissions: [] as string[],
    is_active: true
  };

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
    private teamService: OwnerTeamService,
    private authService: AuthService,
    public themeService: ThemeService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.user = this.authService.currentUserValue;

    // Écoute des queryParams pour ouvrir directement l'onglet demandé (ex: ?tab=team ou ?tab=users)
    this.route.queryParams.subscribe((params) => {
      const tabParam = params['tab'];
      const subParam = params['sub'];

      if (tabParam === 'team' || tabParam === 'users') {
        this.activeTab = 'team';
        if (subParam && ['members', 'roles', 'permissions', 'assign'].includes(subParam)) {
          this.teamSubTab = subParam as 'members' | 'roles' | 'permissions' | 'assign';
        }
      } else if (tabParam === 'accounting') {
        this.activeTab = 'accounting';
      } else if (tabParam === 'subscriptions') {
        this.activeTab = 'subscriptions';
      } else if (tabParam === 'matchmaking') {
        this.activeTab = 'matchmaking';
      } else if (tabParam === 'loyalty') {
        this.activeTab = 'loyalty';
      } else if (tabParam === 'whatsapp_sms') {
        this.activeTab = 'whatsapp_sms';
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

        if (this.activeTab === 'accounting') {
          this.loadAccountingReport();
        } else if (this.activeTab === 'team') {
          this.loadTeam();
        }
      },
      error: (err) => {
        console.error('Erreur chargement paramètres loueur', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  setTab(tab: 'whatsapp_sms' | 'subscriptions' | 'matchmaking' | 'loyalty' | 'accounting' | 'team'): void {
    this.activeTab = tab;
    if (tab === 'accounting' && !this.report && !this.isLoadingReport) {
      this.loadAccountingReport();
    } else if (tab === 'team' && this.teamMembers.length === 0 && !this.isLoadingTeam) {
      this.loadTeam();
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
          err?.error?.message || 'Impossible d\'enregistrer les paramètres.',
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

  // =========================================================================
  // GESTION DE L'ÉQUIPE & RÔLES / PERMISSIONS (RBAC)
  // =========================================================================

  loadTeam(): void {
    this.isLoadingTeam = true;
    this.teamService.getPermissionsMatrix().subscribe({
      next: (matrix) => {
        this.availablePermissions = matrix.available_permissions;
        this.buildAllRoles(matrix);
        this.onNewMemberRoleChange(this.newMember.role);

        this.teamService.getTeamMembers().subscribe({
          next: (res) => {
            this.teamMembers = res.members;
            this.isLoadingTeam = false;
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Erreur chargement équipe', err);
            this.isLoadingTeam = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('Erreur chargement permissions', err);
        this.isLoadingTeam = false;
        this.cdr.detectChanges();
      }
    });
  }

  buildAllRoles(matrix: PermissionsMatrixResponse): void {
    this.defaultRoles = matrix.default_roles;
    this.customRoles = matrix.custom_roles || [];

    const mappedDefaults = this.defaultRoles.map((dr) => ({
      ...dr,
      is_custom: false
    }));

    const mappedCustom = this.customRoles.map((cr) => ({
      role: cr.id,
      label: cr.name,
      description: cr.description || 'Rôle personnalisé du complexe',
      permissions: cr.permissions || [],
      is_system: false,
      is_custom: true
    }));

    this.allRoles = [...mappedDefaults, ...mappedCustom];

    if (!this.selectedRoleId || !this.allRoles.some((r) => r.role === this.selectedRoleId)) {
      this.selectedRoleId = this.allRoles[0]?.role || 'manager';
    }
    this.selectRole(this.selectedRoleId);
  }

  selectRole(roleId: string): void {
    this.selectedRoleId = roleId;
    const role = this.allRoles.find((r) => r.role === roleId);
    this.checkedPermissionKeys = new Set(role?.permissions || []);
  }

  get selectedRole(): { role: string; label: string; description: string; permissions: string[]; is_system?: boolean; is_custom?: boolean } | undefined {
    return this.allRoles.find((r) => r.role === this.selectedRoleId);
  }

  isCheckedPermission(key: string): boolean {
    return this.checkedPermissionKeys.has(key);
  }

  togglePermission(key: string): void {
    const s = new Set(this.checkedPermissionKeys);
    if (s.has(key)) {
      s.delete(key);
    } else {
      s.add(key);
    }
    this.checkedPermissionKeys = s;
  }

  toggleAllPermissions(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      const all = new Set(this.filteredAvailablePermissions.map((p) => p.key));
      this.checkedPermissionKeys = all;
    } else {
      this.checkedPermissionKeys = new Set();
    }
  }

  unassignAllRolePermissions(): void {
    this.checkedPermissionKeys = new Set();
  }

  get allChecked(): boolean {
    const list = this.filteredAvailablePermissions;
    return list.length > 0 && list.every((p) => this.isCheckedPermission(p.key));
  }

  get someChecked(): boolean {
    const list = this.filteredAvailablePermissions;
    return list.some((p) => this.isCheckedPermission(p.key)) && !this.allChecked;
  }

  get filteredAvailablePermissions(): PermissionDefinition[] {
    const q = this.searchAllPermissions.toLowerCase().trim();
    if (!q) return this.availablePermissions;
    return this.availablePermissions.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        p.key.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.group.toLowerCase().includes(q)
    );
  }

  get filteredRolePermissions(): PermissionDefinition[] {
    const q = this.searchRolePermissions.toLowerCase().trim();
    const assigned = this.availablePermissions.filter((p) => this.isCheckedPermission(p.key));
    if (!q) return assigned;
    return assigned.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        p.key.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }

  saveRoleRights(): void {
    if (!this.selectedRoleId) return;

    this.isSavingRoleRights = true;
    const permissions = Array.from(this.checkedPermissionKeys);

    this.teamService
      .assignRoleRights({
        role_id: this.selectedRoleId,
        permissions
      })
      .subscribe({
        next: (res) => {
          this.isSavingRoleRights = false;
          const role = this.allRoles.find((r) => r.role === this.selectedRoleId);
          if (role) {
            role.permissions = permissions;
          }
          this.confirmationService.success(res.message, 'Droits enregistrés !');
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isSavingRoleRights = false;
          this.confirmationService.error(
            err?.error?.message || 'Erreur lors de l\'enregistrement des droits.',
            'Erreur'
          );
          this.cdr.detectChanges();
        }
      });
  }

  openCreateRoleModal(): void {
    this.newRole = {
      name: '',
      description: '',
      permissions: []
    };
    this.showCreateRoleModal = true;
  }

  closeCreateRoleModal(): void {
    this.showCreateRoleModal = false;
  }

  toggleNewRolePermission(permKey: string): void {
    const idx = this.newRole.permissions.indexOf(permKey);
    if (idx > -1) {
      this.newRole.permissions.splice(idx, 1);
    } else {
      this.newRole.permissions.push(permKey);
    }
  }

  saveCustomRole(): void {
    if (!this.newRole.name.trim()) {
      this.confirmationService.error('Veuillez renseigner un nom pour le rôle.', 'Nom requis');
      return;
    }
    if (this.newRole.permissions.length === 0) {
      this.confirmationService.error('Veuillez sélectionner au moins un droit.', 'Droits requis');
      return;
    }

    this.isSavingNewRole = true;
    this.teamService.createCustomRole(this.newRole).subscribe({
      next: (res) => {
        this.isSavingNewRole = false;
        this.closeCreateRoleModal();
        this.loadTeam();
        this.confirmationService.success(res.message, 'Rôle créé !');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSavingNewRole = false;
        this.confirmationService.error(err?.error?.message || 'Erreur lors de la création du rôle.', 'Erreur');
        this.cdr.detectChanges();
      }
    });
  }

  async deleteRole(roleId: string, roleName: string): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: `Supprimer le rôle "${roleName}" ?`,
      text: `Êtes-vous sûr de vouloir supprimer ce rôle personnalisé ?`,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      icon: 'warning'
    });

    if (confirmed) {
      this.teamService.deleteCustomRole(roleId).subscribe({
        next: (res) => {
          this.loadTeam();
          this.confirmationService.success('Le rôle a été supprimé.', 'Rôle supprimé');
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.confirmationService.error(err?.error?.message || 'Erreur lors de la suppression.', 'Erreur');
        }
      });
    }
  }

  openEditRoleModal(role: any): void {
    this.editRoleForm = {
      id: role.role,
      name: role.label,
      description: role.description || '',
      permissions: [...role.permissions]
    };
    this.showEditRoleModal = true;
  }

  closeEditRoleModal(): void {
    this.showEditRoleModal = false;
  }

  toggleEditRolePermission(permKey: string): void {
    const idx = this.editRoleForm.permissions.indexOf(permKey);
    if (idx > -1) {
      this.editRoleForm.permissions.splice(idx, 1);
    } else {
      this.editRoleForm.permissions.push(permKey);
    }
  }

  saveUpdatedCustomRole(): void {
    if (!this.editRoleForm.name.trim()) {
      this.confirmationService.error('Veuillez renseigner un nom pour le rôle.', 'Nom requis');
      return;
    }
    this.isSavingEditRole = true;
    this.teamService
      .updateCustomRole(this.editRoleForm.id, {
        name: this.editRoleForm.name,
        description: this.editRoleForm.description,
        permissions: this.editRoleForm.permissions
      })
      .subscribe({
        next: (res) => {
          this.isSavingEditRole = false;
          this.closeEditRoleModal();
          this.loadTeam();
          this.confirmationService.success(res.message, 'Rôle mis à jour !');
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isSavingEditRole = false;
          this.confirmationService.error(
            err?.error?.message || 'Erreur lors de la mise à jour du rôle.',
            'Erreur'
          );
          this.cdr.detectChanges();
        }
      });
  }

  getMembersCountForRole(roleKey: string): number {
    return this.teamMembers.filter((m) => m.role === roleKey).length;
  }

  getRolesWithPermission(permKey: string): string[] {
    return this.allRoles.filter((r) => r.permissions.includes(permKey)).map((r) => r.label);
  }

  switchToAssignRole(roleKey: string): void {
    this.selectRole(roleKey);
    this.teamSubTab = 'assign';
  }

  get cataloguePermissions(): PermissionDefinition[] {
    let list = this.availablePermissions;
    if (this.permissionGroupFilter !== 'all') {
      list = list.filter((p) => p.group?.toLowerCase().includes(this.permissionGroupFilter.toLowerCase()));
    }
    const q = this.searchCataloguePermissions.toLowerCase().trim();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        p.key.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.group.toLowerCase().includes(q)
    );
  }

  get permissionGroups(): string[] {
    const groups = new Set<string>();
    this.availablePermissions.forEach((p) => {
      if (p.group) groups.add(p.group);
    });
    return Array.from(groups);
  }

  openAddMemberModal(): void {
    this.newMember = {
      name: '',
      email: '',
      phone: '',
      role: 'receptionist',
      permissions: [],
      password: ''
    };
    this.onNewMemberRoleChange('receptionist');
    this.showAddMemberModal = true;
  }

  closeAddMemberModal(): void {
    this.showAddMemberModal = false;
  }

  onNewMemberRoleChange(role: string): void {
    this.newMember.role = role;
    if (role !== 'custom') {
      const found = this.allRoles.find((r) => r.role === role);
      this.newMember.permissions = found ? [...found.permissions] : [];
    }
  }

  toggleNewMemberPermission(permKey: string): void {
    const idx = this.newMember.permissions.indexOf(permKey);
    if (idx > -1) {
      this.newMember.permissions.splice(idx, 1);
    } else {
      this.newMember.permissions.push(permKey);
    }
  }

  isNewMemberPermissionSelected(permKey: string): boolean {
    return this.newMember.permissions.includes(permKey);
  }

  saveNewMember(): void {
    if (!this.newMember.name || !this.newMember.email) {
      this.confirmationService.error('Veuillez renseigner le nom et l\'email du collaborateur.', 'Champs requis');
      return;
    }

    this.isSavingMember = true;
    this.teamService.addCollaborator(this.newMember).subscribe({
      next: (res) => {
        this.isSavingMember = false;
        this.teamMembers.push(res.collaborator);
        this.closeAddMemberModal();
        this.confirmationService.success(res.message, 'Membre ajouté !');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSavingMember = false;
        this.confirmationService.error(err?.error?.message || 'Erreur lors de l\'ajout du membre.', 'Erreur');
        this.cdr.detectChanges();
      }
    });
  }

  openEditMemberModal(member: TeamMember): void {
    if (member.is_primary) {
      return;
    }
    this.selectedMember = member;
    this.editMemberForm = {
      role: member.role,
      permissions: [...member.permissions],
      is_active: member.is_active
    };
    this.showEditMemberModal = true;
  }

  closeEditMemberModal(): void {
    this.showEditMemberModal = false;
    this.selectedMember = null;
  }

  onEditMemberRoleChange(role: string): void {
    this.editMemberForm.role = role;
    if (role !== 'custom') {
      const found = this.allRoles.find((r) => r.role === role);
      this.editMemberForm.permissions = found ? [...found.permissions] : [];
    }
  }

  toggleEditMemberPermission(permKey: string): void {
    const idx = this.editMemberForm.permissions.indexOf(permKey);
    if (idx > -1) {
      this.editMemberForm.permissions.splice(idx, 1);
    } else {
      this.editMemberForm.permissions.push(permKey);
    }
  }

  isEditMemberPermissionSelected(permKey: string): boolean {
    return this.editMemberForm.permissions.includes(permKey);
  }

  saveEditMember(): void {
    if (!this.selectedMember) return;

    this.isSavingMember = true;
    this.teamService
      .updateCollaborator(this.selectedMember.id, {
        role: this.editMemberForm.role,
        permissions: this.editMemberForm.permissions,
        is_active: this.editMemberForm.is_active
      })
      .subscribe({
        next: (res) => {
          this.isSavingMember = false;
          const idx = this.teamMembers.findIndex((m) => m.id === this.selectedMember!.id);
          if (idx > -1) {
            this.teamMembers[idx] = res.collaborator;
          }
          this.closeEditMemberModal();
          this.confirmationService.success(res.message, 'Droits mis à jour !');
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isSavingMember = false;
          this.confirmationService.error(err?.error?.message || 'Erreur de mise à jour.', 'Erreur');
          this.cdr.detectChanges();
        }
      });
  }

  toggleMemberStatus(member: TeamMember): void {
    if (member.is_primary) return;

    const newStatus = !member.is_active;
    this.teamService.updateCollaborator(member.id, { is_active: newStatus }).subscribe({
      next: (res) => {
        member.is_active = res.collaborator.is_active;
        this.confirmationService.toast(
          `Accès de ${member.name} ${newStatus ? 'activé' : 'suspendu'}.`,
          newStatus ? 'success' : 'warning'
        );
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.confirmationService.error('Impossible de modifier le statut.', 'Erreur');
      }
    });
  }

  async removeMember(member: TeamMember): Promise<void> {
    if (member.is_primary) return;

    const confirmed = await this.confirmationService.confirm({
      title: `Retirer ${member.name} ?`,
      text: `Êtes-vous sûr de vouloir retirer ce collaborateur de votre complexe ? Il n'aura plus accès aux outils de gestion.`,
      confirmButtonText: 'Oui, retirer',
      cancelButtonText: 'Annuler',
      icon: 'warning'
    });

    if (confirmed) {
      this.teamService.removeCollaborator(member.id).subscribe({
        next: (res) => {
          this.teamMembers = this.teamMembers.filter((m) => m.id !== member.id);
          this.confirmationService.success(res.message, 'Membre retiré');
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.confirmationService.error(err?.error?.message || 'Erreur lors de la suppression.', 'Erreur');
        }
      });
    }
  }

  getRoleBadgeClass(role: string): string {
    return matchRoleBadge(role);
  }
}

function matchRoleBadge(role: string): string {
  switch (role) {
    case 'owner_master':
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30';
    case 'manager':
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
    case 'receptionist':
      return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30';
    case 'field_staff':
      return 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30';
    case 'accountant':
      return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30';
    case 'custom':
      return 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
}
