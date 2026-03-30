import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Camera, FlipHorizontal, Check, X } from 'lucide-react-native';
import { performOCR, extractPriceFromText } from '@/services/ocr';
import { addScannedItem } from '@/services/database';
import { router } from 'expo-router';

export default function ScannerScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedPrice, setCapturedPrice] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'VES'>(
    'USD'
  );
  const [exchangeRate, setExchangeRate] = useState<string>('36.50');
  const [showPreview, setShowPreview] = useState(false);
  const cameraRef = useRef<any>(null);

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Camera size={64} color="#2563eb" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need your permission to access the camera to scan prices
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    setIsProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
      });

      const ocrText = await performOCR(`data:image/jpeg;base64,${photo.base64}`);
      const extractedPrice = extractPriceFromText(ocrText);

      if (extractedPrice) {
        setCapturedPrice(extractedPrice.toString());
        setShowPreview(true);
      } else {
        Alert.alert(
          'No Price Found',
          'Could not detect a price in the image. Please try again or enter manually.'
        );
        setCapturedPrice('');
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert('Error', 'Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const saveItem = async () => {
    const price = parseFloat(capturedPrice);
    const rate = parseFloat(exchangeRate);

    if (isNaN(price) || price <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price');
      return;
    }

    if (isNaN(rate) || rate <= 0) {
      Alert.alert('Invalid Exchange Rate', 'Please enter a valid exchange rate');
      return;
    }

    setIsProcessing(true);
    try {
      const priceInBolivares =
        selectedCurrency === 'USD' ? price * rate : price;

      await addScannedItem(
        price,
        selectedCurrency,
        priceInBolivares,
        rate
      );

      Alert.alert('Success', 'Price saved successfully!', [
        {
          text: 'View History',
          onPress: () => router.push('/history'),
        },
        {
          text: 'Scan Another',
          onPress: () => {
            setShowPreview(false);
            setCapturedPrice('');
          },
        },
      ]);
    } catch (error) {
      console.error('Error saving item:', error);
      Alert.alert('Error', 'Failed to save item. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelPreview = () => {
    setShowPreview(false);
    setCapturedPrice('');
  };

  if (showPreview) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>Confirm Scanned Price</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Price</Text>
            <TextInput
              style={styles.input}
              value={capturedPrice}
              onChangeText={setCapturedPrice}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Currency</Text>
            <View style={styles.currencySelector}>
              <TouchableOpacity
                style={[
                  styles.currencyButton,
                  selectedCurrency === 'USD' && styles.currencyButtonActive,
                ]}
                onPress={() => setSelectedCurrency('USD')}>
                <Text
                  style={[
                    styles.currencyButtonText,
                    selectedCurrency === 'USD' &&
                      styles.currencyButtonTextActive,
                  ]}>
                  USD ($)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.currencyButton,
                  selectedCurrency === 'VES' && styles.currencyButtonActive,
                ]}
                onPress={() => setSelectedCurrency('VES')}>
                <Text
                  style={[
                    styles.currencyButtonText,
                    selectedCurrency === 'VES' &&
                      styles.currencyButtonTextActive,
                  ]}>
                  Bolívares (Bs)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Exchange Rate (USD to VES)</Text>
            <TextInput
              style={styles.input}
              value={exchangeRate}
              onChangeText={setExchangeRate}
              keyboardType="decimal-pad"
              placeholder="36.50"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.conversionPreview}>
            <Text style={styles.conversionText}>
              {selectedCurrency === 'USD'
                ? `$${capturedPrice || '0.00'} = Bs ${(
                    parseFloat(capturedPrice || '0') * parseFloat(exchangeRate)
                  ).toFixed(2)}`
                : `Bs ${capturedPrice || '0.00'}`}
            </Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={cancelPreview}
              disabled={isProcessing}>
              <X size={20} color="#ef4444" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={saveItem}
              disabled={isProcessing}>
              {isProcessing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Check size={20} color="#ffffff" />
                  <Text style={styles.saveButtonText}>Save</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.cameraOverlay}>
          <View style={styles.scanArea}>
            <View style={styles.cornerTopLeft} />
            <View style={styles.cornerTopRight} />
            <View style={styles.cornerBottomLeft} />
            <View style={styles.cornerBottomRight} />
            <Text style={styles.scanText}>Position price within frame</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleCameraFacing}>
            <FlipHorizontal size={24} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.captureButton}
            onPress={takePicture}
            disabled={isProcessing}>
            {isProcessing ? (
              <ActivityIndicator size="large" color="#ffffff" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>

          <View style={styles.controlButton} />
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 20,
    marginBottom: 10,
  },
  permissionText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 300,
    height: 200,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#2563eb',
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#2563eb',
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#2563eb',
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#2563eb',
    borderBottomRightRadius: 8,
  },
  scanText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#2563eb',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2563eb',
  },
  previewContainer: {
    padding: 20,
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  currencySelector: {
    flexDirection: 'row',
    gap: 12,
  },
  currencyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  currencyButtonActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  currencyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  currencyButtonTextActive: {
    color: '#2563eb',
  },
  conversionPreview: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  conversionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#fef2f2',
    borderWidth: 2,
    borderColor: '#fecaca',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  saveButton: {
    backgroundColor: '#2563eb',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
