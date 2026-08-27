import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';

export default function Toast({ message, show }: { message: string; show: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: show ? 1 : 0, duration: 220, useNativeDriver: true }).start();
  }, [show]);

  return (
    <Animated.View pointerEvents="none" style={[styles.toast, { opacity }]}>
      <Ionicons name="checkmark" size={18} color="#fff" />
      <Text style={styles.text} numberOfLines={2}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute', bottom: 40, left: 20, right: 20,
    backgroundColor: colors.green, borderRadius: radius, paddingVertical: 13, paddingHorizontal: 18,
    flexDirection: 'row', alignItems: 'center', gap: 9,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  text: { color: '#fff', fontSize: 13.5, fontWeight: '600', flex: 1 },
});
