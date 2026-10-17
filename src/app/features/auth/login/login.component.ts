import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { formatApiError } from '../../../core/utils/error-formatter';
import { DarkModeToggleComponent } from '../../../shared/components/dark-mode-toggle/dark-mode-toggle.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, DarkModeToggleComponent],
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
  credentials = { email: '', password: '' };
  error = '';
  isLoading = false;
  showPassword = false;
  currentYear = new Date().getFullYear();
  showContactModal = false;
  copiedField: string | null = null;
  adminContact = {
    name: 'Super Administrateur myTerrain',
    email: 'admin@myterrain.sn',
    phone: '+221770000000'
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['error'] === 'blocked') {
        this.error = "Votre compte a été suspendu ou bloqué par l'administrateur. Veuillez contacter le support.";
      }
    });
  }

  openContactModal() {
    this.showContactModal = true;
    this.authService.getAdminContact().subscribe(contact => {
      if (contact) {
        this.adminContact = contact;
      }
    });
  }

  closeContactModal() {
    this.showContactModal = false;
  }

  copyToClipboard(text: string, field: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      this.copiedField = field;
      setTimeout(() => {
        this.copiedField = null;
      }, 2000);
    }
  }

  getWhatsAppLink(phone: string): string {
    const clean = phone.replace(/[^0-9]/g, '');
    const standard = clean.startsWith('221') ? clean : `221${clean}`;
    const text = encodeURIComponent("Bonjour, je suis gérant d'un complexe sportif et je souhaiterais obtenir une invitation pour rejoindre la plateforme myTerrain.");
    return `https://wa.me/${standard}?text=${text}`;
  }

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

    this.authService.login(this.credentials).subscribe({
      next: (res) => {
        // Bloquer immédiatement si le compte est inactif ou désactivé
        if (res.user && res.user.is_active === false) {
          this.authService.clearSession();
          this.error = "Votre compte a été bloqué ou désactivé par l'administrateur. Veuillez contacter le support.";
          this.isLoading = false;
          return;
        }

        if (res.user.role === 'admin') {
          this.router.navigate(['/admin/dashboard']);
        } else if (res.user.role === 'owner') {
          if (res.user.must_change_password) {
            this.router.navigate(['/update-password']);
          } else {
            this.router.navigate(['/dashboard']);
          }
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
