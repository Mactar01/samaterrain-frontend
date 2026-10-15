import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-dark-mode-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      (click)="themeService.toggle()"
      type="button"
      [title]="themeService.isDark() ? 'Passer en mode clair' : 'Passer en mode sombre'"
      class="p-2 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-green-500"
      aria-label="Basculer le mode sombre">
      @if (themeService.isDark()) {
        <!-- Sun icon (Light mode trigger) -->
        <svg class="w-5 h-5 text-amber-400 transition-transform duration-300 transform rotate-0 hover:rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="5" stroke-width="2" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      } @else {
        <!-- Moon icon (Dark mode trigger) -->
        <svg class="w-5 h-5 text-slate-600 transition-transform duration-300 transform -rotate-12 hover:rotate-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      }
    </button>
  `
})
export class DarkModeToggleComponent {
  readonly themeService = inject(ThemeService);
}
