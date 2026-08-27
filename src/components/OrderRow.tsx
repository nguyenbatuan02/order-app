import { Pressable, StyleSheet, Text, View } from 'react-native';
import { STATUSES } from '../data/constants';
import { colors, colorSets } from '../theme';
import { Badge, MiniBadge } from './Badge';
import type { Order } from '../types/order';

function shippingBadgeStyle(shipping: string) {
  if (shipping === 'EX') return { bg: colors.amberBg, text: colors.amberText };
  if (shipping === 'TH') return { bg: colors.tealBg, text: colors.tealText };
  return { bg: colors.purpleBg, text: colors.purpleText };
}

export default function OrderRow({ order, onPress }: { order: Order; onPress: () => void }) {
  const s = STATUSES.find((x) => x.id === order.status)!;
  const c = colorSets[s.color];
  const shipStyle = shippingBadgeStyle(order.shipping);

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.topLine}>
        <View>
          <Text style={styles.id}>{order.id}</Text>
          <Text style={styles.time}>{order.time}</Text>
        </View>
        <Badge bg={c.bg} text={c.text} dot={c.dot} label={s.name} />
      </View>
      <View style={styles.bottomLine}>
        <View style={{ flex: 1 }}>
          <Text style={styles.customer}>{order.customer}</Text>
          <Text style={styles.phone}>{order.phone}</Text>
        </View>
        <MiniBadge bg={shipStyle.bg} text={shipStyle.text} label={order.shippingLabel} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border, padding: 14, gap: 8 },
  topLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  id: { fontSize: 14, fontWeight: '700', color: colors.blueText },
  time: { fontSize: 11, color: colors.text3, marginTop: 2 },
  bottomLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customer: { fontSize: 14, fontWeight: '600', color: colors.text },
  phone: { fontSize: 12.5, color: colors.text3, marginTop: 1 },
});
