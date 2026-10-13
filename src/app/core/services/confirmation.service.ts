import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
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

  success(message: string, title: string = 'Succès'): Promise<any> {
    return Swal.fire({
      title: `<h2 class="text-2xl font-bold text-gray-800">${title}</h2>`,
      html: `<p class="text-lg text-gray-600 mt-2">${message}</p>`,
      icon: 'success',
      timer: 3000,
      timerProgressBar: true,
      showConfirmButton: false,
      position: 'center',
      customClass: {
        popup: 'rounded-2xl shadow-xl border border-gray-100',
      }
    });
  }

  error(message: string, title: string = 'Erreur'): Promise<any> {
    return Swal.fire({
      title: `<h2 class="text-2xl font-bold text-gray-800">${title}</h2>`,
      html: `<p class="text-lg text-gray-600 mt-2">${message}</p>`,
      icon: 'error',
      timer: 4000,
      timerProgressBar: true,
      showConfirmButton: false,
      position: 'center',
      customClass: {
        popup: 'rounded-2xl shadow-xl border border-gray-100',
      }
    });
  }

  toast(message: string, icon: 'success'|'error'|'info'|'warning' = 'success'): Promise<any> {
    return Swal.fire({
      html: `<p class="text-lg font-medium text-gray-800 text-center m-0">${message}</p>`,
      icon: icon,
      position: 'center',
      toast: false,
      showConfirmButton: false,
      timer: 3500,
      timerProgressBar: true,
      width: '400px',
      customClass: {
        popup: 'rounded-2xl shadow-2xl border border-gray-100 py-6',
      }
    });
  }
}
