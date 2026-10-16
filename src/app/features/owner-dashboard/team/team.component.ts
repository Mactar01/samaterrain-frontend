import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { OwnerTeamService } from '../../../core/services/owner-team.service';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { DarkModeToggleComponent } from '../../../shared/components/dark-mode-toggle/dark-mode-toggle.component';
import { NotificationBellComponent } from '../../../shared/components/notification-bell/notification-bell.component';
import {
  TeamMember,
  PermissionDefinition,
  RoleDefinition,
  CustomRole,
  PermissionsMatrixResponse,
  CollaboratorAdditionalInfo
} from '../../../core/models/owner-team.model';
import { OwnerBranding } from '../../../core/models/branding.model';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-owner-team',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DarkModeToggleComponent,
    NotificationBellComponent
  ],
  templateUrl: './team.component.html'
})
export class OwnerTeamComponent implements OnInit {
  user: User | null = null;
  businessName = '';

  get branding(): OwnerBranding {
    return this.themeService.currentBranding();
  }

  // Active navigation tab within Team Management:
  // 'members' = Profils / Utilisateurs
  // 'roles' = Rôles
  // 'permissions' = Droits & Catalogue
  // 'assign' = Assigner Droit
  activeTab: 'members' | 'roles' | 'permissions' | 'assign' = 'members';

  // Team & Permissions Data
  teamMembers: TeamMember[] = [];
  availablePermissions: PermissionDefinition[] = [];
  defaultRoles: RoleDefinition[] = [];
  customRoles: CustomRole[] = [];
  allRoles: { role: string; label: string; description: string; permissions: string[]; is_system?: boolean; is_custom?: boolean }[] = [];
  isLoading = true;

  // Search & Filter in Members
  searchMemberQuery = '';
  memberStatusFilter: 'all' | 'active' | 'inactive' | 'incomplete' = 'all';

  // Subtab 'assign' state
  selectedRoleId: string = 'manager';
  checkedPermissionKeys: Set<string> = new Set();
  searchAllPermissions: string = '';
  searchRolePermissions: string = '';
  isSavingRoleRights = false;

  // Subtab 'permissions' (catalogue) state
  searchCataloguePermissions: string = '';
  permissionGroupFilter: string = 'all';

  // Modal 1: Add Member (Wizard avec Étapes 1 et 2, boutons Retour et Suivant)
  showAddMemberModal = false;
  addMemberStep: 1 | 2 = 1;
  isSavingMember = false;
  newMember = {
    name: '',
    email: '',
    phone: '',
    role: 'receptionist',
    permissions: [] as string[],
    password: ''
  };

  // Modal 2: Additional Info (Fiche Collaborateur existant en consultation / modification)
  showAdditionalInfoModal = false;
  isSavingAdditionalInfo = false;
  selectedMemberForInfo: TeamMember | null = null;
  additionalInfoForm: CollaboratorAdditionalInfo = {
    cni_number: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    job_title: '',
    hire_date: '',
    notes: '',
    profile_completed: false
  };

  // Modal 3: Edit Member (Role & Rights)
  showEditMemberModal = false;
  selectedMember: TeamMember | null = null;
  editMemberForm = {
    role: '',
    permissions: [] as string[],
    is_active: true
  };

  // Modal 4: Create Custom Role
  showCreateRoleModal = false;
  isSavingNewRole = false;
  newRole = {
    name: '',
    description: '',
    permissions: [] as string[]
  };

  // Modal 5: Edit Custom Role
  showEditRoleModal = false;
  isSavingEditRole = false;
  editRoleForm = {
    id: '',
    name: '',
    description: '',
    permissions: [] as string[]
  };

  // Modal 6: View Member Permissions
  showPermissionsModal = false;
  memberForPermissionsView: TeamMember | null = null;

  constructor(
    private teamService: OwnerTeamService,
    private authService: AuthService,
    private themeService: ThemeService,
    private confirmationService: ConfirmationService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe((user) => {
      this.user = user;
      if (user?.id) {
        this.themeService.initBranding(user.id);
      }
    });

    this.route.queryParams.subscribe((params) => {
      if (params['sub'] && ['members', 'roles', 'permissions', 'assign'].includes(params['sub'])) {
        this.activeTab = params['sub'] as any;
      }
      if (params['role']) {
        this.selectedRoleId = params['role'];
      }
    });

    this.loadTeamData();
  }

