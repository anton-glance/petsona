import SwiftUI
import AVFoundation

// Takes CameraSession (@unchecked Sendable) rather than raw AVCaptureSession (non-Sendable)
// so Swift 6's region-based isolation checker can track the value safely.
struct CameraPreviewView: UIViewRepresentable {
    let cameraSession: CameraSession

    func makeUIView(context: Context) -> PreviewUIView {
        let view = PreviewUIView()
        view.backgroundColor = .black
        view.videoPreviewLayer.session = cameraSession.captureSession
        view.videoPreviewLayer.videoGravity = .resizeAspectFill
        return view
    }

    func updateUIView(_ uiView: PreviewUIView, context: Context) {}
}

final class PreviewUIView: UIView {
    override class var layerClass: AnyClass { AVCaptureVideoPreviewLayer.self }
    var videoPreviewLayer: AVCaptureVideoPreviewLayer { layer as! AVCaptureVideoPreviewLayer }
}
