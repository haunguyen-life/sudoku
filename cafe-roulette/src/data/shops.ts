export type ShopIcon = 'coffee' | 'bean' | 'boba';

export interface Shop {
  id: string;
  name: string;
  icon: ShopIcon;
  color: string;
}

// Tên quán giữ nguyên theo yêu cầu, không đổi hay bỏ quán nào.
// Màu xen kẽ để hai ô liền kề luôn khác nhau.
export const SHOPS: Shop[] = [
  { id: 'co-ha', name: 'Cô Hà', icon: 'coffee', color: '#FF6F61' },
  { id: 'dg-coffee', name: 'DG Coffee', icon: 'bean', color: '#3DDC97' },
  { id: 'highlands-coffee', name: 'Highlands Coffee', icon: 'coffee', color: '#B69CFF' },
  { id: 'katinat', name: 'Katinat', icon: 'bean', color: '#FFC93C' },
  { id: 'phe-la', name: 'Phê La', icon: 'coffee', color: '#5AC8FA' },
  { id: 'rop-reng', name: 'Rốp Rẻng', icon: 'bean', color: '#FFF1D6' },
  { id: 'tuc-tac-tea', name: 'Túc Tắc Tea', icon: 'boba', color: '#FF9E8F' },
  { id: 'mintea-2', name: 'Mintea 2', icon: 'boba', color: '#8EE8C0' },
];

export const ICON_EMOJI: Record<ShopIcon, string> = {
  coffee: '☕',
  bean: '🫘',
  boba: '🧋',
};

export const PALETTE = {
  coral: '#FF6F61',
  mint: '#3DDC97',
  lavender: '#B69CFF',
  sky: '#5AC8FA',
  cream: '#FFF1D6',
  yellow: '#FFC93C',
  ink: '#3B1D5C',
} as const;
