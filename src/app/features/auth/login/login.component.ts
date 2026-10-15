import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { formatApiError } from '../../../core/utils/error-formatter';
import { DarkModeToggleComponent } from '../../../shared/components/dark-mode-toggle/dark-mode-toggle.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, DarkModeToggleComponent],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  credentials = { email: '', password: '' };
  error = '';
  isLoading = false;
  showPassword = false;

  constructor(private authService: AuthService, private router: Router) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (!this.credentials.email || !this.credentials.password) {
      this.error = 'Veuillez saisir votre adresse email et votre mot de passe.';
      return;
    }

    this.isLoading = true;
    this.error = '';

    // Nettoyer d'anciens jetons expirés avant de se reconnecter
    localStorage.removeItem('token');

    this.authService.login(this.credentials).subscribe({
      next: (res) => {
        if (res.user.role === 'admin') {
          this.router.navigate(['/admin/dashboard']);
        } else if (res.user.role === 'owner') {
          this.router.navigate(['/dashboard']);
        } else {
          this.error = 'Accès réservé aux partenaires loueurs et administrateurs.';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = formatApiError(err);
        this.isLoading = false;
      }
    });
  }
}
