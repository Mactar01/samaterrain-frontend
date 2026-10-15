import { Injectable, signal } from '@angular/core';
import { OwnerBranding, DEFAULT_OWNER_BRANDING } from '../models/branding.model';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
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
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.id) return `myterrain_branding_owner_${user.id}`;
      }
    } catch (e) {
      // ignore
    }
    return 'myterrain_branding_current';
  }

  initBranding(ownerId?: string | number) {
    const key = this.getStorageKey(ownerId);
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.currentBranding.set({ ...DEFAULT_OWNER_BRANDING, ...parsed });
        this.applyBrandingToDOM(this.currentBranding());
        return;
      } catch (e) {
        console.error('Failed to parse branding config', e);
      }
    }
    this.currentBranding.set(DEFAULT_OWNER_BRANDING);
    this.applyBrandingToDOM(DEFAULT_OWNER_BRANDING);
  }

  saveBranding(branding: OwnerBranding, ownerId?: string | number) {
    const key = this.getStorageKey(ownerId);
    localStorage.setItem(key, JSON.stringify(branding));
    this.currentBranding.set(branding);
    this.applyBrandingToDOM(branding);
  }

  resetBranding(ownerId?: string | number) {
    const key = this.getStorageKey(ownerId);
    localStorage.removeItem(key);
    this.currentBranding.set(DEFAULT_OWNER_BRANDING);
    this.applyBrandingToDOM(DEFAULT_OWNER_BRANDING);
  }

  private applyBrandingToDOM(branding: OwnerBranding) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.style.setProperty('--brand-color', branding.primaryColor);
    root.style.setProperty('--brand-color-tint', this.hexToRgba(branding.primaryColor, 0.12));
    root.style.setProperty('--brand-color-dark', this.adjustColorBrightness(branding.primaryColor, -20));
    root.style.setProperty('--brand-color-light', this.adjustColorBrightness(branding.primaryColor, 20));
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
