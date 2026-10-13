import * as React from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Check,
  Loader2,
  AlertCircle,
  Camera,
  UserCheck,
  RotateCcw,
  BadgeX,
} from 'lucide-react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { STAGE_LABELS } from '@/lib/verification/config';
import { FAILURE_MESSAGES as FailureMessages } from '@/lib/verification/config';
import type { CameraService } from '@/lib/verification/face/camera-service';
import type { HumanEngine } from '@/lib/verification/face/human-engine';
import type {
  VerificationStatus,
  ParsedIdFields,
  ParsedBackFields,
  PortraitExtractionResult,
  FieldConfidence,
  FailureReason,
} from '@/lib/verification/types';
import { canTransition } from '@/lib/verification/state-machine';
import {
  createVerificationSessionFn,
  saveVerificationResultFn,
} from '@/server/verification-server';
import { processIdCard } from '@/lib/verification/verification-pipeline';
import { createHumanEngine } from '@/lib/verification/face/human-engine';
import {
  createLivenessSession,
  updateLivenessState,
} from '@/lib/verification/face/liveness';
import { createCameraService } from '@/lib/verification/face/camera-service';
import {
  computePortraitDescriptor,
  computeLiveDescriptor,
  compareDescriptors,
} from '@/lib/verification/face/face-matching';

const STEPS = [
  {
    key: 'upload',
    label: 'Upload ID',
    statuses: ['FRONT_UPLOAD', 'BACK_UPLOAD'] as VerificationStatus[],
  },
  {
    key: 'review',
    label: 'Review',
    statuses: ['REVIEW'] as VerificationStatus[],
  },
  {
    key: 'camera',
    label: 'Camera',
    statuses: ['CAMERA_PERMISSION', 'CAMERA_READY'] as VerificationStatus[],
  },
  {
    key: 'liveness',
    label: 'Liveness',
    statuses: ['LIVENESS'] as VerificationStatus[],
  },
  {
    key: 'match',
    label: 'Match',
    statuses: ['FACE_MATCHING'] as VerificationStatus[],
  },
  {
    key: 'result',
    label: 'Result',
    statuses: ['SAVING_RESULT', 'SUCCESS', 'FAILED'] as VerificationStatus[],
  },
];

