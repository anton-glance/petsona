import Testing
@testable import Petsona

@MainActor
@Suite("CameraPermission")
struct CameraPermissionTests {

    @Test("Granted permission routes coordinator to camera capture")
    func testGrantedPathRoutesToCamera() async {
        let c = OnboardingCoordinator(
            permissionProvider: MockCameraPermissionProvider(state: .authorized),
            collectionAdvanceDelay: .zero
        )
        c.start()
        await c.requestCameraPermission()
        let hasCamera = c.path.contains {
            if case .cameraCapture = $0 { return true }
            return false
        }
        #expect(hasCamera)
    }

    @Test("Denied permission routes coordinator to permission denied screen")
    func testDeniedPathRoutesToPermissionDenied() async {
        let c = OnboardingCoordinator(
            permissionProvider: MockCameraPermissionProvider(state: .denied),
            collectionAdvanceDelay: .zero
        )
        c.start()
        await c.requestCameraPermission()
        #expect(c.path.contains(.cameraPermissionDenied))
    }

    @Test("Re-checking denied permission does not push denied screen twice")
    func testReCheckAfterDeniedStaysOnDeniedScreen() async {
        let c = OnboardingCoordinator(
            permissionProvider: MockCameraPermissionProvider(state: .denied),
            collectionAdvanceDelay: .zero
        )
        c.start()
        await c.requestCameraPermission()
        await c.requestCameraPermission()
        let count = c.path.filter { $0 == .cameraPermissionDenied }.count
        #expect(count == 1)
    }
}
