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
        // G3: Single Done toolbar defined once at the root.
        // NavigationStack aggregates toolbar items from all descendants,
        // so putting it here avoids N copies when N CompactFields are on screen.
        .toolbar {
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button {
                    UIApplication.shared.endEditing()
                } label: {
                    Text("Done")
                        .font(.petsonaBody)
                        .fontWeight(.semibold)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(Capsule().fill(Color.colorSurfaceElev))
                }
                .padding(.bottom, 14)
                .padding(.trailing, Spacing.s3)
            }
        }
    }
}
