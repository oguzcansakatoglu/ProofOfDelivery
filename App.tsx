/**
 * Proof of Delivery single page application.
 */

import React, { useMemo, useRef, useState } from 'react';
import {
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

type SignatureCanvasRef = {
  readSignature: () => void;
  clearSignature: () => void;
};

function AppContent(): JSX.Element {
  const safeAreaInsets = useSafeAreaInsets();
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [note, setNote] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isImageModalVisible, setImageModalVisible] = useState(false);
  const [isSignatureModalVisible, setSignatureModalVisible] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [draftSignatureData, setDraftSignatureData] = useState<string | null>(
    null,
  );
  const [signatureName, setSignatureName] = useState('');
  const [draftSignatureName, setDraftSignatureName] = useState('');

  const signatureRef = useRef<SignatureCanvasRef | null>(null);

  const hasSignature = useMemo(
    () => Boolean(signatureData && signatureData.length > 0),
    [signatureData],
  );

  const openImageModal = () => {
    setImageUrlInput(imageUri ?? '');
    setImageModalVisible(true);
  };

  const closeImageModal = () => {
    setImageModalVisible(false);
  };

  const confirmImageSelection = () => {
    const trimmed = imageUrlInput.trim();
    setImageUri(trimmed.length > 0 ? trimmed : null);
    setImageModalVisible(false);
  };

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

  const signatureCanvasStyle = useMemo(
    () => `
      .m-signature-pad--footer {
        display: none;
      }
      body, html {
        background: transparent;
      }
      .m-signature-pad {
        box-shadow: none;
        border: none;
      }
    `,
    [],
  );

  const handleSignatureOK = (signature: string) => {
    setDraftSignatureData(signature);
  };

  const handleSignatureEnd = () => {
    signatureRef.current?.readSignature();
  };

  const handleSignatureCleared = () => {
    setDraftSignatureData(null);
  };

  const handleSignatureClear = () => {
    signatureRef.current?.clearSignature();
    setDraftSignatureData(null);
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
              onPress={openImageModal}
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
                { borderColor: theme.border, backgroundColor: theme.card },
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
              </Pressable>
            </View>
          </View>
        </View>
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
            <View
              style={[
                styles.signatureCanvasWrapper,
                { borderColor: theme.border, backgroundColor: theme.card },
              ]}
            >
              <SignatureCanvas
                ref={ref => {
                  signatureRef.current = ref;
                }}
                onOK={handleSignatureOK}
                onEnd={handleSignatureEnd}
                onClear={handleSignatureCleared}
                autoClear={false}
                webStyle={signatureCanvasStyle}
                backgroundColor="transparent"
                dataURL={draftSignatureData ?? undefined}
                penColor={theme.text}
                style={styles.signatureCanvas}
              />
            </View>
            <Pressable
              style={[
                styles.secondaryButton,
                { borderColor: theme.border, alignSelf: 'flex-start' },
              ]}
              onPress={handleSignatureClear}
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
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
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
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
  },
  signatureCanvas: {
    flex: 1,
  },
});

export default App;
