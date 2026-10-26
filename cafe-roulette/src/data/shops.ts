export type ShopIcon = 'coffee' | 'bean' | 'boba';

export interface Shop {
  id: string;
  name: string;
  icon: ShopIcon;
  color: string;
}

// Tên quán giữ nguyên theo yêu cầu, không đổi hay bỏ quán nào.
export const SHOPS: Shop[] = [
  { id: 'co-ha', name: 'Cô Hà', icon: 'coffee', color: '#FF6FA5' },
  { id: 'dg-coffee', name: 'DG Coffee', icon: 'bean', color: '#4CC9F0' },
  { id: 'highlands-coffee', name: 'Highlands Coffee', icon: 'coffee', color: '#9D6BFF' },
  { id: 'katinat', name: 'Katinat', icon: 'bean', color: '#FF9F43' },
  { id: 'phe-la', name: 'Phê La', icon: 'coffee', color: '#2EC4A6' },
  { id: 'rop-reng', name: 'Rốp Rẻng', icon: 'bean', color: '#F15BB5' },
  { id: 'tuc-tac-tea', name: 'Túc Tắc Tea', icon: 'boba', color: '#5B8CFF' },
  { id: 'mintea-2', name: 'Mintea 2', icon: 'boba', color: '#FF7B54' },
];

export const ICON_EMOJI: Record<ShopIcon, string> = {
  coffee: '☕',
  bean: '🫘',
  boba: '🧋',
};
