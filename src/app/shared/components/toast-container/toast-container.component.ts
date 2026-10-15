import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      aria-live="polite"
      aria-atomic="true">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto w-full bg-white rounded-xl shadow-xl border overflow-hidden transition-all duration-300 transform translate-y-0"
          [ngClass]="{
            'border-green-200 border-l-4 border-l-green-600': toast.type === 'success',
            'border-red-200 border-l-4 border-l-red-600': toast.type === 'error',
            'border-amber-200 border-l-4 border-l-amber-500': toast.type === 'warning',
            'border-blue-200 border-l-4 border-l-blue-600': toast.type === 'info'
          }">
          <div class="p-3.5 flex items-start gap-3">
            <!-- Icon -->
            <div class="flex-shrink-0 pt-0.5">
              @if (toast.type === 'success') {
                <div class="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              } @else if (toast.type === 'error') {
                <div class="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              } @else if (toast.type === 'warning') {
                <div class="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              } @else {
                <div class="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              }
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              @if (toast.title) {
                <p class="text-sm font-semibold text-gray-900 leading-tight">{{ toast.title }}</p>
              }
              <p class="text-xs sm:text-sm text-gray-600 mt-0.5 leading-normal break-words">{{ toast.message }}</p>
            </div>

            <!-- Close button -->
            <button
              (click)="removeToast(toast.id)"
              type="button"
              class="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1 rounded-md transition-colors"
              aria-label="Fermer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);

  removeToast(id: string) {
    this.toastService.remove(id);
  }
}
