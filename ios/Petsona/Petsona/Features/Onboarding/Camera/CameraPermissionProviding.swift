import Foundation

enum CameraPermissionState: Sendable {
    case notDetermined
    case authorized
    case denied
    case restricted
}

protocol CameraPermissionProviding: Sendable {
    var status: CameraPermissionState { get }
    func requestAccess() async -> CameraPermissionState
}
