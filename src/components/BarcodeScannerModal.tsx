import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onScanned: (docNo: string) => void;
}

function toDocNo(raw: string): string {
  const trimmed = raw.trim();
  return /^[A-Za-z]/.test(trimmed) ? trimmed.toUpperCase() : `HT${trimmed}`;
}

export default function BarcodeScannerModal({ visible, onClose, onScanned }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const scannedRef = useRef(false);

  function handleScan(result: BarcodeScanningResult) {
    if (scannedRef.current) return;
    scannedRef.current = true;
    onScanned(toDocNo(result.data));
  }

  function handleShow() {
    scannedRef.current = false;
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} onShow={handleShow}>
      <View style={styles.root}>
        {!permission ? (
          <View style={styles.center} />
        ) : !permission.granted ? (
          <View style={styles.center}>
            <Ionicons name="camera-outline" size={40} color="#fff" />
            <Text style={styles.permText}>Cần quyền truy cập camera để quét mã vạch</Text>
            <Pressable style={styles.permBtn} onPress={requestPermission}>
              <Text style={styles.permBtnText}>Cấp quyền</Text>
            </Pressable>
          </View>
        ) : (
          <CameraView
            style={StyleSheet.absoluteFill}
            barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'ean8', 'upc_a', 'itf14'] }}
            onBarcodeScanned={handleScan}
          />
        )}

        <View style={styles.frameWrap} pointerEvents="none">
          <View style={styles.frame} />
          <Text style={styles.hint}>Đưa mã vạch/QR trên phiếu vào khung</Text>
        </View>

        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={22} color="#fff" />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 30 },
  permText: { color: '#fff', fontSize: 14, textAlign: 'center' },
  permBtn: { backgroundColor: colors.blue, borderRadius: radius, paddingHorizontal: 20, paddingVertical: 10 },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  frameWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  frame: { width: 240, height: 240, borderWidth: 2, borderColor: '#fff', borderRadius: 16, backgroundColor: 'transparent' },
  hint: { color: '#fff', fontSize: 13, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  closeBtn: { position: 'absolute', top: 56, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
});
