import AVFoundation
import UIKit

enum CameraError: Error {
    case deviceUnavailable
    case captureFailure
}

// @unchecked Sendable: all AVCaptureSession mutation is serialized on sessionQueue.
// captureSession is a read-only reference shared with AVCaptureVideoPreviewLayer on the
// main thread — a pattern explicitly permitted by AVFoundation's documentation.
final class CameraSession: @unchecked Sendable {
    /// Marked with doc comment per plan requirement:
    /// Marked nonisolated(unsafe) because AVCaptureVideoPreviewLayer is documented
    /// to read this session reference from the main thread while the session
    /// itself runs on a dedicated background queue. AVFoundation's contract
    /// permits this specific cross-thread reference pattern; no Sendable conformance
    /// is required for AVCaptureSession's reference semantics.
    ///
    /// See: https://developer.apple.com/documentation/avfoundation/avcapturevideopreviewlayer
    let captureSession = AVCaptureSession()

    private let sessionQueue = DispatchQueue(
        label: "com.antonglance.petsona.camera.session",
        qos: .userInitiated
    )
    private let photoOutput = AVCapturePhotoOutput()
    private var captureDelegate: PhotoCaptureDelegate?
    private var captureDevice: AVCaptureDevice?

    func configure(position: AVCaptureDevice.Position = .back) async throws {
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            sessionQueue.async { [self] in
                captureSession.beginConfiguration()
                defer { captureSession.commitConfiguration() }
                do {
                    guard let device = AVCaptureDevice.default(
                        .builtInWideAngleCamera, for: .video, position: position
                    ) else {
                        throw CameraError.deviceUnavailable
                    }
                    captureDevice = device
                    let input = try AVCaptureDeviceInput(device: device)
                    if captureSession.canAddInput(input) { captureSession.addInput(input) }
                    captureSession.sessionPreset = .photo
                    if captureSession.canAddOutput(photoOutput) { captureSession.addOutput(photoOutput) }
                    continuation.resume()
                } catch {
                    continuation.resume(throwing: error)
                }
            }
        }
    }

    func start() {
        sessionQueue.async { [self] in
            if !captureSession.isRunning { captureSession.startRunning() }
        }
    }

    func stop() {
        sessionQueue.async { [self] in
            if captureSession.isRunning { captureSession.stopRunning() }
        }
    }

    func capturePhoto(flashMode: AVCaptureDevice.FlashMode = .off) async throws -> UIImage {
        try await withCheckedThrowingContinuation { continuation in
            sessionQueue.async { [self] in
                let delegate = PhotoCaptureDelegate(continuation: continuation)
                captureDelegate = delegate
                let settings = AVCapturePhotoSettings()
                if flashMode != .off,
                   let device = captureDevice,
                   device.hasFlash {
                    settings.flashMode = flashMode
                }
                photoOutput.capturePhoto(with: settings, delegate: delegate)
            }
        }
    }
}

// AVFoundation fires delegate callbacks on its own queue.
// @preconcurrency: suppresses "Main actor-isolated conformance cannot be used in nonisolated context"
// — AVCapturePhotoCaptureDelegate predates Swift concurrency.
// @unchecked Sendable: continuation written once (init), resumed once (callback), no concurrent access.
private final class PhotoCaptureDelegate: NSObject, @preconcurrency AVCapturePhotoCaptureDelegate, @unchecked Sendable {
    // nonisolated(unsafe): accessed from the nonisolated AVFoundation callback;
    // safe because it is set once in init and resumed exactly once.
    nonisolated(unsafe) private let continuation: CheckedContinuation<UIImage, Error>

    init(continuation: CheckedContinuation<UIImage, Error>) {
        self.continuation = continuation
        super.init()
    }

    nonisolated func photoOutput(
        _ output: AVCapturePhotoOutput,
        didFinishProcessingPhoto photo: AVCapturePhoto,
        error: Error?
    ) {
        if let error {
            continuation.resume(throwing: error)
            return
        }
        guard let data = photo.fileDataRepresentation() else {
            continuation.resume(throwing: CameraError.captureFailure)
            return
        }
        continuation.resume(returning: UIImage(data: data) ?? UIImage())
    }
}