  setTab(tab: 'members' | 'roles' | 'permissions' | 'assign'): void {
    this.activeTab = tab;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sub: tab },
      queryParamsHandling: 'merge'
    });
  }

  loadTeamData(): void {
    this.isLoading = true;

    this.teamService.getPermissionsMatrix().subscribe({
      next: (matrix) => {
        this.availablePermissions = matrix.available_permissions;
        this.buildAllRoles(matrix);

        this.teamService.getTeamMembers().subscribe({
          next: (res) => {
            this.businessName = res.owner?.business_name || '';
            this.teamMembers = res.members;
            this.isLoading = false;
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Erreur chargement équipe', err);
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('Erreur chargement permissions', err);
        this.isLoading = false;
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

  // =========================================================================
  // Members List Filtering & Stats
  // =========================================================================

  get filteredMembers(): TeamMember[] {
    let list = this.teamMembers;

    if (this.memberStatusFilter === 'active') {
      list = list.filter((m) => m.is_active);
    } else if (this.memberStatusFilter === 'inactive') {
      list = list.filter((m) => !m.is_active);
    } else if (this.memberStatusFilter === 'incomplete') {
      list = list.filter((m) => !m.is_primary && (!m.additional_info?.cni_number || !m.additional_info?.profile_completed));
    }

    const q = this.searchMemberQuery.toLowerCase().trim();
    if (!q) return list;

    return list.filter((m) => {
      const matchName = m.name?.toLowerCase().includes(q);
      const matchEmail = m.email?.toLowerCase().includes(q);
      const matchPhone = m.phone?.toLowerCase().includes(q);
      const matchRole = m.role_label?.toLowerCase().includes(q);
      const matchCni = m.additional_info?.cni_number?.toLowerCase().includes(q);
      const matchJob = m.additional_info?.job_title?.toLowerCase().includes(q);
      return matchName || matchEmail || matchPhone || matchRole || matchCni || matchJob;
    });
  }

  get totalMembersCount(): number {
    return this.teamMembers.length;
  }

  get activeMembersCount(): number {
    return this.teamMembers.filter((m) => m.is_active).length;
  }

  get incompleteProfilesCount(): number {
    return this.teamMembers.filter((m) => !m.is_primary && (!m.additional_info?.cni_number || !m.additional_info?.profile_completed)).length;
  }

  isProfileCompleted(member: TeamMember): boolean {
    if (member.is_primary) return true;
    return !!(member.additional_info?.cni_number && member.additional_info?.job_title);
  }

  // =========================================================================
  // Modal 1 : Add Member (Step 1)
  // =========================================================================

  openAddMemberModal(): void {
    this.addMemberStep = 1;
    this.newMember = {
      name: '',
      email: '',
      phone: '',
      role: 'receptionist',
      permissions: [],
      password: ''
    };
    this.additionalInfoForm = {
      cni_number: '',
      address: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      job_title: '',
      hire_date: '',
      notes: '',
      profile_completed: false
    };
    this.onNewMemberRoleChange('receptionist');
    this.showAddMemberModal = true;
  }

  closeAddMemberModal(): void {
    this.showAddMemberModal = false;
    this.addMemberStep = 1;
  }

  nextAddMemberStep(): void {
    if (!this.newMember.name?.trim()) {
      this.confirmationService.error('Veuillez renseigner le nom complet du collaborateur.', 'Nom requis');
      return;
    }
    if (!this.newMember.email?.trim()) {
      this.confirmationService.error('Veuillez renseigner l\'email de connexion du collaborateur.', 'Email requis');
      return;
    }

    // Pré-remplir l'intitulé de poste par le libellé du rôle si non personnalisé
    if (!this.additionalInfoForm.job_title) {
      const foundRole = this.allRoles.find((r) => r.role === this.newMember.role);
      this.additionalInfoForm.job_title = foundRole?.label || '';
    }

    this.addMemberStep = 2;
  }

  prevAddMemberStep(): void {
    this.addMemberStep = 1;
  }

  onNewMemberRoleChange(role: string): void {
    this.newMember.role = role;
    if (role !== 'custom') {
      const found = this.allRoles.find((r) => r.role === role);
      this.newMember.permissions = found ? [...found.permissions] : [];
    }
    if (!this.additionalInfoForm.job_title) {
      const foundRole = this.allRoles.find((r) => r.role === role);
      if (foundRole) {
        this.additionalInfoForm.job_title = foundRole.label;
      }
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

  submitNewMember(withAdditionalInfo: boolean = true): void {
    if (!this.newMember.name?.trim() || !this.newMember.email?.trim()) {
      this.addMemberStep = 1;
      this.confirmationService.error('Veuillez renseigner au minimum le nom et l\'email du collaborateur.', 'Champs requis');
      return;
    }

    this.isSavingMember = true;
    const payload = {
      ...this.newMember,
      additional_info: withAdditionalInfo ? {
        ...this.additionalInfoForm,
        profile_completed: !!(this.additionalInfoForm.cni_number && this.additionalInfoForm.job_title)
      } : undefined
    };

    this.teamService.addCollaborator(payload).subscribe({
      next: (res) => {
        this.isSavingMember = false;
        this.teamMembers.push(res.collaborator);
        this.closeAddMemberModal();
        this.confirmationService.success(res.message, 'Collaborateur ajouté !');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSavingMember = false;
        this.confirmationService.error(err?.error?.message || 'Erreur lors de l\'ajout du membre.', 'Erreur');
        this.cdr.detectChanges();
      }
    });
  }

  // =========================================================================
  // Modal 2 : Additional Info (Fiche Collaborateur existant)
  // =========================================================================

  openAdditionalInfoModal(member: TeamMember): void {
    this.selectedMemberForInfo = member;

    const info = member.additional_info || {};
    this.additionalInfoForm = {
      cni_number: info.cni_number || '',
      address: info.address || '',
      emergency_contact_name: info.emergency_contact_name || '',
      emergency_contact_phone: info.emergency_contact_phone || '',
      job_title: info.job_title || member.role_label || '',
      hire_date: info.hire_date || '',
      notes: info.notes || '',
      profile_completed: info.profile_completed || false
    };

    this.showAdditionalInfoModal = true;
  }

  closeAdditionalInfoModal(): void {
    this.showAdditionalInfoModal = false;
    this.selectedMemberForInfo = null;
  }

  saveAdditionalInfo(): void {
    if (!this.selectedMemberForInfo) return;

    this.isSavingAdditionalInfo = true;
    const payload: CollaboratorAdditionalInfo = {
      ...this.additionalInfoForm,
      profile_completed: !!(this.additionalInfoForm.cni_number && this.additionalInfoForm.job_title)
    };

    this.teamService.updateAdditionalInfo(this.selectedMemberForInfo.id, payload).subscribe({
      next: (res) => {
        this.isSavingAdditionalInfo = false;
        if (this.selectedMemberForInfo) {
          this.selectedMemberForInfo.additional_info = res.additional_info;
        }
        this.closeAdditionalInfoModal();
        this.confirmationService.success(res.message, 'Fiche collaborateur enregistrée');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSavingAdditionalInfo = false;
        this.confirmationService.error(err?.error?.message || 'Erreur lors de l\'enregistrement des informations complémentaires.', 'Erreur');
        this.cdr.detectChanges();
      }
    });
  }

  skipAdditionalInfo(): void {
    this.closeAdditionalInfoModal();
    this.confirmationService.toast(
      'Collaborateur ajouté. Les informations complémentaires pourront être renseignées plus tard.',
      'info'
    );
  }

  // =========================================================================
  // Modal 3 : Edit Member (Role & Permissions)
  // =========================================================================

  openEditMemberModal(member: TeamMember): void {
    if (member.is_primary) return;

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
      error: () => {
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

  // =========================================================================
  // Modal 6: View Member Permissions
  // =========================================================================

  openPermissionsModal(member: TeamMember): void {
    this.memberForPermissionsView = member;
    this.showPermissionsModal = true;
  }

  closePermissionsModal(): void {
    this.showPermissionsModal = false;
    this.memberForPermissionsView = null;
  }

  getPermissionDetail(key: string): PermissionDefinition | undefined {
    return this.availablePermissions.find((p) => p.key === key);
  }

  // =========================================================================
  // Subtab : Rôles & Assigner Droit
  // =========================================================================

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
        this.loadTeamData();
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
        next: () => {
          this.loadTeamData();
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
          this.loadTeamData();
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
    this.setTab('assign');
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
}
