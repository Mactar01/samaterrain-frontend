import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { formatApiError } from '../../../core/utils/error-formatter';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class AdminProfileComponent implements OnInit {
  profileForm!: FormGroup;
  isLoading = false;
  user: any = null;

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  isUploadingAvatar = false;
  avatarPreview: string | null = null;
  avatarFailed = false;
  successMessage = '';
  errorMessage = '';

  get avatarUrl(): string | null {
    if (this.avatarPreview) return this.avatarPreview;
    return this.authService.getAvatarUrl(this.user?.avatar);
  }

  getInitials(name?: string): string {
    if (!name) return 'A';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.email]],
      phone: [''],
      cni: [''],
      adresse: [''],
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
          email: user.email || '',
          phone: user.phone || '',
          cni: user.cni || '',
          adresse: user.adresse || ''
        });
      }
    });

    this.authService.fetchCurrentUser().subscribe();
  }

  onAvatarError(): void {
    this.avatarFailed = true;
  }

  private compressImage(file: File, maxWidth: number, maxHeight: number, quality = 0.88): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          let w = img.width, h = img.height;
          if (w > maxWidth || h > maxHeight) {
            const ratio = Math.min(maxWidth / w, maxHeight / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) { resolve(e.target.result); return; }
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.showError('Veuillez sélectionner un fichier image valide.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.showError('La photo ne doit pas dépasser 10 Mo.');
      return;
    }
    this.isUploadingAvatar = true;
    this.avatarFailed = false;
    this.compressImage(file, 500, 500, 0.88).then(base64Data => {
      this.avatarPreview = base64Data;
      this.authService.updateProfile({ avatar: base64Data }).subscribe({
        next: (res) => {
          this.isUploadingAvatar = false;
          if (res?.user) this.user = res.user;
          this.avatarPreview = null;
          this.showSuccess('Photo de profil mise à jour avec succès !');
        },
        error: (err) => {
          this.isUploadingAvatar = false;
          this.avatarPreview = null;
          this.showError(formatApiError(err));
        }
      });
    }).catch(() => {
      this.isUploadingAvatar = false;
      this.showError("Erreur lors du traitement de l'image.");
    });
    input.value = '';
  }

  removeAvatar(): void {
    this.isUploadingAvatar = true;
    this.avatarPreview = null;
    this.authService.updateProfile({ avatar: null }).subscribe({
      next: (res) => {
        this.isUploadingAvatar = false;
        if (res?.user) this.user = res.user;
        this.avatarFailed = false;
        this.showSuccess('Photo de profil supprimée.');
      },
      error: (err) => {
        this.isUploadingAvatar = false;
        this.showError(formatApiError(err));
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid) return;

    const v = this.profileForm.value;
    const data: any = { name: v.name, phone: v.phone, cni: v.cni, adresse: v.adresse };
    if (v.email) data.email = v.email;

    if (v.new_password) {
      if (v.new_password !== v.new_password_confirmation) {
        this.showError('Les mots de passe ne correspondent pas.');
        return;
      }
      if (!v.current_password) {
        this.showError('Le mot de passe actuel est requis pour le modifier.');
        return;
      }
      data.current_password = v.current_password;
      data.new_password = v.new_password;
      data.new_password_confirmation = v.new_password_confirmation;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.authService.updateProfile(data).subscribe({
      next: () => {
        this.isLoading = false;
        this.showSuccess('Profil mis à jour avec succès !');
        this.profileForm.patchValue({ current_password: '', new_password: '', new_password_confirmation: '' });
      },
      error: (err) => {
        this.isLoading = false;
        this.showError(formatApiError(err));
      }
    });
  }

  private showSuccess(msg: string): void {
    this.successMessage = msg;
    this.errorMessage = '';
    setTimeout(() => this.successMessage = '', 4000);
  }

  private showError(msg: string): void {
    this.errorMessage = msg;
    this.successMessage = '';
  }
}
