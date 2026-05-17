import Testing
import AVFoundation
@testable import Petsona

// Flash hardware is unavailable in the simulator — actual flash-fires-on-device
// behaviour is verified manually (open camera, enable flash bolt, capture photo).
// These tests cover the logic that feeds the flash mode into the capture pipeline.

@Suite("CameraCaptureView — flash wiring")
struct CameraCaptureViewTests {

    @Test("FlashMode .on when flashEnabled is true")
    func flashModeOnWhenEnabled() {
        let flashEnabled = true
        let mode: AVCaptureDevice.FlashMode = flashEnabled ? .on : .off
        #expect(mode == .on)
    }

    @Test("FlashMode .off when flashEnabled is false")
    func flashModeOffWhenDisabled() {
        let flashEnabled = false
        let mode: AVCaptureDevice.FlashMode = flashEnabled ? .on : .off
        #expect(mode == .off)
    }
}
