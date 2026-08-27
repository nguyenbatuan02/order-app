import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STATUSES } from '../data/constants';
import { colors, colorSets, radius } from '../theme';
import type { OrderStatus, IconKey } from '../types/order';
import type { StatusCounts } from '../api/orders';

const ICONS: Record<IconKey, keyof typeof Ionicons.glyphMap> = {
  file: 'document-text-outline',
  edit: 'create-outline',
  box: 'cube-outline',
  package: 'archive-outline',
  check: 'checkmark-circle-outline',
};

interface Props {
  counts: StatusCounts;
  activeFilter: OrderStatus | null;
  onSelect: (id: OrderStatus) => void;
}

export default function StatusGrid({ counts, activeFilter, onSelect }: Props) {
  return (
    <View style={styles.grid}>
      {STATUSES.map((s) => {
        const count = counts[s.id] ?? 0;
        const c = colorSets[s.color];
        const active = activeFilter === s.id;
        return (
          <Pressable
            key={s.id}
            style={[styles.card, active && styles.cardActive]}
            onPress={() => onSelect(s.id)}
          >
            <View style={[styles.icon, { backgroundColor: c.bg }]}>
              <Ionicons name={ICONS[s.icon]} size={18} color={c.text} />
            </View>
            <Text style={[styles.count, { color: c.text }]}>{count}</Text>
            <View style={styles.nameRow}>
              <View style={[styles.dot, { backgroundColor: c.dot }]} />
              <Text style={styles.name} numberOfLines={2}>{s.name}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  card: {
    width: '48%', backgroundColor: colors.surface, borderRadius: radius,
    borderWidth: 1, borderColor: colors.border, padding: 14,
  },
  cardActive: { borderColor: colors.blue, borderWidth: 2 },
  icon: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  count: { fontSize: 24, fontWeight: '700' },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 4, gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4, marginTop: 5 },
  name: { fontSize: 12, color: colors.text2, flex: 1, lineHeight: 16 },
});
