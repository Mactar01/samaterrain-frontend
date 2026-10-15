export type LogoPosition = 'left' | 'center' | 'right';
export type BackgroundStyle = 'clean' | 'gradient' | 'stadium' | 'dark-mesh';

export interface OwnerBranding {
  primaryColor: string;
  secondaryColor?: string;
  logoUrl?: string;
  logoPosition: LogoPosition;
  bgStyle: BackgroundStyle;
  customBgUrl?: string;
  coverUrl?: string;
  slogan?: string;
  sloganSubtitle?: string;
  businessName?: string;
}

export const BRAND_COLOR_PRESETS: Array<{ label: string; key: string; color: string; tint: string }> = [
  { label: 'Émeraude Football', key: 'emerald', color: '#16a34a', tint: 'rgba(22, 163, 74, 0.12)' },
  { label: 'Bleu Océan', key: 'ocean', color: '#0284c7', tint: 'rgba(2, 132, 199, 0.12)' },
  { label: 'Violet Prestige', key: 'violet', color: '#7c3aed', tint: 'rgba(124, 58, 237, 0.12)' },
  { label: 'Orange Énergie', key: 'coral', color: '#ea580c', tint: 'rgba(234, 88, 12, 0.12)' },
  { label: 'Rouge Passion', key: 'rose', color: '#e11d48', tint: 'rgba(225, 29, 72, 0.12)' },
  { label: 'Or Champion', key: 'amber', color: '#d97706', tint: 'rgba(217, 119, 6, 0.12)' },
  { label: 'Noir & Titane', key: 'slate', color: '#334155', tint: 'rgba(51, 65, 85, 0.12)' },
];

export const DEFAULT_OWNER_BRANDING: OwnerBranding = {
  primaryColor: '#16a34a',
  logoPosition: 'left',
  bgStyle: 'clean',
  slogan: 'Bienvenue dans votre espace sportif',
  sloganSubtitle: 'Gérez vos créneaux, suivez vos réservations et offrez la meilleure expérience à vos joueurs.'
};
