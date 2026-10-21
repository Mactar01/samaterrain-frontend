import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { Subscription, interval } from 'rxjs';

export interface AppNotification {
  id: string;
  type: string;
  title?: string;
  body?: string;
  notifiable_type?: string;
  notifiable_id?: number;
  data: {
    type?: string;
    title?: string;
    body?: string;
    reservation_id?: number;
    message?: string;
    amount?: number;
    field_id?: number;
    player_name?: string;
    field_name?: string;
    field_location?: string;
    date?: string;
    time?: string;
    status?: string;
    deposit?: number;
    remainder?: number;
    total_price?: number;
    creation_time?: string;
    partner_id?: number;
    partner_name?: string;
    business_name?: string;
    email?: string;
    phone?: string;
    [key: string]: any;
  };
  read_at: string | null;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  private notificationsSignal = signal<AppNotification[]>([]);
  private unreadCountSignal = signal<number>(0);
  private pollSub: Subscription | null = null;
  private hasInitialized = false;

  readonly notifications = computed(() => this.notificationsSignal());
  readonly unreadCount = computed(() => this.unreadCountSignal());

  constructor() {
    this.startPolling();
  }

  startPolling() {
    if (this.pollSub) return;

    // Premier appel immédiat si connecté
    if (this.authService.isAuthenticated()) {
      this.fetchNotifications();
    }

    // Polling toutes les 15 secondes
    this.pollSub = interval(15000).subscribe(() => {
      if (this.authService.isAuthenticated()) {
        this.fetchNotifications();
      }
    });
  }

  stopPolling() {
    if (this.pollSub) {
      this.pollSub.unsubscribe();
      this.pollSub = null;
    }
  }

  fetchNotifications() {
    this.http.get<any>(`${environment.apiUrl}/notifications`).subscribe({
      next: (res) => {
        const rawList = res?.notifications;
        const list: AppNotification[] = Array.isArray(rawList)
          ? rawList
          : (rawList?.data && Array.isArray(rawList.data) ? rawList.data : []);

        const count: number = typeof res?.unread_count === 'number'
          ? res.unread_count
          : list.filter(n => !n.read_at).length;

        const prevCount = this.unreadCountSignal();

        // Si de nouvelles notifications non lues sont arrivées après le chargement initial
        if (this.hasInitialized && count > prevCount) {
          this.playChime();
          const latest = list[0];
          if (latest?.title) {
            this.toastService.show('info', `${latest.title}${latest.body ? ' : ' + latest.body : ''}`);
          } else if (latest?.data?.message) {
            this.toastService.show('info', latest.data.message);
          } else if (latest?.data?.player_name) {
            this.toastService.show('info', `Nouvelle réservation par ${latest.data.player_name}`);
          }
        }

        this.notificationsSignal.set(list);
        this.unreadCountSignal.set(count);
        this.hasInitialized = true;
      },
      error: () => {
        // En cas d'erreur de réseau ou d'expiration, ignorer discrètement
      }
    });
  }

  markAsRead(id: string) {
    // Optimistic update
    const current = this.notificationsSignal();
    const updated = current.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n);
    this.notificationsSignal.set(updated);
    this.unreadCountSignal.set(Math.max(0, this.unreadCountSignal() - 1));

    this.http.post(`${environment.apiUrl}/notifications/${id}/read`, {}).subscribe({
      error: () => this.fetchNotifications()
    });
  }

  markAllAsRead() {
    const current = this.notificationsSignal();
    const updated = current.map(n => ({ ...n, read_at: new Date().toISOString() }));
    this.notificationsSignal.set(updated);
    this.unreadCountSignal.set(0);

    this.http.post(`${environment.apiUrl}/notifications/read-all`, {}).subscribe({
      error: () => this.fetchNotifications()
    });
  }

  /**
   * Joue un carillon doux et moderne à deux tons via l'API Web Audio (aucun fichier externe requis)
   */
  playChime() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Note 1 : Note aiguë cristalline (880 Hz - A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.25, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2 : Harmonique supérieure lumineuse (1318.5 Hz - E6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.5, now + 0.1);
      gain2.gain.setValueAtTime(0, now + 0.1);
      gain2.gain.linearRampToValueAtTime(0.35, now + 0.13);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.65);
    } catch (e) {
      console.warn('[NotificationService] Audio chime non déclenché:', e);
    }
  }
}
