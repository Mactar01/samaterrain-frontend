import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
      <div class="max-w-md w-full text-center">
        <!-- Logo -->
        <div class="inline-flex items-center gap-2 mb-8">
          <div class="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-600/30">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span class="text-2xl font-bold text-gray-900 tracking-tight">myTerrain</span>
        </div>

        <!-- 404 Illustration Badge -->
        <div class="relative mx-auto w-32 h-32 mb-6 flex items-center justify-center">
          <div class="absolute inset-0 bg-green-100 rounded-full animate-pulse opacity-75"></div>
          <div class="relative w-24 h-24 bg-white rounded-full shadow-md flex items-center justify-center border border-gray-100">
            <svg class="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke-width="2" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 9l-6 6M9 9l6 6" />
            </svg>
          </div>
        </div>

        <p class="text-sm font-semibold text-green-600 uppercase tracking-wider mb-2">Erreur 404</p>
        <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl mb-3">
          Hors du terrain !
        </h1>
        <p class="text-base text-gray-600 mb-8 leading-relaxed">
          La page que vous recherchez n'existe pas, a été déplacée ou son accès est restreint.
        </p>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            (click)="goToDashboard()"
            class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-green-600 hover:bg-green-700 shadow-md shadow-green-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Retour à l'accueil
          </button>
          
          <button
            (click)="goBack()"
            class="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Page précédente
          </button>
        </div>

        <p class="mt-8 text-xs text-gray-400">
          Besoin d'aide ? Contactez le support technique myTerrain.
        </p>
      </div>
    </div>
  `
})
export class NotFoundComponent {
  constructor(private router: Router, private authService: AuthService) {}

  goToDashboard() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    const role = this.authService.getUserRole();
    if (role === 'admin') {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  goBack() {
    window.history.back();
  }
}
