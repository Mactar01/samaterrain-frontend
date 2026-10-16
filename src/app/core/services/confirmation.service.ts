import { Injectable, inject } from '@angular/core';
import Swal from 'sweetalert2';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  private toastService = inject(ToastService);

  async confirm(options: {
    title: string;
    text?: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    confirmButtonColor?: string;
    cancelButtonColor?: string;
    icon?: 'warning' | 'danger' | 'info' | 'question';
  }): Promise<boolean> {
    const isDanger = !options.confirmButtonColor || 
      options.confirmButtonColor.includes('ef4444') || 
      options.confirmButtonColor.includes('red') || 
      options.confirmButtonColor.includes('rose') ||
      options.title.toLowerCase().includes('supprim');

    const iconHtml = isDanger ? `
      <div class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-sm animate-scale-up">
        <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </div>
    ` : `
      <div class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm animate-scale-up">
        <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    `;

    const bodyHtml = `
      ${iconHtml}
      <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">${options.title}</h3>
      ${options.text ? `<p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed px-2">${options.text}</p>` : ''}
    `;

    const result = await Swal.fire({
      html: bodyHtml,
      showCancelButton: true,
      confirmButtonText: options.confirmButtonText || (isDanger ? 'Supprimer' : 'Confirmer'),
      cancelButtonText: options.cancelButtonText || 'Annuler',
      buttonsStyling: false,
      reverseButtons: true,
      showCloseButton: true,
      focusCancel: true,
      customClass: {
        popup: '!rounded-3xl !p-6 !bg-white dark:!bg-slate-900 !border !border-slate-200/90 dark:!border-slate-800 !shadow-2xl !max-w-sm !w-full transition-all animate-scale-up',
        htmlContainer: '!m-0 !p-0',
        actions: 'flex items-center justify-center gap-3 w-full mt-6 !m-0 !p-0',
        confirmButton: isDanger 
          ? 'flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-md shadow-rose-500/25 active:scale-95 transition-all cursor-pointer'
          : 'flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-md shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer',
        cancelButton: 'flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer',
        closeButton: '!text-slate-400 hover:!text-slate-600 dark:hover:!text-slate-200 !top-4 !right-4 focus:!outline-none'
      }
    });

    return result.isConfirmed;
  }

  success(message: string, title = 'Succès') {
    this.toastService.success(message, title);
  }

  error(message: string, title = 'Erreur') {
    this.toastService.error(message, title);
  }

  toast(message: string, icon: 'success' | 'error' | 'info' | 'warning' = 'success') {
    this.toastService.show(icon, message);
  }
}
