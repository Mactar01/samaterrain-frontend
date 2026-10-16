import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService, AppNotification } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="relative">
      <!-- Bouton Cloche de Notification -->
      <button
        (click)="toggleDropdown($event)"
        type="button"
        title="Notifications"
        class="relative p-2 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
        aria-label="Voir les notifications">
        
        <!-- Icône Cloche -->
        <svg class="w-5 h-5 transition-transform duration-200" [ngClass]="{'rotate-12': unreadCount() > 0}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        <!-- Pastille Badge Non Lu avec Animation Pulse -->
        @if (unreadCount() > 0) {
          <span class="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span class="relative inline-flex items-center justify-center rounded-full h-4 min-w-[16px] px-1 text-[9px] font-extrabold text-white bg-gradient-to-r from-red-600 to-rose-600 shadow-xs">
              {{ unreadCount() > 9 ? '9+' : unreadCount() }}
            </span>
          </span>
        }
      </button>

      <!-- Dropdown des Notifications -->
      @if (isOpen()) {
        <div
          (click)="$event.stopPropagation()"
          class="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-50 animate-scale-up">
          
          <!-- En-tête du Dropdown -->
          <div class="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold text-slate-900 dark:text-white">Notifications</span>
              @if (unreadCount() > 0) {
                <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-700 dark:bg-rose-950/60 dark:text-rose-300">
                  {{ unreadCount() }} nouvelle{{ unreadCount() > 1 ? 's' : '' }}
                </span>
              }
            </div>

            <div class="flex items-center gap-2">
              <button
                (click)="playTestSound()"
                type="button"
                title="Tester le son"
                class="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition">
                🔔
              </button>
              @if (unreadCount() > 0) {
                <button
                  (click)="markAllAsRead()"
                  type="button"
                  class="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition cursor-pointer">
                  Tout marquer comme lu
                </button>
              }
            </div>
          </div>

          <!-- Liste des Notifications -->
          <div class="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 custom-scrollbar">
            @if (notifications().length === 0) {
              <div class="py-12 px-6 text-center">
                <div class="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p class="text-xs font-semibold text-slate-700 dark:text-slate-300">Aucune notification</p>
                <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Vous serez notifié dès qu'une réservation sera effectuée.</p>
              </div>
            } @else {
              @for (notif of notifications(); track notif.id) {
                <div
                  (click)="onNotificationClick(notif)"
                  class="p-4 flex gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer relative"
                  [ngClass]="{'bg-emerald-50/30 dark:bg-emerald-950/10': !notif.read_at}">
                  
                  <!-- Icône de type Réservation -->
                  <div class="w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center text-emerald-600 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/50">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>

                  <!-- Contenu de la notification -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-1">
                      <p class="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {{ notif.data.player_name || 'Nouvelle réservation' }}
                      </p>
                      <span class="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 font-medium">
                        {{ notif.data.creation_time || formatTime(notif.created_at) }}
                      </span>
                    </div>

                    <!-- Détail du terrain & horaire -->
                    <p class="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium truncate">
                      ⚽ {{ notif.data.field_name || 'Terrain' }}
                      @if (notif.data.field_location) {
                        <span class="text-slate-400 dark:text-slate-500">({{ notif.data.field_location }})</span>
                      }
                    </p>

                    <div class="flex items-center gap-2 mt-1.5 text-[11px] font-semibold">
                      <span class="text-slate-500 dark:text-slate-400">
                        📅 {{ notif.data.date }} {{ notif.data.time ? 'à ' + notif.data.time : '' }}
                      </span>
                      @if (notif.data.deposit || notif.data.amount) {
                        <span class="text-emerald-600 dark:text-emerald-400 font-bold ml-auto">
                          {{ (notif.data.deposit || notif.data.amount) | number }} FCFA
                        </span>
                      }
                    </div>
                  </div>

                  <!-- Point bleu indiquant Non Lu -->
                  @if (!notif.read_at) {
                    <span class="w-2 h-2 rounded-full bg-emerald-500 shrink-0 self-center"></span>
                  }
                </div>
              }
            }
          </div>

          <!-- Pied du Dropdown -->
          <div class="p-3 bg-slate-50/70 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
            <a
              routerLink="/dashboard/reservations"
              (click)="closeDropdown()"
              class="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition">
              Voir toutes les réservations →
            </a>
          </div>
        </div>

        <!-- Backdrop pour fermer au clic dehors -->
        <div (click)="closeDropdown()" class="fixed inset-0 z-40"></div>
      }
    </div>
  `
})
export class NotificationBellComponent {
  readonly notifService = inject(NotificationService);

  readonly notifications = this.notifService.notifications;
  readonly unreadCount = this.notifService.unreadCount;
  readonly isOpen = signal(false);

  toggleDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.isOpen.update(v => !v);
  }

  closeDropdown() {
    this.isOpen.set(false);
  }

  markAllAsRead() {
    this.notifService.markAllAsRead();
  }

  onNotificationClick(notif: AppNotification) {
    if (!notif.read_at) {
      this.notifService.markAsRead(notif.id);
    }
  }

  playTestSound() {
    this.notifService.playChime();
  }

  formatTime(isoString: string): string {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }
}
