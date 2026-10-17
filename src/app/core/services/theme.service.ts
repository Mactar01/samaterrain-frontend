import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OwnerBranding, DEFAULT_OWNER_BRANDING } from '../models/branding.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private http = inject(HttpClient);
  readonly isDark = signal<boolean>(false);
  readonly currentBranding = signal<OwnerBranding>(DEFAULT_OWNER_BRANDING);

  constructor() {
    this.initTheme();
    this.initBranding();
  }

  private initTheme() {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = saved === 'dark' || (!saved && prefersDark);
    
    this.setDark(shouldBeDark);
  }

  toggle() {
    this.setDark(!this.isDark());
  }

  setDark(dark: boolean) {
    this.isDark.set(dark);
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  // --- Loueur White-Label Branding System ---

  private getStorageKey(ownerId?: string | number): string {
    if (ownerId) return `myterrain_branding_owner_${ownerId}`;
    try {
      const userStr = sessionStorage.getItem('user') || localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user?.owner?.id) return `myterrain_branding_owner_${user.owner.id}`;
        if (user?.id) return `myterrain_branding_owner_${user.id}`;
      }
    } catch (e) {
      // ignore
    }
    return 'myterrain_branding_current';
  }

  private safeStoreBranding(key: string, branding: OwnerBranding) {
    try {
      // Avoid storing two copies of the same base64 cover image in localStorage
      const compact: any = { ...branding };
      if (compact.coverUrl && compact.customBgUrl === compact.coverUrl) {
        delete compact.customBgUrl;
      }
      localStorage.setItem(key, JSON.stringify(compact));
    } catch (e) {
      console.warn('Could not persist branding in localStorage (quota):', e);
    }
  }

  initBranding(ownerId?: string | number, serverBranding?: Partial<OwnerBranding> | null) {
    const key = this.getStorageKey(ownerId);
    let merged: OwnerBranding = { ...DEFAULT_OWNER_BRANDING };

    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        merged = { ...merged, ...parsed };
      } catch (e) {
        console.error('Failed to parse branding config', e);
      }
    }

    if (serverBranding && typeof serverBranding === 'object') {
      merged = { ...merged, ...serverBranding };
      this.safeStoreBranding(key, merged);
    }

    if (merged.coverUrl && !merged.customBgUrl) {
      merged.customBgUrl = merged.coverUrl;
    } else if (merged.customBgUrl && !merged.coverUrl) {
      merged.coverUrl = merged.customBgUrl;
    }

    this.currentBranding.set(merged);
    this.applyBrandingToDOM(merged);
  }

  saveBranding(branding: OwnerBranding, ownerId?: string | number) {
    const key = this.getStorageKey(ownerId);
    if (branding.coverUrl && !branding.customBgUrl) {
      branding.customBgUrl = branding.coverUrl;
    } else if (branding.customBgUrl && !branding.coverUrl) {
      branding.coverUrl = branding.customBgUrl;
    }
    this.safeStoreBranding(key, branding);
    this.currentBranding.set({ ...branding });
    this.applyBrandingToDOM(branding);

    // Persist branding to backend database so it survives page reloads & deployments across devices
    const payload: any = { ...branding };
    if (payload.coverUrl && payload.customBgUrl === payload.coverUrl) {
      delete payload.customBgUrl;
    }
    this.http.put(`${environment.apiUrl}/owner/settings`, {
      settings: { branding: payload }
    }).subscribe({
      error: () => {
        // Silent fallback if collaborator does not have settings:manage
      }
    });
  }

  resetBranding(ownerId?: string | number) {
    const key = this.getStorageKey(ownerId);
    localStorage.removeItem(key);
    this.currentBranding.set(DEFAULT_OWNER_BRANDING);
    this.applyBrandingToDOM(DEFAULT_OWNER_BRANDING);

    this.http.put(`${environment.apiUrl}/owner/settings`, {
      settings: { branding: DEFAULT_OWNER_BRANDING }
    }).subscribe({ error: () => {} });
  }

  private applyBrandingToDOM(branding: OwnerBranding) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.style.setProperty('--brand-color', branding.primaryColor);
    root.style.setProperty('--brand-color-tint', this.hexToRgba(branding.primaryColor, 0.12));
    root.style.setProperty('--brand-color-dark', this.adjustColorBrightness(branding.primaryColor, -20));
    root.style.setProperty('--brand-color-light', this.adjustColorBrightness(branding.primaryColor, 20));

    const secondaryColor = branding.secondaryColor || '#0f172a';
    root.style.setProperty('--brand-secondary-color', secondaryColor);
    root.style.setProperty('--brand-secondary-color-tint', this.hexToRgba(secondaryColor, 0.12));
  }

  private hexToRgba(hex: string, alpha: number): string {
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(c => c + c).join('');
    }
    const num = parseInt(cleanHex, 16);
    if (isNaN(num)) return `rgba(22, 163, 74, ${alpha})`;
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private adjustColorBrightness(hex: string, percent: number): string {
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(c => c + c).join('');
    }
    const num = parseInt(cleanHex, 16);
    if (isNaN(num)) return hex;
    const r = Math.min(255, Math.max(0, ((num >> 16) & 255) + percent));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 255) + percent));
    const b = Math.min(255, Math.max(0, (num & 255) + percent));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }
}
