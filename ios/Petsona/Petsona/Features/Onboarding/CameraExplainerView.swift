import SwiftUI

struct CameraExplainerView: View {
    @Environment(OnboardingCoordinator.self) private var coordinator
    @State private var isRequesting = false

    var body: some View {
        ScreenContainer {
            VStack(spacing: 0) {
                ScrollView {
                    VStack(alignment: .leading, spacing: Spacing.s5) {
                        VStack(alignment: .leading, spacing: Spacing.s2) {
                            SmallCap("Step 1 of 3", color: Color.honeyDk)
                            // S02.3: minimumScaleFactor guards against wrapping at 21pt on iPhone SE
                            Text("Petsona needs your camera.")
                                .petsona(.displayMd)
                                .foregroundStyle(Color.colorPrimary)
                                .minimumScaleFactor(0.9)
                                .lineLimit(1)
                            Text("Two ways your camera makes Petsona work:")
                                .petsona(.body)
                                .foregroundStyle(Color.colorTextMuted)
                        }
                        .padding(.top, Spacing.s6)

                        // S02.2: animated slideshow replaces the static placeholder block
                        SlideshowPreview()

                        // S02.1: glass-thin circle chip replaces dark-forest square container
                        BenefitRow(
                            symbol: "camera",
                            title: "Quick check-up of anything off",
                            description: "Snap a photo when something looks wrong. We tell you if it's calm, watch, or urgent."
                        )
                        BenefitRow(
                            symbol: "list.bullet",
                            title: "A timeline that builds itself",
                            description: "Photos, receipts, vet documents — all auto-filed to your pet's story."
                        )
                    }
                    .padding(.horizontal, Spacing.s5)
                }

                CtaStack {
                    PrimaryButton("Allow access", isEnabled: !isRequesting) {
                        isRequesting = true
                        Task {
                            await coordinator.requestCameraPermission()
                            isRequesting = false
                        }
                    }
                }
            }
        }
        .toolbar(.hidden, for: .navigationBar)
    }
}

// MARK: - Slideshow preview (S02.2)

private struct SlideshowPreview: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var displayIndex = 0
    @State private var scale: CGFloat = 1.0
    @State private var flashWhiteOpacity: Double = 0
    @State private var flashDarkOpacity: Double = 0

    // When Anton has real pet photos, add them to assets/brand/slideshow/
    // and swap this array to read from that folder.
    private let slides: [(imageName: String, background: Color)] = [
        ("logo-icon-honey",  Color.forest),
        ("logo-icon-forest", Color.honeyTint),
        ("logo-icon-ink",    Color.ivory),
        ("logo-icon-ivory",  Color.night)
    ]

    var body: some View {
        ZStack {
            // Slide background
            slides[displayIndex].background
                .animation(.easeInOut(duration: 0.11), value: displayIndex)

            // Slide logo
            Image(slides[displayIndex].imageName)
                .resizable()
                .scaledToFit()
                .padding(40)
                .scaleEffect(scale)

            // Flash overlays for shutter effect
            Color.white.opacity(flashWhiteOpacity)
            Color.black.opacity(flashDarkOpacity)

            // Viewfinder corner brackets — static, frame the slideshow
            ViewfinderBrackets()
                .stroke(Color.honeyDk, lineWidth: 2.5)
                .padding(24)
        }
        .aspectRatio(1.3, contentMode: .fit)
        .clipShape(RoundedRectangle(cornerRadius: BorderRadius.lg, style: .continuous))
        .task {
            do { try await runSlideshow() } catch {}
        }
    }

    private func runSlideshow() async throws {
        while true {
            try await Task.sleep(for: .milliseconds(750))

            if reduceMotion {
                withAnimation(.easeInOut(duration: Motion.medium)) {
                    displayIndex = (displayIndex + 1) % slides.count
                }
            } else {
                // Zoom in: 60ms ease-out
                withAnimation(.easeOut(duration: 0.06)) { scale = 1.05 }
                try await Task.sleep(for: .milliseconds(60))

                // Flash white: 40ms
                withAnimation(.linear(duration: 0.04)) { flashWhiteOpacity = 0.3 }
                try await Task.sleep(for: .milliseconds(40))

                // Swap slide while obscured
                displayIndex = (displayIndex + 1) % slides.count

                // Flash dark + clear white: 40ms
                withAnimation(.linear(duration: 0.04)) {
                    flashWhiteOpacity = 0
                    flashDarkOpacity = 0.4
                }
                try await Task.sleep(for: .milliseconds(40))

                // Zoom out + clear dark: 110ms ease-in-out
                withAnimation(.easeInOut(duration: 0.11)) {
                    flashDarkOpacity = 0
                    scale = 1.0
                }
                try await Task.sleep(for: .milliseconds(110))
            }
        }
    }
}

// MARK: - Benefit row (S02.1: glass-thin circle chip, no dark-forest container)

private struct BenefitRow: View {
    let symbol: String
    let title: String
    let description: String

    var body: some View {
        HStack(alignment: .top, spacing: Spacing.s4) {
            // S02.1: small glass-thin circle chip (option a — softer, reads well on ivory)
            Image(systemName: symbol)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(Color.ink)
                .frame(width: 28, height: 28)
                .glassBackground(tier: .thin, shape: Circle())
                .padding(.top, 1)

            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.petsonaBodyLg)
                    .fontWeight(.semibold)
                    .foregroundStyle(Color.colorTextDefault)
                Text(description)
                    .petsona(.body)
                    .foregroundStyle(Color.colorTextMuted)
            }
        }
    }
}

// MARK: - Viewfinder corner brackets shape

private struct ViewfinderBrackets: Shape {
    func path(in rect: CGRect) -> Path {
        let len: CGFloat = 20
        var p = Path()
        p.move(to: CGPoint(x: rect.minX, y: rect.minY + len))
        p.addLine(to: CGPoint(x: rect.minX, y: rect.minY))
        p.addLine(to: CGPoint(x: rect.minX + len, y: rect.minY))
        p.move(to: CGPoint(x: rect.maxX - len, y: rect.minY))
        p.addLine(to: CGPoint(x: rect.maxX, y: rect.minY))
        p.addLine(to: CGPoint(x: rect.maxX, y: rect.minY + len))
        p.move(to: CGPoint(x: rect.maxX, y: rect.maxY - len))
        p.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
        p.addLine(to: CGPoint(x: rect.maxX - len, y: rect.maxY))
        p.move(to: CGPoint(x: rect.minX + len, y: rect.maxY))
        p.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
        p.addLine(to: CGPoint(x: rect.minX, y: rect.maxY - len))
        return p
    }
}

#Preview {
    CameraExplainerView()
        .environment(OnboardingCoordinator(
            permissionProvider: MockCameraPermissionProvider(state: .authorized)
        ))
}
