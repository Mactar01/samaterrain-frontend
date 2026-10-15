import { Injectable, inject } from '@angular/core';
import Swal from 'sweetalert2';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  private toastService = inject(ToastService);

  private defaultOptions = {
    confirmButtonText: 'Confirmer',
    cancelButtonText: 'Annuler',
    confirmButtonColor: '#16a34a', // green-600
    cancelButtonColor: '#f3f4f6',
    reverseButtons: true,
    showCancelButton: true,
    showCloseButton: true
  };

  async confirm(options: {
    title: string;
    text?: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    confirmButtonColor?: string;
    cancelButtonColor?: string;
  }): Promise<boolean> {
    const result = await Swal.fire({
      ...this.defaultOptions,
      ...options,
      showClass: {
        popup: 'swal2-show',
        backdrop: 'swal2-backdrop-show',
        icon: 'swal2-icon-show'
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
