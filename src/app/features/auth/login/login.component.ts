import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  credentials = { email: '', password: '' };
  error = '';
  isLoading = false;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.isLoading = true;
    this.error = '';
    // Vider le token périmé avant de tenter une connexion
    localStorage.removeItem('token');
    this.authService.login(this.credentials).subscribe({
        next: (res) => {
          if (res.user.role === 'admin') {
              this.router.navigate(['/admin-dashboard']);
            } else if (res.user.role === 'owner') {
              this.router.navigate(['/dashboard']);
            } else {
            this.error = 'Accès réservé aux loueurs et administrateurs.';
          }
          this.isLoading = false;
        },
      error: (err) => {
        this.error = err?.error?.message || err?.error?.errors?.email?.[0] || 'Identifiants incorrects.';
        this.isLoading = false;
      }
    });
  }
}
