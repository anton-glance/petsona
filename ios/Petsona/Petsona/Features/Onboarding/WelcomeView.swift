import SwiftUI

struct WelcomeView: View {
    @Environment(OnboardingCoordinator.self) private var coordinator

    var body: some View {
        ZStack {
            // Gradient background: ivory (0%) → honeyTint (55%) → honeySoft (100%)
            LinearGradient(
                stops: [
                    .init(color: .ivory, location: 0),
                    .init(color: .honeyTint, location: 0.55),
                    .init(color: .honeySoft, location: 1)
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                Image("logo-icon-forest")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 170, height: 170)
                    .padding(.bottom, Spacing.s5)

                Text("Welcome to Petsona")
                    .petsona(.displayLg)
                    .foregroundStyle(Color.forestDk)
                    .multilineTextAlignment(.center)
                    .padding(.bottom, 6)

                Text("Every pet has a Petsona. Let's capture yours — breed, vitals, vet records, and a care plan tuned to them.")
                    .font(.custom("DM Sans", size: 13.5))
                    .foregroundStyle(Color.inkSoft)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: 260)

                Spacer()

                CtaStack {
                    PrimaryButton("Get started") {
                        coordinator.start()
                    }
                    Text("By continuing, you agree to our Terms of Use and Privacy Policy.")
                        .font(.custom("DM Sans", size: 10.5))
                        .foregroundStyle(Color.inkSoft)
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
