import SwiftUI

struct ContentView: View {
    @Environment(OnboardingCoordinator.self) private var coordinator

    var body: some View {
        @Bindable var coordinator = coordinator
        NavigationStack(path: $coordinator.path) {
            WelcomeView()
                .navigationDestination(for: OnboardingStep.self) { step in
                    switch step {
                    case .cameraExplainer:
                        CameraExplainerView()
                    case .cameraPermissionDenied:
                        CameraPermissionDeniedView()
                    case .cameraCapture(let slot):
                        CameraCaptureView(slot: slot)
                    case .photoCollection:
                        PhotoCollectionView()
                    case .profileReview:
                        ProfileReviewView(onContinue: {})
                    default:
                        EmptyView()
                    }
                }
        }
    }
}
