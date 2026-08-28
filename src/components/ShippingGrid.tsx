import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, colorSets, radius } from '../theme';
import type { ShippingFilter, ShippingCounts } from '../api/orders';

const OPTIONS: { id: Exclude<ShippingFilter, null>; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { id: 'EX', label: 'Giao nhanh', icon: 'flash-outline', color: 'amber' },
  { id: 'TH', label: 'Giao thường', icon: 'car-outline', color: 'teal' },
  { id: 'PICKUP', label: 'Khách đến lấy', icon: 'storefront-outline', color: 'purple' },
];

interface Props {
  counts: ShippingCounts;
  activeFilter: ShippingFilter;
  onSelect: (id: ShippingFilter) => void;
}

export default function ShippingGrid({ counts, activeFilter, onSelect }: Props) {
  return (
    <View style={styles.grid}>
      {OPTIONS.map((opt) => {
        const c = colorSets[opt.color];
        const active = activeFilter === opt.id;
        return (
          <Pressable
            key={opt.id}
            style={[styles.card, active && styles.cardActive]}
            onPress={() => onSelect(active ? null : opt.id)}
          >
            <View style={[styles.icon, { backgroundColor: c.bg }]}>
              <Ionicons name={opt.icon} size={16} color={c.text} />
            </View>
            <Text style={[styles.count, { color: c.text }]}>{counts[opt.id]}</Text>
            <Text style={styles.name} numberOfLines={2}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  card: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius,
    borderWidth: 1, borderColor: colors.border, padding: 12,
  },
  cardActive: { borderColor: colors.blue, borderWidth: 2 },
  icon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  count: { fontSize: 19, fontWeight: '700' },
  name: { fontSize: 11, color: colors.text2, marginTop: 2, lineHeight: 14 },
});
