export interface CameraService {
  start(facingMode?: 'user' | 'environment'): Promise<MediaStream>;
  stop(): void;
  getStream(): MediaStream | null;
  getVideoElement(): HTMLVideoElement | null;
}

export async function createCameraService(): Promise<CameraService> {
  let stream: MediaStream | null = null;
  let video: HTMLVideoElement | null = null;

  return {
    async start(facingMode = 'user'): Promise<MediaStream> {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('CAMERA_UNAVAILABLE');
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });

        video = document.createElement('video');
        video.srcObject = stream;
        video.playsInline = true;
        video.muted = true;
        await video.play();
        return stream;
      } catch (err) {
        const error = err as { name?: string };
        if (
          error.name === 'NotAllowedError' ||
          error.name === 'PermissionDeniedError'
        ) {
          throw new Error('CAMERA_PERMISSION_DENIED');
        }
        if (
          error.name === 'NotFoundError' ||
          error.name === 'DevicesNotFoundError'
        ) {
          throw new Error('CAMERA_UNAVAILABLE');
        }
        if (error.name === 'NotReadableError') {
          throw new Error('CAMERA_UNAVAILABLE');
        }
        throw new Error('CAMERA_UNAVAILABLE');
      }
    },

    stop(): void {
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        stream = null;
      }
      if (video) {
        video.srcObject = null;
        video = null;
      }
    },

    getStream(): MediaStream | null {
      return stream;
    },

    getVideoElement(): HTMLVideoElement | null {
      return video;
    },
  };
}

export async function enumerateCameras(): Promise<MediaDeviceInfo[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((d) => d.kind === 'videoinput');
}
