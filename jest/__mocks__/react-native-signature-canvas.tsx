import React, { forwardRef, useImperativeHandle } from 'react';
import { View } from 'react-native';

type Props = {
  onOK?: (signature: string) => void;
  onEnd?: () => void;
  onClear?: () => void;
};

type SignatureCanvasHandle = {
  readSignature: () => void;
  clearSignature: () => void;
};

const SignatureCanvas = forwardRef<SignatureCanvasHandle, Props>(
  (props, ref) => {
    useImperativeHandle(ref, () => ({
      readSignature: () => {
        props.onEnd?.();
        if (props.onOK) {
          props.onOK('data:image/png;base64,mock');
        }
      },
      clearSignature: () => {
        props.onClear?.();
      },
    }));

    return <View testID="signature-canvas-mock" />;
  },
);

export default SignatureCanvas;
