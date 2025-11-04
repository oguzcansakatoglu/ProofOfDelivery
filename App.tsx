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
  strokes: Stroke[];
  onChange: (strokes: Stroke[]) => void;
};

function SignaturePad({ theme, strokes, onChange }: SignaturePadProps) {
  const strokeId = useRef(0);
  const strokesRef = useRef(strokes);

  useEffect(() => {
    strokesRef.current = strokes;
  }, [strokes]);

  useEffect(() => {
    const maxId = strokes.reduce((max, stroke) => Math.max(max, stroke.id), 0);
    strokeId.current = maxId;
  }, [strokes]);

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
          onChange([...strokesRef.current, newStroke]);
        },
        onPanResponderMove: event => {
          const { locationX, locationY } = event.nativeEvent;
          const current = strokesRef.current;
          if (current.length === 0) {
            return;
          }
          const updated = current.map((stroke, index) => {
            if (index !== current.length - 1) {
              return stroke;
            }
            return {
              ...stroke,
              points: [...stroke.points, { x: locationX, y: locationY }],
            };
          });
          onChange(updated);
        },
      }),
    [onChange],
  );

  const handleClear = () => {
    strokeId.current = 0;
    onChange([]);
  };

  return (
    <View style={styles.signaturePadContainer}>
      <View
        style={[styles.signatureCanvas, { backgroundColor: theme.background, borderColor: theme.border }]}
        {...panResponder.panHandlers}
      >
        {strokes.length === 0 ? (
          <Text style={[styles.signaturePlaceholder, { color: theme.mutedText }]}> 
            Sign inside the box
          </Text>
        ) : null}
        {strokes.map(stroke => {
          if (stroke.points.length === 0) {
            return null;
          }

          const strokeElements = [] as JSX.Element[];
          const strokeWidth = 6;
          const firstPoint = stroke.points[0];

          strokeElements.push(
            <View
              key={`${stroke.id}-start`}
              style={[
                styles.signaturePoint,
                {
                  backgroundColor: theme.text,
                  width: strokeWidth,
                  height: strokeWidth,
                  borderRadius: strokeWidth / 2,
                  left: firstPoint.x - strokeWidth / 2,
                  top: firstPoint.y - strokeWidth / 2,
                },
              ]}
            />,
          );

          for (let i = 1; i < stroke.points.length; i += 1) {
            const start = stroke.points[i - 1];
            const end = stroke.points[i];
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const length = Math.sqrt(dx * dx + dy * dy);

            if (length === 0) {
              continue;
            }

            const angle = Math.atan2(dy, dx);
            const midX = (start.x + end.x) / 2;
            const midY = (start.y + end.y) / 2;

            strokeElements.push(
              <View
                key={`${stroke.id}-${i}-segment`}
                style={[
                  styles.signatureSegment,
                  {
                    backgroundColor: theme.text,
                    width: length,
                    height: strokeWidth,
                    borderRadius: strokeWidth / 2,
                    left: midX - length / 2,
                    top: midY - strokeWidth / 2,
                    transform: [{ rotate: `${angle}rad` }],
                  },
                ]}
              />,
            );
          }

          const lastPoint = stroke.points[stroke.points.length - 1];
          strokeElements.push(
            <View
              key={`${stroke.id}-end`}
              style={[
                styles.signaturePoint,
                {
                  backgroundColor: theme.text,
                  width: strokeWidth,
                  height: strokeWidth,
                  borderRadius: strokeWidth / 2,
                  left: lastPoint.x - strokeWidth / 2,
                  top: lastPoint.y - strokeWidth / 2,
                },
              ]}
            />,
          );

          return strokeElements;
        })}
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
  const [isSignatureModalVisible, setSignatureModalVisible] = useState(false);
  const [signatureStrokes, setSignatureStrokes] = useState<Stroke[]>([]);
  const [draftSignatureStrokes, setDraftSignatureStrokes] = useState<Stroke[]>([]);

  const hasSignature = signatureStrokes.some(stroke => stroke.points.length > 0);

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
    setDraftSignatureStrokes(signatureStrokes);
    setSignatureModalVisible(true);
  };

  const closeSignatureModal = () => {
    setSignatureModalVisible(false);
  };

  const saveSignature = () => {
    setSignatureStrokes(draftSignatureStrokes);
    setSignatureModalVisible(false);
  };

  const signatureHasContent = draftSignatureStrokes.some(stroke => stroke.points.length > 0);

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
          <Text style={[styles.signatureHint, { color: theme.mutedText }]}>Capture a full-screen signature.</Text>
          <Pressable
            onPress={openSignatureModal}
            style={[styles.primaryButton, { backgroundColor: theme.accent }]}
          >
            <Text style={[styles.primaryButtonText, { color: theme.accentText }]}>
              {hasSignature ? 'Edit signature' : 'Capture signature'}
            </Text>
          </Pressable>
          <Text style={[styles.signatureStatus, { color: hasSignature ? theme.text : theme.mutedText }]}> 
            {hasSignature ? 'Signature captured' : 'No signature captured'}
          </Text>
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
              <Text style={[styles.signatureModalAction, { color: theme.mutedText }]}>Cancel</Text>
            </Pressable>
            <Text style={[styles.signatureModalTitle, { color: theme.text }]}>Capture signature</Text>
            <Pressable onPress={saveSignature}>
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
            <Text style={[styles.signatureHint, { color: theme.mutedText }]}>Use your finger to sign below.</Text>
            <SignaturePad theme={theme} strokes={draftSignatureStrokes} onChange={setDraftSignatureStrokes} />
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
  signaturePadContainer: {
    flex: 1,
    gap: 12,
    width: '100%',
  },
  signatureCanvas: {
    flex: 1,
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
    position: 'absolute',
  },
  signatureSegment: {
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
});

export default App;
