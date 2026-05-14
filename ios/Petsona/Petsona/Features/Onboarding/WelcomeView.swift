import SwiftUI

struct WelcomeView: View {
    @Environment(OnboardingCoordinator.self) private var coordinator

    var body: some View {
        ZStack {
            Color.colorSurface.ignoresSafeArea()
            VStack(spacing: 0) {
                Spacer()
                Image("logo-icon-forest")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 72, height: 72)
                    .padding(.bottom, Spacing.s5)

                Text("Welcome to Petsona")
                    .petsona(.displayLg)
                    .foregroundStyle(Color.colorTextDefault)
                    .multilineTextAlignment(.center)
                    .padding(.bottom, Spacing.s3)

                Text("Every pet has a Petsona. Let's capture yours — breed, vitals, vet records, and a care plan tuned to them.")
                    .petsona(.body)
                    .foregroundStyle(Color.colorTextSoft)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, Spacing.s5)

                Spacer()

                CtaStack {
                    PrimaryButton("Get started") {
                        coordinator.start()
                    }
                    Text("By continuing, you agree to our Terms of Use and Privacy Policy.")
                        .petsona(.caption)
                        .foregroundStyle(Color.colorTextMuted)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, Spacing.s4)
                }
            }
        }
        .toolbar(.hidden, for: .navigationBar)
    }
}

#Preview {
    WelcomeView()
        .environment(OnboardingCoordinator(
            permissionProvider: MockCameraPermissionProvider(state: .authorized)
        ))
}
