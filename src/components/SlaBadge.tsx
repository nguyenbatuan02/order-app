import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';
import type { Order } from '../types/order';

function fmtDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}p`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}g${m}p` : `${h}g`;
}

const STYLES: Record<Order['slaStatus'], { bg: string; text: string; label: (o: Order) => string } | null> = {
  on_time: { bg: colors.greenBg, text: colors.greenText, label: (o) => `Đúng SLA · ${fmtDuration(o.slaMinutes ?? 0)}` },
  late: { bg: colors.redBg, text: colors.red, label: (o) => `Trễ SLA · ${fmtDuration(o.slaMinutes ?? 0)}` },
  at_risk: { bg: colors.amberBg, text: colors.amberText, label: (o) => `Sắp trễ SLA · ${fmtDuration(o.slaMinutes ?? 0)}` },
  in_progress: null,
  unknown: null,
};

export default function SlaBadge({ order }: { order: Order }) {
  const cfg = STYLES[order.slaStatus];
  if (!cfg) return null;
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.text, { color: cfg.text }]}>{cfg.label(order)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: radius, paddingHorizontal: 8, paddingVertical: 3 },
  text: { fontSize: 10.5, fontWeight: '700' },
});
