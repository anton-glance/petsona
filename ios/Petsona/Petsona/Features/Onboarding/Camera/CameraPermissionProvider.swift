import AVFoundation

final class CameraPermissionProvider: CameraPermissionProviding {
    var status: CameraPermissionState {
        AVCaptureDevice.authorizationStatus(for: .video).asCameraPermissionState
    }

    func requestAccess() async -> CameraPermissionState {
        let granted = await AVCaptureDevice.requestAccess(for: .video)
        return granted ? .authorized : .denied
    }
}

private extension AVAuthorizationStatus {
    var asCameraPermissionState: CameraPermissionState {
        switch self {
        case .notDetermined: .notDetermined
        case .authorized:    .authorized
        case .denied:        .denied
        case .restricted:    .restricted
        @unknown default:    .denied
        }
    }
}
