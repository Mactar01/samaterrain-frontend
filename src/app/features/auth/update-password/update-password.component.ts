import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { formatApiError } from '../../../core/utils/error-formatter';
import { DarkModeToggleComponent } from '../../../shared/components/dark-mode-toggle/dark-mode-toggle.component';

@Component({
  selector: 'app-update-password',
  standalone: true,
  imports: [CommonModule, FormsModule, DarkModeToggleComponent],
  templateUrl: './update-password.component.html'
})
export class UpdatePasswordComponent implements OnInit {
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  isLoading = false;
  error = '';
  success = '';
  userName = '';
  businessName = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.userName = user.name;
    }
  }

  toggleCurrentPassword() {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPassword() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit() {
    this.error = '';

    if (!this.currentPassword) {
      this.error = 'Veuillez renseigner votre mot de passe temporaire actuel.';
      return;
    }

    if (!this.newPassword || this.newPassword.length < 8) {
      this.error = 'Le nouveau mot de passe doit comporter au moins 8 caractères.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Les deux nouveaux mots de passe ne correspondent pas.';
      return;
    }

    if (this.newPassword === this.currentPassword) {
      this.error = 'Le nouveau mot de passe doit être différent du mot de passe temporaire.';
      return;
    }

    this.isLoading = true;

    const payload = {
      current_password: this.currentPassword,
      new_password: this.newPassword,
      new_password_confirmation: this.confirmPassword
    };

    this.authService.updateProfile(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        // Mettre à jour l'utilisateur local avec must_change_password à false
        const currentUser = this.authService.currentUserValue;
        if (currentUser) {
          currentUser.must_change_password = false;
          const token = this.authService.getToken() || '';
          this.authService.saveSession(token, currentUser);
        }

        this.success = 'Votre mot de passe a été sécurisé avec succès ! Redirection vers votre espace Loueur...';
        this.toastService.success('Bienvenue ! Votre mot de passe a été mis à jour.');

        // Redirection vers l'espace Loueur Partenaire
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1200);
      },
      error: (err) => {
        this.isLoading = false;
        this.error = formatApiError(err);
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
