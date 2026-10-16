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

export const BRAND_COLOR_PRESETS: Array<{ label: string; key: string; color: string; secondaryColor: string; tint: string }> = [
  { label: 'Émeraude & Nuit', key: 'emerald', color: '#16a34a', secondaryColor: '#0f172a', tint: 'rgba(22, 163, 74, 0.12)' },
  { label: 'Bleu Océan & Marine', key: 'ocean', color: '#0284c7', secondaryColor: '#0f172a', tint: 'rgba(2, 132, 199, 0.12)' },
  { label: 'Violet & Sombre', key: 'violet', color: '#7c3aed', secondaryColor: '#1e1b4b', tint: 'rgba(124, 58, 237, 0.12)' },
  { label: 'Orange & Charbon', key: 'coral', color: '#ea580c', secondaryColor: '#1c1917', tint: 'rgba(234, 88, 12, 0.12)' },
  { label: 'Rouge & Noir', key: 'rose', color: '#e11d48', secondaryColor: '#18181b', tint: 'rgba(225, 29, 72, 0.12)' },
  { label: 'Or Champion & Slate', key: 'amber', color: '#d97706', secondaryColor: '#1e293b', tint: 'rgba(217, 119, 6, 0.12)' },
  { label: 'Titane & Nuit', key: 'slate', color: '#475569', secondaryColor: '#0f172a', tint: 'rgba(51, 65, 85, 0.12)' },
];

export const DEFAULT_OWNER_BRANDING: OwnerBranding = {
  primaryColor: '#16a34a',
  secondaryColor: '#0f172a',
  logoPosition: 'left',
  bgStyle: 'clean',
  slogan: 'Bienvenue dans votre espace sportif',
  sloganSubtitle: 'Gérez vos créneaux, suivez vos réservations et offrez la meilleure expérience à vos joueurs.'
};
