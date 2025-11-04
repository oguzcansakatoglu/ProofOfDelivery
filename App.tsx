/**
 * Proof of Delivery single page application.
 */

import {
  ActivityIndicator,
  Image,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

const lightTheme = {
  background: '#f4f6fb',
  text: '#1a1a1a',
  mutedText: '#4f5a70',
  card: '#ffffff',
  border: '#dde3f0',
  accent: '#3d5afe',
  accentText: '#ffffff',
};

const darkTheme = {
  background: '#0e121b',
  text: '#f0f3ff',
  mutedText: '#9ba6c1',
  card: '#171f2d',
  border: '#1f2a3e',
  accent: '#7690ff',
  accentText: '#0e121b',
};

function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

type Point = { x: number; y: number };
type Stroke = { id: number; points: Point[] };

type SignaturePadProps = {
  theme: typeof lightTheme;
  onSignatureChange?: (hasSignature: boolean) => void;
};

function SignaturePad({ theme, onSignatureChange }: SignaturePadProps) {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const strokeId = useRef(0);

  useEffect(() => {
    const hasSignature = strokes.some(stroke => stroke.points.length > 0);
    onSignatureChange?.(hasSignature);
  }, [strokes, onSignatureChange]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: event => {
          const { locationX, locationY } = event.nativeEvent;
          strokeId.current += 1;
          const newStroke: Stroke = {
            id: strokeId.current,
            points: [{ x: locationX, y: locationY }],
          };
          setStrokes(prev => [...prev, newStroke]);
        },
        onPanResponderMove: event => {
          const { locationX, locationY } = event.nativeEvent;
          setStrokes(prev => {
            if (prev.length === 0) {
              return prev;
            }
            const updated = [...prev];
            const currentStroke = updated[updated.length - 1];
            updated[updated.length - 1] = {
              ...currentStroke,
              points: [...currentStroke.points, { x: locationX, y: locationY }],
            };
            return updated;
          });
        },
      }),
    [],
  );

  const handleClear = () => {
    setStrokes([]);
  };

  return (
    <View>
      <View
        style={[styles.signatureCanvas, { backgroundColor: theme.background, borderColor: theme.border }]}
        {...panResponder.panHandlers}
      >
        {strokes.length === 0 ? (
          <Text style={[styles.signaturePlaceholder, { color: theme.mutedText }]}>
            Sign inside the box
          </Text>
        ) : null}
        {strokes.map(stroke =>
          stroke.points.map((point, index) => (
            <View
              key={`${stroke.id}-${index}`}
              style={[styles.signaturePoint, { backgroundColor: theme.text, left: point.x - 2, top: point.y - 2 }]}
            />
          )),
        )}
      </View>
      <Pressable style={[styles.secondaryButton, { borderColor: theme.border }]} onPress={handleClear}>
        <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Clear signature</Text>
      </Pressable>
    </View>
  );
}

