/**
 * Proof of Delivery single page application.
 */

import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import React, { useMemo, useRef, useState } from 'react';
import { Camera, CameraType } from 'react-native-camera-kit';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import SignatureCanvas from 'react-native-signature-canvas';

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

 

function AppContent(): JSX.Element {
  const safeAreaInsets = useSafeAreaInsets();
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [note, setNote] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isImageModalVisible, setImageModalVisible] = useState(false);
  const [isSignatureModalVisible, setSignatureModalVisible] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [draftSignatureData, setDraftSignatureData] = useState<string | null>(
    null,
  );
  const [signatureName, setSignatureName] = useState('');
  const [draftSignatureName, setDraftSignatureName] = useState('');

  const [signatureKey, setSignatureKey] = useState(0);

  const hasSignature = useMemo(
    () => Boolean(signatureData && signatureData.length > 0),
    [signatureData],
  );
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

  const openSignatureModal = () => {
    setDraftSignatureData(signatureData);
    setDraftSignatureName(signatureName);
    setSignatureModalVisible(true);
  };

  const closeSignatureModal = () => {
    setSignatureModalVisible(false);
  };

  const saveSignature = () => {
    if (!draftSignatureData || draftSignatureData.length === 0) {
      return;
    }

    setSignatureData(draftSignatureData);
    setSignatureName(draftSignatureName.trim());
    setSignatureModalVisible(false);
  };

  const signatureHasContent = useMemo(
    () => Boolean(draftSignatureData && draftSignatureData.length > 0),
    [draftSignatureData],
  );

   
 

  const [isLoading, setIsLoading] = useState(false);
  const ref = useRef();

  const handleSignature = (signature) => {
    console.log('Signature captured:', signature);
    setDraftSignatureData(signature);
    setIsLoading(false);
  };

  const handleEmpty = () => {
    console.log('Signature is empty');
    setDraftSignatureData(null);
    setIsLoading(false);
  };

  const handleClear = () => {
    console.log('Signature cleared');
    setDraftSignatureData(null);
    setIsLoading(false);
    setSignatureKey(prev => prev + 1); // Force remount
  };

  const handleError = (error) => {
    console.error('Signature pad error:', error);
    setIsLoading(false);
  };

  const handleEnd = () => {
    setIsLoading(true);
    ref.current?.readSignature();
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
        <Text style={[styles.heading, { color: theme.text }]}>
          Proof of delivery
        </Text>
        <Text style={[styles.subheading, { color: theme.mutedText }]}>
          Capture a note, photo, or signature
        </Text>

        <View
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.label, { color: theme.mutedText }]}>
            Delivery note
          </Text>
          <TextInput
            placeholder="Add important delivery details..."
            placeholderTextColor={theme.mutedText}
            multiline
            style={[styles.noteInput, { color: theme.text }]}
            value={note}
            onChangeText={setNote}
          />
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Photo attachment
            </Text>
            <Pressable
              onPress={() => {
                void openImageModal();
              }}
              style={[styles.primaryButton, { backgroundColor: theme.accent }]}
            >
              <Text
                style={[styles.primaryButtonText, { color: theme.accentText }]}
              >
                {imageUri ? 'Change image' : 'Add image'}
              </Text>
            </Pressable>
          </View>

          {imageUri ? (
            <View style={styles.imagePreviewWrapper}>
              <Image
                source={{ uri: imageUri }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
              <Pressable
                style={[styles.secondaryButton, { borderColor: theme.border }]}
                onPress={handleRemoveImage}
              >
                <Text
                  style={[styles.secondaryButtonText, { color: theme.text }]}
                >
                  Remove image
                </Text>
              </Pressable>
            </View>
          ) : (
            <Text style={[styles.emptyStateText, { color: theme.mutedText }]}>
              No image attached
            </Text>
          )}
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Signature
          </Text>
          <Text style={[styles.signatureHint, { color: theme.mutedText }]}>
            Capture a full-screen signature.
          </Text>
          <Pressable
            onPress={openSignatureModal}
            style={[styles.primaryButton, { backgroundColor: theme.accent }]}
          >
            <Text
              style={[styles.primaryButtonText, { color: theme.accentText }]}
            >
              {hasSignature ? 'Edit signature' : 'Capture signature'}
            </Text>
          </Pressable>
          <Text
            style={[
              styles.signatureStatus,
              { color: hasSignature ? theme.text : theme.mutedText },
            ]}
          >
            {hasSignature ? 'Signature captured' : 'No signature captured'}
          </Text>
          {hasSignature && signatureData ? (
            <Image
              source={{ uri: signatureData }}
              style={[
                styles.signaturePreview,
                { borderColor: theme.border, backgroundColor: "white" },
              ]}
              resizeMode="contain"
            />
          ) : null}
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Summary
          </Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.mutedText }]}>
              Note characters
            </Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>
              {note.trim().length}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.mutedText }]}>
              Image attached
            </Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>
              {imageUri ? 'Yes' : 'No'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.mutedText }]}>
              Signature captured
            </Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>
              {hasSignature ? 'Yes' : 'No'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.mutedText }]}>
              Signature name
            </Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>
              {signatureName.length > 0 ? signatureName : 'Not provided'}
            </Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={isImageModalVisible}
        animationType="fade"
        transparent
        onRequestClose={closeImageModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Attach image
            </Text>
            <Text style={[styles.modalDescription, { color: theme.mutedText }]}>
              Paste an image URL to attach it to this proof.
            </Text>
            <TextInput
              value={imageUrlInput}
              onChangeText={setImageUrlInput}
              placeholder="https://example.com/photo.jpg"
              placeholderTextColor={theme.mutedText}
              style={[
                styles.modalInput,
                { color: theme.text, borderColor: theme.border },
              ]}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.secondaryButton, { borderColor: theme.border }]}
                onPress={closeImageModal}
              >
                <Text
                  style={[styles.secondaryButtonText, { color: theme.text }]}
                >
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.primaryButton,
                  { backgroundColor: theme.accent },
                ]}
                onPress={confirmImageSelection}
              >
                <Text
                  style={[
                    styles.primaryButtonText,
                    { color: theme.accentText },
                  ]}
                >
                  Attach
                </Text>
      <Modal visible={isImageModalVisible} animationType="fade" onRequestClose={closeImageModal} statusBarTranslucent>
        {isRequestingCameraPermission ? (
          <View style={[styles.fullScreenContainer, { backgroundColor: theme.background }]}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.accent} />
              <Text style={[styles.permissionMessage, { color: theme.mutedText }]}>Requesting camera access…</Text>
            </View>
          </View>
        ) : cameraPermissionStatus === 'granted' ? (
          <View style={styles.fullScreenContainer}>
            <Camera ref={cameraRef} style={styles.fullScreenCamera} cameraType={CameraType.Back} />
            <View style={styles.cameraOverlay}>
              <View style={styles.cameraTopBar}>
                {cameraError ? (
                  <View style={[styles.errorBanner, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                    <Text style={[styles.cameraErrorText, { color: '#ffffff' }]}>{cameraError}</Text>
                  </View>
                ) : null}
              </View>
              <View style={[styles.cameraBottomBar, { paddingBottom: safeAreaInsets.bottom + 20 }]}>
                <Pressable 
                  style={[styles.cameraNativeButton, { backgroundColor: 'rgba(0,0,0,0.4)' }]} 
                  onPress={closeImageModal}
                >
                  <Text style={styles.cameraNativeButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={styles.captureButtonNative}
                  onPress={() => {
                    void handleCapturePhoto();
                  }}
                >
                  <View style={styles.captureButtonInner} />
                </Pressable>
                <View style={styles.cameraNativeButton} />
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.fullScreenContainer, { backgroundColor: theme.background }]}>
            <View style={[styles.permissionDeniedContainer, { backgroundColor: theme.card }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Camera Access Required</Text>
              <Text style={[styles.permissionMessage, { color: theme.mutedText }]}>Camera access is required to capture a delivery photo.</Text>
              <Text style={[styles.permissionMessage, { color: theme.mutedText }]}>Enable permissions in your device settings and try again.</Text>
              {cameraError ? (
                <Text style={[styles.cameraErrorText, { color: theme.accent }]}>{cameraError}</Text>
              ) : null}
              <Pressable style={[styles.primaryButton, { backgroundColor: theme.accent }]} onPress={closeImageModal}>
                <Text style={[styles.primaryButtonText, { color: theme.accentText }]}>Close</Text>
              </Pressable>
            </View>
          </View>
        )}
      </Modal>

      <Modal
        visible={isSignatureModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeSignatureModal}
      >
        <View
          style={[
            styles.signatureModalContainer,
            {
              backgroundColor: theme.background,
              paddingTop: safeAreaInsets.top + 16,
              paddingBottom: safeAreaInsets.bottom + 24,
            },
          ]}
        >
          <View style={styles.signatureModalHeader}>
            <Pressable onPress={closeSignatureModal}>
              <Text
                style={[
                  styles.signatureModalAction,
                  { color: theme.mutedText },
                ]}
              >
                Cancel
              </Text>
            </Pressable>
            <Text style={[styles.signatureModalTitle, { color: theme.text }]}>
              Capture signature
            </Text>
            <Pressable onPress={saveSignature} disabled={!signatureHasContent}>
              <Text
                style={[
                  styles.signatureModalAction,
                  {
                    color: theme.accent,
                    opacity: signatureHasContent ? 1 : 0.5,
                  },
                ]}
              >
                Save
              </Text>
            </Pressable>
          </View>
          <View style={styles.signatureModalBody}>
            <Text style={[styles.signatureHint, { color: theme.mutedText }]}>
              Use your finger to sign below.
            </Text>
            <TextInput
              value={draftSignatureName}
              onChangeText={setDraftSignatureName}
              placeholder="Signer name"
              placeholderTextColor={theme.mutedText}
              style={[
                styles.signatureNameInput,
                { color: theme.text, borderColor: theme.border },
              ]}
            />
         <View style={styles.container}>
      {draftSignatureData && !isLoading ? (
        <View style={styles.preview}>
          <Image
            resizeMode="contain"
            style={{ width: 335, height: 114 }}
            source={{ uri: draftSignatureData }}
          />
        </View>
      ) : (
        <View style={styles.signatureCanvasContainer}>

        <SignatureCanvas
        key={signatureKey}
        ref={ref}
        onEnd={handleEnd}
        onOK={handleSignature}
        onEmpty={handleEmpty}
        onClear={handleClear}
        onError={handleError}
        autoClear={false}
        descriptionText=""
        clearText=""
        confirmText=""
        penColor="#000000"
        backgroundColor="rgba(255,255,255,0)"
        webviewProps={{
          cacheEnabled: true,
          androidLayerType: "hardware",
        }}
      />
      </View>

      )}
    </View>
            <Pressable
              style={[
                styles.secondaryButton,
                { borderColor: theme.border, alignSelf: 'flex-start' },
              ]}
              onPress={handleClear}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
                Clear signature
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({

  signatureCanvasContainer: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    overflow: 'hidden',
  },
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
  signatureStatus: {
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
  signaturePreview: {
    width: '100%',
    height: 140,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullScreenCamera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  cameraTopBar: {
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 8,
  },
  cameraBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  cameraNativeButton: {
    width: 80,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  cameraNativeButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
  },
  captureButtonNative: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  captureButtonInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#ffffff',
  },
  permissionDeniedContainer: {
    margin: 24,
    padding: 24,
    borderRadius: 20,
    gap: 16,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
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
  cameraErrorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  signatureModalContainer: {
    flex: 1,
    paddingHorizontal: 24,
    gap: 24,
  },
  signatureModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  signatureModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  signatureModalAction: {
    fontSize: 16,
    fontWeight: '600',
  },
  signatureModalBody: {
    flex: 1,
    gap: 16,
  },
  signatureNameInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  signatureCanvasWrapper: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    height: 280,
    position: 'relative',
  },
  signatureCanvasBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  signatureCanvas: {
    flex: 1,
    zIndex: 1,
  },
  preview: {
    width: '100%',
    height: 280,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
 
});

export default App;
export default App;
