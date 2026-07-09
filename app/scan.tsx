import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { lookupBarcode } from '../lib/api';

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const lastScan = useRef<string>('');

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const handleBarcodeScanned = async (result: BarcodeScanningResult) => {
    if (scanned || loading || result.data === lastScan.current) return;
    lastScan.current = result.data;
    setScanned(true);
    setLoading(true);

    try {
      const food = await lookupBarcode(result.data);
      if (!food) {
        Alert.alert(
          'Product Not Found',
          'This barcode was not found in the database. Would you like to enter details manually?',
          [
            { text: 'Try Again', onPress: () => { setScanned(false); lastScan.current = ''; } },
            { text: 'Manual Entry', onPress: () => router.replace('/manual') },
          ]
        );
        return;
      }

      router.push({
        pathname: '/confirm',
        params: {
          name: food.name,
          calories: String(food.calories),
          protein: String(food.protein),
          sodium: String(food.sodium),
          sugar: String(food.sugar),
          fat: String(food.fat),
          serving_size: food.serving_size ?? '',
        },
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to look up barcode. Please try again.', [
        { text: 'OK', onPress: () => { setScanned(false); lastScan.current = ''; } },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color="#FFFFFF" size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.center, { paddingBottom: insets.bottom }]}>
        <Ionicons name="camera-outline" size={64} color="#333" />
        <Text style={styles.permTitle}>Camera Access Required</Text>
        <Text style={styles.permSubtitle}>
          BulkMaxxer needs camera access to scan barcodes
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: [
            'ean13',
            'ean8',
            'upc_a',
            'upc_e',
            'code128',
            'code39',
            'qr',
          ],
        }}
      />

      {/* Dark overlay with scan window */}
      <View style={styles.overlay}>
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <View style={styles.scanWindow}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom}>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#FFFFFF" />
              <Text style={styles.loadingText}>Looking up product...</Text>
            </View>
          ) : scanned ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#FFFFFF" />
              <Text style={styles.loadingText}>Processing...</Text>
            </View>
          ) : (
            <Text style={styles.hint}>Point camera at a barcode</Text>
          )}

          {!loading && (
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => { setScanned(false); lastScan.current = ''; }}
            >
              <Text style={styles.resetText}>Reset Scanner</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const WINDOW_SIZE = 260;
const CORNER_SIZE = 24;
const CORNER_THICKNESS = 4;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#FFFFFF',
  },
  permTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111111',
  },
  permSubtitle: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  permBtn: {
    backgroundColor: '#111111',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  permBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: WINDOW_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scanWindow: {
    width: WINDOW_SIZE,
    height: WINDOW_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: '#FFFFFF',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  hint: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  resetBtn: {
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  resetText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
