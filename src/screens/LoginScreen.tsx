import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius } from '../theme';

interface Props {
  onLogin: (ma: string, matKhau: string) => Promise<void>;
}

export default function LoginScreen({ onLogin }: Props) {
  const [ma, setMa] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!ma.trim() || !matKhau) {
      setError('Nhập đầy đủ mã đăng nhập và mật khẩu');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onLogin(ma.trim(), matKhau);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <View style={styles.logo}><Text style={styles.logoText}>HT</Text></View>
        <Text style={styles.title}>Quản lý đơn hàng</Text>
        <Text style={styles.subtitle}>Đăng nhập để tiếp tục</Text>

        <Text style={styles.label}>Mã đăng nhập</Text>
        <TextInput
          style={styles.input}
          placeholder="VD: HANGNGUYEN"
          placeholderTextColor={colors.text3}
          value={ma}
          onChangeText={setMa}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Mật khẩu</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••"
          placeholderTextColor={colors.text3}
          value={matKhau}
          onChangeText={setMatKhau}
          secureTextEntry
        />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Đăng nhập</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 360 },
  logo: { width: 56, height: 56, borderRadius: 14, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16 },
  logoText: { color: '#fff', fontWeight: '700', fontSize: 20 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 13.5, color: colors.text3, textAlign: 'center', marginTop: 4, marginBottom: 28 },
  label: { fontSize: 12.5, fontWeight: '600', color: colors.text2, marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius, paddingHorizontal: 14, height: 46, fontSize: 14.5, color: colors.text },
  error: { color: '#a33', fontSize: 12.5, marginTop: 12 },
  btn: { backgroundColor: colors.blue, borderRadius: radius, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
