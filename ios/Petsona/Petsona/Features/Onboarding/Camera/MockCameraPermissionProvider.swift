#if DEBUG
final class MockCameraPermissionProvider: CameraPermissionProviding {
    private let stubbedState: CameraPermissionState

    init(state: CameraPermissionState) {
        self.stubbedState = state
    }

    var status: CameraPermissionState {
        get async { stubbedState }
    }

    func requestAccess() async -> CameraPermissionState {
        stubbedState
    }
}
#endif
