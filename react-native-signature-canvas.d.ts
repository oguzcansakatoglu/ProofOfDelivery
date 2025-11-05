declare module 'react-native-signature-canvas' {
  import { Component } from 'react';
  import { ViewProps } from 'react-native';

  export type SignatureViewRef = {
    readSignature: () => void;
    clearSignature: () => void;
  };

  export type SignatureCanvasProps = ViewProps & {
    onOK?: (signature: string) => void;
    onEmpty?: () => void;
    onEnd?: () => void;
    onClear?: () => void;
    autoClear?: boolean;
    webStyle?: string;
    backgroundColor?: string;
    dataURL?: string;
    penColor?: string;
    descriptionText?: string;
  };

  export default class SignatureCanvas extends Component<SignatureCanvasProps> {}
}