function AppContent(): JSX.Element {
  const safeAreaInsets = useSafeAreaInsets();
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [note, setNote] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isImageModalVisible, setImageModalVisible] = useState(false);
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [isRequestingCameraPermission, setIsRequestingCameraPermission] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const cameraRef = useRef<Camera | null>(null);

  const openImageModal = useCallback(() => {
    setCameraError(null);
    setCameraPermissionStatus('unknown');
    setImageModalVisible(true);
  }, []);

  const closeImageModal = () => {
    setImageModalVisible(false);
    setCameraPermissionStatus('unknown');
    setCameraError(null);
    setIsRequestingCameraPermission(false);
  };

  useEffect(() => {
    if (!isImageModalVisible) {
      return;
    }

    let isActive = true;

    const requestPermission = async () => {
      setIsRequestingCameraPermission(true);
      try {
        // Check if permission methods exist
        if (typeof Camera.requestDeviceCameraAuthorization !== 'function') {
          // If methods don't exist, assume we have permission and let the Camera component handle it
          if (isActive) {
            setCameraPermissionStatus('granted');
            setCameraError(null);
            setIsRequestingCameraPermission(false);
          }
          return;
        }

        // Check existing permission status
        let existingStatus;
        if (typeof Camera.checkDeviceCameraAuthorizationStatus === 'function') {
          existingStatus = await Camera.checkDeviceCameraAuthorizationStatus();
        }

        if (!isActive) {
          return;
        }

        // If already granted, we're done
        if (existingStatus === true || existingStatus === 'authorized' || existingStatus === 'granted') {
          setCameraError(null);
          setCameraPermissionStatus('granted');
          setIsRequestingCameraPermission(false);
          return;
        }

        // Request permission
        const requestedStatus = await Camera.requestDeviceCameraAuthorization();

        if (!isActive) {
          return;
        }

        // Handle the response
        if (requestedStatus === true || requestedStatus === 'authorized' || requestedStatus === 'granted') {
          setCameraError(null);
          setCameraPermissionStatus('granted');
        } else {
          setCameraError('Camera access was denied. Enable it in Settings.');
          setCameraPermissionStatus('denied');
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        console.error('Camera permission error:', error);
        // On error, try to show camera anyway - it might handle permissions itself
        setCameraPermissionStatus('granted');
        setCameraError(null);
      } finally {
        if (isActive) {
          setIsRequestingCameraPermission(false);
        }
      }
    };

    void requestPermission();

    return () => {
      isActive = false;
    };
  }, [isImageModalVisible]);

  const handleCapturePhoto = useCallback(async () => {
    try {
      const capturedImage = await cameraRef.current?.capture?.();
      if (capturedImage?.uri) {
        setImageUri(capturedImage.uri);
        setImageModalVisible(false);
        setCameraPermissionStatus('unknown');
        setCameraError(null);
      } else {
        setCameraError('No image data was returned.');
      }
    } catch (error) {
      setCameraError('Failed to capture photo. Please try again.');
    }
  }, []);

  const handleRemoveImage = () => {
    setImageUri(null);
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: safeAreaInsets.top,
          paddingBottom: safeAreaInsets.bottom,
          backgroundColor: theme.background,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTap="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.heading, { color: theme.text }]}>Proof of delivery</Text>
        <Text style={[styles.subheading, { color: theme.mutedText }]}>Capture a note, photo, or signature</Text>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.mutedText }]}>Delivery note</Text>
          <TextInput
            placeholder="Add important delivery details..."
            placeholderTextColor={theme.mutedText}
            multiline
            style={[styles.noteInput, { color: theme.text }]}
            value={note}
            onChangeText={setNote}
          />
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Photo attachment</Text>
            <Pressable
              onPress={() => {
                void openImageModal();
              }}
              style={[styles.primaryButton, { backgroundColor: theme.accent }]}
            >
              <Text style={[styles.primaryButtonText, { color: theme.accentText }]}>
                {imageUri ? 'Change image' : 'Add image'}
              </Text>
            </Pressable>
          </View>

          {imageUri ? (
            <View style={styles.imagePreviewWrapper}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
              <Pressable style={[styles.secondaryButton, { borderColor: theme.border }]} onPress={handleRemoveImage}>
                <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Remove image</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={[styles.emptyStateText, { color: theme.mutedText }]}>No image attached</Text>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Signature</Text>
          <Text style={[styles.signatureHint, { color: theme.mutedText }]}>Use your finger to sign below.</Text>
          <SignaturePad theme={theme} onSignatureChange={setHasSignature} />
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.mutedText }]}>Note characters</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{note.trim().length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.mutedText }]}>Image attached</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{imageUri ? 'Yes' : 'No'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.mutedText }]}>Signature captured</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{hasSignature ? 'Yes' : 'No'}</Text>
          </View>
        </View>
      </ScrollView>

      <Modal visible={isImageModalVisible} animationType="fade" transparent onRequestClose={closeImageModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Capture photo</Text>
            <Text style={[styles.modalDescription, { color: theme.mutedText }]}>Use your camera to attach a proof-of-delivery photo.</Text>

            {isRequestingCameraPermission ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.accent} />
                <Text style={[styles.permissionMessage, { color: theme.mutedText }]}>Requesting camera access…</Text>
              </View>
            ) : cameraPermissionStatus === 'granted' ? (
              <>
                <View style={[styles.cameraPreviewWrapper, { borderColor: theme.border }]}>
                  <Camera ref={cameraRef} style={styles.cameraPreview} cameraType={CameraType.Back} />
                </View>
                {cameraError ? (
                  <Text style={[styles.cameraErrorText, { color: theme.accent }]}>{cameraError}</Text>
                ) : null}
                <View style={styles.modalButtons}>
                  <Pressable style={[styles.secondaryButton, { borderColor: theme.border }]} onPress={closeImageModal}>
                    <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.primaryButton, { backgroundColor: theme.accent }]}
                    onPress={() => {
                      void handleCapturePhoto();
                    }}
                  >
                    <Text style={[styles.primaryButtonText, { color: theme.accentText }]}>Capture</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text style={[styles.permissionMessage, { color: theme.mutedText }]}>Camera access is required to capture a delivery photo.</Text>
                <Text style={[styles.permissionMessage, { color: theme.mutedText }]}>Enable permissions in your device settings and try again.</Text>
                {cameraError ? (
                  <Text style={[styles.cameraErrorText, { color: theme.accent }]}>{cameraError}</Text>
                ) : null}
                <View style={styles.modalButtons}>
                  <Pressable style={[styles.secondaryButton, { borderColor: theme.border }]} onPress={closeImageModal}>
                    <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Close</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    gap: 16,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 16,
    marginTop: -6,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  label: {
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  noteInput: {
    minHeight: 120,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  signatureHint: {
    fontSize: 14,
  },
  primaryButton: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  imagePreviewWrapper: {
    gap: 12,
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 15,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  signatureCanvas: {
    height: 160,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signaturePlaceholder: {
    fontSize: 14,
  },
  signaturePoint: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalDescription: {
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  permissionMessage: {
    fontSize: 14,
    textAlign: 'center',
  },
  cameraPreviewWrapper: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    height: 360,
    backgroundColor: '#000',
  },
  cameraPreview: {
    flex: 1,
    width: '100%',
  },
  cameraErrorText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default App;
