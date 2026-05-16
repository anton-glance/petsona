import SwiftUI

struct WelcomeView: View {
    @Environment(OnboardingCoordinator.self) private var coordinator
    private let logger = Logger.petsona

    var body: some View {
        ZStack {
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
                    .petsona(.body)
                    .foregroundStyle(Color.inkSoft)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: 280)

                Spacer()

                // S01.1: 18pt gap between CTA button and terms footnote
                VStack(spacing: 0) {
                    PrimaryButton("Get started") {
                        coordinator.start()
                    }
                    .padding(.horizontal, Spacing.s5)

                    Spacer().frame(height: 18)

                    termsText
                        .padding(.horizontal, Spacing.s5)
                        .padding(.bottom, Spacing.s5)
                }
            }
        }
        .toolbar(.hidden, for: .navigationBar)
        // S01.2: handle petsona:// scheme for stub link taps
        .environment(\.openURL, OpenURLAction { url in
            switch url.host {
            case "terms":
                logger.debug("terms tapped")
            case "privacy":
                logger.debug("privacy tapped")
            default: break
            }
            return .handled
        })
    }

    // S01.2: Terms and Privacy as tappable hyperlinks via AttributedString markdown
    private var termsText: some View {
        Group {
            if let attributed = try? AttributedString(
                markdown: "By continuing, you agree to our [Terms of Use](petsona://terms) and [Privacy Policy](petsona://privacy).",
                options: AttributedString.MarkdownParsingOptions(interpretedSyntax: .inlineOnlyPreservingWhitespace)
            ) {
                Text(attributed)
                    .tint(Color.honeyDk)
            } else {
                Text("By continuing, you agree to our Terms of Use and Privacy Policy.")
            }
        }
        .font(.custom("DM Sans", size: 11))
        .foregroundStyle(Color.inkSoft)
        .multilineTextAlignment(.center)
    }
}

#Preview {
    WelcomeView()
        .environment(OnboardingCoordinator(
            permissionProvider: MockCameraPermissionProvider(state: .authorized)
        ))
}
