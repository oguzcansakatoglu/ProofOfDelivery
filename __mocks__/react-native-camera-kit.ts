import React, { useImperativeHandle } from 'react';

type CaptureResult = {
  uri: string;
};

type CameraHandle = {
  capture: () => Promise<CaptureResult>;
};

export const CameraType = {
  Back: 'back',
  Front: 'front',
} as const;

export const Camera = React.forwardRef<CameraHandle>((_props, ref) => {
  const capture = async () => ({ uri: 'mock://photo.jpg' });

  useImperativeHandle(ref, () => ({ capture }));

  return null;
});

(Camera as unknown as { requestDeviceCameraAuthorization: () => Promise<boolean> }).requestDeviceCameraAuthorization = async () => true;
