/**
 * Proof of Delivery single page application.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
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
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isImageModalVisible, setImageModalVisible] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

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
              onPress={openImageModal}
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
            <Text style={[styles.modalTitle, { color: theme.text }]}>Attach image</Text>
            <Text style={[styles.modalDescription, { color: theme.mutedText }]}>Paste an image URL to attach it to this proof.</Text>
            <TextInput
              value={imageUrlInput}
              onChangeText={setImageUrlInput}
              placeholder="https://example.com/photo.jpg"
              placeholderTextColor={theme.mutedText}
              style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalButtons}>
              <Pressable style={[styles.secondaryButton, { borderColor: theme.border }]} onPress={closeImageModal}>
                <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.primaryButton, { backgroundColor: theme.accent }]} onPress={confirmImageSelection}>
                <Text style={[styles.primaryButtonText, { color: theme.accentText }]}>Attach</Text>
              </Pressable>
            </View>
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
});

export default App;
