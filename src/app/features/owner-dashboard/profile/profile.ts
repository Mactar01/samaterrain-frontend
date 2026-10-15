import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { ThemeService } from '../../../core/services/theme.service';
import { DarkModeToggleComponent } from '../../../shared/components/dark-mode-toggle/dark-mode-toggle.component';
import { formatApiError } from '../../../core/utils/error-formatter';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, DarkModeToggleComponent],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  isLoading = false;
  user: any = null;
  activeSection: 'all' | 'personal' | 'security' = 'all';

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  isUploadingAvatar = false;
  isUploadingCover = false;
  avatarPreview: string | null = null;
  avatarFailed = false;

  get avatarUrl(): string | null {
    if (this.avatarPreview) return this.avatarPreview;
    return this.authService.getAvatarUrl(this.user?.avatar);
  }

  get coverUrl(): string | null {
    const branding = this.themeService.currentBranding();
    return branding.coverUrl || branding.customBgUrl || null;
  }

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private confirmationService: ConfirmationService,
    private router: Router,
    public themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required]],
      phone: [''],
      current_password: [''],
      new_password: ['', [Validators.minLength(8)]],
      new_password_confirmation: ['']
    });

    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.user = user;
        this.avatarFailed = false;
        this.profileForm.patchValue({
          name: user.name,
          phone: user.phone || ''
        });
        this.themeService.initBranding(user.id);
      }
    });

    // Ensure we have the freshest user data from backend
    this.authService.fetchCurrentUser().subscribe();
  }

  onAvatarError(): void {
    this.avatarFailed = true;
  }

  getInitials(name?: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
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

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.confirmationService.toast('Veuillez sélectionner un fichier image valide.', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.confirmationService.toast('La photo de profil ne doit pas dépasser 10 Mo.', 'error');
      return;
    }

    this.isUploadingAvatar = true;
    this.avatarFailed = false;
    this.compressImage(file, 500, 500, 0.88).then(base64Data => {
      // Optimistic preview immediately so user sees the change
      this.avatarPreview = base64Data;

      this.authService.updateProfile({ avatar: base64Data }).subscribe({
        next: (res) => {
          this.isUploadingAvatar = false;
          if (res?.user) {
            this.user = res.user;
          }
          this.avatarPreview = null;
          this.confirmationService.toast('Photo de profil mise à jour avec succès !', 'success');
        },
        error: (err) => {
          this.isUploadingAvatar = false;
          this.avatarPreview = null;
          this.confirmationService.error(formatApiError(err));
        }
      });
    }).catch(() => {
      this.isUploadingAvatar = false;
      this.avatarPreview = null;
      this.confirmationService.toast('Erreur lors du traitement de l\'image.', 'error');
    });
    input.value = '';
  }

  removeAvatar(): void {
    if (!this.user?.avatar && !this.avatarPreview) return;
    this.isUploadingAvatar = true;
    this.avatarPreview = null;
    this.authService.updateProfile({ avatar: null }).subscribe({
      next: (res) => {
        this.isUploadingAvatar = false;
        if (res?.user) {
          this.user = res.user;
        }
        this.avatarFailed = false;
        this.confirmationService.toast('Photo de profil supprimée.', 'info');
      },
      error: (err) => {
        this.isUploadingAvatar = false;
        this.confirmationService.error(formatApiError(err));
      }
    });
  }

  onCoverSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.confirmationService.toast('Veuillez sélectionner un fichier image valide.', 'error');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      this.confirmationService.toast('La photo de couverture ne doit pas dépasser 15 Mo.', 'error');
      return;
    }

    this.isUploadingCover = true;
    this.compressImage(file, 1600, 600, 0.82).then(base64Data => {
      const current = this.themeService.currentBranding();
      const updated = {
        ...current,
        coverUrl: base64Data,
        customBgUrl: base64Data
      };
      this.themeService.saveBranding(updated, this.user?.id);
      this.isUploadingCover = false;
      this.confirmationService.toast('Photo de couverture mise à jour avec succès !', 'success');
    }).catch(() => {
      this.isUploadingCover = false;
      this.confirmationService.toast('Erreur lors du traitement de l\'image.', 'error');
    });
    input.value = '';
  }

  removeCover(): void {
    const current = this.themeService.currentBranding();
    const updated = {
      ...current,
      coverUrl: undefined,
      customBgUrl: undefined
    };
    this.themeService.saveBranding(updated, this.user?.id);
    this.confirmationService.toast('Photo de couverture réinitialisée.', 'info');
  }

  resetForm(): void {
    if (this.user) {
      this.profileForm.patchValue({
        name: this.user.name,
        phone: this.user.phone || '',
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
      });
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      return;
    }

    const formValues = this.profileForm.value;
    const data: any = {
      name: formValues.name,
      phone: formValues.phone
    };

    if (formValues.new_password) {
      if (formValues.new_password !== formValues.new_password_confirmation) {
        this.confirmationService.toast('Les mots de passe ne correspondent pas.', 'error');
        return;
      }
      if (!formValues.current_password) {
        this.confirmationService.toast('Le mot de passe actuel est requis pour le modifier.', 'error');
        return;
      }
      data.current_password = formValues.current_password;
      data.new_password = formValues.new_password;
      data.new_password_confirmation = formValues.new_password_confirmation;
    }

    this.isLoading = true;
    this.authService.updateProfile(data).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.confirmationService.toast('Profil mis à jour avec succès !', 'success');
        this.profileForm.patchValue({
          current_password: '',
          new_password: '',
          new_password_confirmation: ''
        });
      },
      error: (err) => {
        this.isLoading = false;
        const errMsg = formatApiError(err);
        this.confirmationService.error(errMsg);
      }
    });
  }
}