export function VerificationWizard() {
  const [status, setStatus] = React.useState<VerificationStatus>('IDLE');
  const [frontFile, setFrontFile] = React.useState<File | null>(null);
  const [backFile, setBackFile] = React.useState<File | null>(null);
  const [parsedFields, setParsedFields] = React.useState<
    (ParsedIdFields & ParsedBackFields) | null
  >(null);
  const [_confidences, setConfidences] = React.useState<FieldConfidence[]>([]);
  const [portrait, setPortrait] =
    React.useState<PortraitExtractionResult | null>(null);
  const [failureReason, setFailureReason] =
    React.useState<FailureReason | null>(null);
  const [failureDetail, setFailureDetail] = React.useState<string>('');
  const [faceMatch, setFaceMatch] = React.useState<{
    matched: boolean;
    distance: number;
    similarity: number | null;
  } | null>(null);
  const [_livenessPassed, setLivenessPassed] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);
  const [attemptCount, setAttemptCount] = React.useState(1);
  const navigate = useNavigate();

  const currentStep =
    STEPS.find((s) => s.statuses.includes(status))?.key || 'upload';
  const stepIndex = STEPS.findIndex((s) => s.key === currentStep);
  const progress = stepIndex >= 0 ? ((stepIndex + 1) / STEPS.length) * 100 : 0;

  const transitionTo = (newStatus: VerificationStatus) => {
    if (canTransition(status, newStatus)) {
      setStatus(newStatus);
    }
  };

  const handleRetry = () => {
    setStatus('FRONT_UPLOAD');
    setFrontFile(null);
    setBackFile(null);
    setParsedFields(null);
    setConfidences([]);
    setPortrait(null);
    setFailureReason(null);
    setFailureDetail('');
    setFaceMatch(null);
    setLivenessPassed(false);
    setProcessing(false);
    setAttemptCount((c) => c + 1);
  };

  const handleFrontUpload = async (file: File) => {
    if (!file) {
      return;
    }
    setStatus('FRONT_UPLOAD');
    setFrontFile(file);
    transitionTo('BACK_UPLOAD');
  };

  const handleBackUpload = async (file: File) => {
    if (!file || !frontFile) return;
    setBackFile(file);
    setProcessing(true);
    transitionTo('PROCESSING_ID');
    try {
      const result = await processIdCard(frontFile, file, (stage) => {
        setStatus(stage.status);
      });
      setParsedFields(result.parsed);
      setConfidences(result.confidences);
      setPortrait(result.portrait);
      transitionTo('REVIEW');
    } catch (err) {
      const error = err as { message?: string };
      const msg = error.message || '';
      if (msg.startsWith('REQUIRED_FIELD_MISSING:')) {
        setFailureReason('REQUIRED_FIELD_MISSING');
        setFailureDetail(msg.split(':')[1]);
      } else {
        setFailureReason('OCR_FAILED');
      }
      transitionTo('FAILED');
    } finally {
      setProcessing(false);
    }
  };

  const handleStartCamera = async () => {
    transitionTo('CAMERA_PERMISSION');
    try {
      const camera = await createCameraService();
      await camera.start();
      transitionTo('CAMERA_READY');
      await startLiveness(camera);
    } catch (err) {
      const error = err as { message?: string };
      setFailureReason(
        (error.message as FailureReason) || 'CAMERA_UNAVAILABLE',
      );
      transitionTo('FAILED');
    }
  };

  const startLiveness = async (camera: CameraService) => {
    const video = camera.getVideoElement();
    if (!video) return;

    const liveness = createLivenessSession();
    const engine = createHumanEngine();
    await engine.init();

    let cancelled = false;
    const cleanup = () => {
      cancelled = true;
      engine.terminate();
    };

    const processFrame = async () => {
      if (cancelled) return;
      if (liveness.completed || liveness.failed) {
        await engine.terminate();
        if (liveness.completed) {
          setLivenessPassed(true);
          await runFaceMatch(camera, engine);
        } else {
          setFailureReason('LIVENESS_FAILED');
          transitionTo('FAILED');
        }
        return;
      }

      const result = await engine.detect(video);
      const { state: newLiveness, failed } = updateLivenessState(
        liveness,
        result,
      );
      Object.assign(liveness, newLiveness);

      if (failed) {
        cleanup();
        return;
      }

      if (!liveness.completed) {
        requestAnimationFrame(processFrame);
      }
    };

    requestAnimationFrame(processFrame);
  };

  const runFaceMatch = async (camera: CameraService, _engine: HumanEngine) => {
    transitionTo('FACE_MATCHING');
    const video = camera.getVideoElement();
    if (!video || !portrait) return;

    try {
      const [liveDesc, idDesc] = await Promise.all([
        computeLiveDescriptor(video),
        computePortraitDescriptor(
          portrait.imageData,
          portrait.width,
          portrait.height,
        ),
      ]);

      if (!liveDesc || !idDesc) {
        setFailureReason('FACE_MATCH_FAILED');
        transitionTo('FAILED');
        return;
      }

      const match = await compareDescriptors(
        liveDesc.descriptor,
        idDesc.descriptor,
      );
      setFaceMatch(match);

      if (match.matched) {
        transitionTo('SAVING_RESULT');
        await saveResult();
      } else {
        setFailureReason('FACE_MATCH_FAILED');
        transitionTo('FAILED');
      }
    } catch {
      setFailureReason('FACE_MATCH_FAILED');
      transitionTo('FAILED');
    }
  };

  const saveResult = async () => {
    if (!parsedFields) return;
    try {
      const sessionRes = await createVerificationSessionFn({
        data: { cardType: 'ruet-student-id', templateVersion: '1.0.0' },
      });
      await saveVerificationResultFn({
        data: {
          sessionId: sessionRes.sessionId,
          name: parsedFields.name,
          department: parsedFields.department,
          idNumber: parsedFields.idNumber,
          bloodGroup: parsedFields.bloodGroup,
          contactNumber: parsedFields.contactNumber,
          issueDate: parsedFields.issueDate.toISOString(),
          livenessPassed: true,
          faceMatchPassed: true,
          faceDistance: faceMatch?.distance ?? null,
          faceSimilarity: faceMatch?.similarity ?? null,
          failureReason: null,
          attemptCount,
        },
      });
      transitionTo('SUCCESS');
      setTimeout(() => navigate({ to: '/home' }), 2000);
    } catch {
      setFailureReason('UNKNOWN_ERROR');
      transitionTo('FAILED');
    }
  };

  const renderStep = () => {
    switch (status) {
      case 'FRONT_UPLOAD':
        return (
          <IdUpload
            step="front"
            file={frontFile}
            onUpload={handleFrontUpload}
            processing={processing}
          />
        );
      case 'BACK_UPLOAD':
        return (
          <IdUpload
            step="back"
            file={backFile}
            onUpload={handleBackUpload}
            processing={processing}
          />
        );
      case 'PROCESSING_ID':
      case 'OCR_PROCESSING':
      case 'PORTRAIT_EXTRACTION':
        return <ProcessingOverlay message={STAGE_LABELS[status]} />;
      case 'REVIEW':
        if (!parsedFields) return <ProcessingOverlay message="Loading..." />;
        return (
          <ReviewStep
            fields={parsedFields}
            onConfirm={handleStartCamera}
            onRetake={() => transitionTo('FRONT_UPLOAD')}
          />
        );
      case 'CAMERA_PERMISSION':
        return (
          <CameraPermission
            onAllow={handleStartCamera}
            onCancel={() => transitionTo('FAILED')}
          />
        );
      case 'CAMERA_READY':
        return <CameraReady onStart={handleStartCamera} />;
      case 'LIVENESS':
        return <LivenessStep />;
      case 'FACE_MATCHING':
        return <ProcessingOverlay message="Comparing faces..." />;
      case 'SAVING_RESULT':
        return <ProcessingOverlay message="Saving verification result..." />;
      case 'SUCCESS':
        return <SuccessStep onContinue={() => navigate({ to: '/home' })} />;
      case 'FAILED':
        return (
          <FailureStep
            reason={failureReason}
            detail={failureDetail}
            onRetry={handleRetry}
          />
        );
      default:
        return (
          <IdUpload
            step="front"
            file={frontFile}
            onUpload={handleFrontUpload}
            processing={processing}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Identity Verification</CardTitle>
          <p className="text-muted-foreground">Verify your identity securely</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            {STEPS.map((step, i) => (
              <div
                key={step.key}
                className="flex flex-col justify-center items-center"
              >
                <div
                  className={cn(
                    'flex items-center',
                    i < STEPS.length - 1 && 'flex-1',
                  )}
                >
                  <div
                    className={cn(
                      'relative flex h-10 w-10 items-center justify-center rounded-full',
                      i <= stepIndex
                        ? `${status === 'FAILED' ? 'bg-destructive brightness-75 text-primary-foreground' : 'bg-primary text-primary-foreground'} `
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {i < stepIndex ? (
                      status === 'FAILED' ? (
                        <BadgeX className="h-5 w-5" />
                      ) : (
                        <Check className="h-5 w-5" />
                      )
                    ) : (
                      <span className="text-sm font-medium">{i + 1}</span>
                    )}
                  </div>
                </div>
                <div className="text-center mt-1 hidden sm:block">
                  <p
                    className={cn(
                      'text-xs font-medium',
                      i <= stepIndex
                        ? 'text-foreground'
                        : 'text-muted-foreground',
                    )}
                  >
                    {step.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-1.5" />
          {renderStep()}
        </CardContent>
      </Card>
    </div>
  );
}

function IdUpload({
  step,
  file,
  onUpload,
  processing,
}: {
  step: 'front' | 'back';
  file: File | null;
  onUpload: (f: File) => void;
  processing: boolean;
}) {
  const [dragActive, setDragActive] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files[0]) onUpload(e.dataTransfer.files[0]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      onUpload(e.target.files[0]);
    }
  };

  const labels = { front: 'ID Card Front', back: 'ID Card Back' };
  const descriptions = {
    front:
      'Upload the front side of your ID card with photo and details visible',
    back: 'Upload the back side of your ID card with issue date visible',
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold">{labels[step]}</h3>
        <p className="text-sm text-muted-foreground">{descriptions[step]}</p>
      </div>
      <div
        role="application"
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 text-center transition-colors',
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50',
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleChange}
          disabled={processing}
        />
        {file ? (
          <div className="space-y-3">
            <img
              src={URL.createObjectURL(file)}
              alt="Preview"
              className="max-h-48 mx-auto rounded-lg border"
            />
            <p className="text-sm text-muted-foreground">
              {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onUpload(new File([], ''));
              }}
            >
              Replace
            </Button>
          </div>
        ) : (
          <>
            <div className="mx-auto w-12 h-12 rounded-full border-2 border-dashed border-primary flex items-center justify-center mb-3">
              <svg
                aria-label="nothing"
                className="h-6 w-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="text-muted-foreground">
              Drag & drop or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPEG, PNG, WebP · Max 15MB
            </p>
          </>
        )}
      </div>
      {file && !processing && (
        <Button
          className="w-full"
          onClick={() => {
            onUpload(file);
          }}
          disabled={processing}
        >
          Continue
        </Button>
      )}
      {processing && (
        <div className="text-center text-sm text-muted-foreground">
          Processing...
        </div>
      )}
    </div>
  );
}

function ProcessingOverlay({ message }: { message: string }) {
  return (
    <div className="text-center space-y-4 py-8">
      <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

function ReviewStep({
  fields,
  onConfirm,
  onRetake,
}: {
  fields: ParsedIdFields & ParsedBackFields;
  onConfirm: () => void;
  onRetake: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        Please review the extracted information
      </p>
      <div className="space-y-3">
        {[
          ['Name', fields.name],
          ['Department', fields.department],
          ['ID Number', fields.idNumber],
          ['Blood Group', fields.bloodGroup],
          ['Contact', fields.contactNumber],
          ['Issue Date', fields.issueDate.toISOString().split('T')[0]],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-right max-w-[70%] truncate">
              {value}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onRetake}>
          Retake ID
        </Button>
        <Button className="flex-1" onClick={onConfirm}>
          Continue to Camera
        </Button>
      </div>
    </div>
  );
}

function CameraPermission({
  onAllow,
  onCancel,
}: {
  onAllow: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="text-center space-y-4">
      <Camera className="h-16 w-16 text-muted-foreground mx-auto" />
      <h3 className="text-lg font-semibold">Camera Access Required</h3>
      <p className="text-muted-foreground text-sm">
        We need temporary camera access to verify that you are a live person.
        Your camera stream is processed for verification and is not stored.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onAllow}>Allow Camera</Button>
      </div>
    </div>
  );
}

function CameraReady({ onStart }: { onStart: () => void }) {
  return (
    <div className="text-center space-y-4">
      <div className="aspect-video bg-muted rounded-lg relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          Camera preview will appear here
        </div>
        <div className="absolute inset-0 border-4 border-primary/50 rounded-lg" />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            aria-label="nothing"
            className="h-24 w-24 text-primary/50"
            viewBox="0 0 100 100"
          >
            <ellipse
              cx="50"
              cy="40"
              rx="25"
              ry="30"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Position your face inside the frame
      </p>
      <Button className="w-full" onClick={onStart} size="lg">
        Start Verification
      </Button>
    </div>
  );
}

function LivenessStep() {
  return (
    <div className="text-center space-y-4">
      <div className="aspect-video bg-muted rounded-lg relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          Camera active - follow instructions
        </div>
        <div className="absolute inset-0 border-4 border-primary/50 rounded-lg" />
      </div>
      <div className="space-y-2">
        <p className="font-medium">Turn your head to the left</p>
        <div className="flex justify-center gap-1">
          <Badge variant="default">●</Badge>
          <Badge variant="outline">●</Badge>
          <Badge variant="outline">●</Badge>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Complete the current challenge
      </p>
    </div>
  );
}

function SuccessStep({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="text-center space-y-4 py-4">
      <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
        <UserCheck className="h-8 w-8 text-green-500" />
      </div>
      <h3 className="text-xl font-semibold">Verification Successful</h3>
      <p className="text-muted-foreground">
        Your identity has been successfully verified.
      </p>
      <Button className="w-full" onClick={onContinue} disabled>
        Redirecting to home...
      </Button>
    </div>
  );
}

function FailureStep({
  reason,
  detail,
  onRetry,
}: {
  reason: FailureReason | null;
  detail: string;
  onRetry: () => void;
}) {
  const msg =
    FailureMessages[reason || 'UNKNOWN_ERROR'] || FailureMessages.UNKNOWN_ERROR;
  return (
    <div className="text-center space-y-4 py-4">
      <div className="mx-auto w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-xl font-semibold">Verification Failed</h3>
      <Alert variant="destructive">
        <AlertDescription className="text-sm text-center">
          {msg}
        </AlertDescription>
      </Alert>
      {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
      <Button className="w-full" onClick={onRetry}>
        <RotateCcw className="mr-2 h-4 w-4" />
        Retry Verification
      </Button>
    </div>
  );
}

export default VerificationWizard;
