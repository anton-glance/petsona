import SwiftUI

struct PhotoCollectionView: View {
    @Environment(OnboardingCoordinator.self) private var coordinator
    @State private var hasTriggeredAdvance = false

    private var collectionState: Int {
        let p = coordinator.capturedPhotos
        let allDone = p.front != nil && p.side != nil &&
                      (p.document != nil || coordinator.isDocumentSkipped)
        if allDone { return 3 }
        if p.front != nil && p.side != nil { return 2 }
        return 1
    }

    var body: some View {
        ScreenContainer {
            VStack(spacing: 0) {
                ScrollView {
                    VStack(alignment: .leading, spacing: Spacing.s5) {
                        VStack(alignment: .leading, spacing: Spacing.s2) {
                            Text(headline)
                                .petsona(.displayMd)
                                .foregroundStyle(Color.colorTextDefault)
                            Text(subline)
                                .petsona(.body)
                                .foregroundStyle(Color.colorTextSoft)
                        }
                        .padding(.top, Spacing.s6)

                        // Photo cards
                        VStack(spacing: Spacing.s3) {
                            photoRow(
                                slot: .front,
                                title: "Front photo",
                                subtitle: coordinator.capturedPhotos.front != nil
                                    ? "Captured · face and chest visible"
                                    : "Face and chest visible",
                                isCaptured: coordinator.capturedPhotos.front != nil,
                                isActive: coordinator.capturedPhotos.front == nil,
                                accessibilityID: "front-photo-row"
                            )
                            photoRow(
                                slot: .side,
                                title: "Side photo",
                                subtitle: coordinator.capturedPhotos.side != nil
                                    ? "Captured"
                                    : "Profile shot · full body if possible",
                                isCaptured: coordinator.capturedPhotos.side != nil,
                                isActive: coordinator.capturedPhotos.front != nil && coordinator.capturedPhotos.side == nil,
                                accessibilityID: "side-photo-row"
                            )
                            photoRow(
                                slot: .document,
                                title: "Vet passport / DNA test",
                                subtitle: coordinator.capturedPhotos.document != nil
                                    ? "Captured"
                                    : "Any document with breed, vitals, or vaccinations",
                                isCaptured: coordinator.capturedPhotos.document != nil,
                                isActive: collectionState == 2,
                                accessibilityID: "vet-photo-row"
                            )
                        }
                    }
                    .padding(.horizontal, Spacing.s5)
                }

                CtaStack {
                    if collectionState == 3 {
                        Spinner()
                            .padding(.vertical, Spacing.s4)
                    } else if collectionState == 2 {
                        PrimaryButton("Capture document") {
                            coordinator.navigateToCamera(slot: .document)
                        }
                        SecondaryButton("Skip vet docs") {
                            coordinator.skipDocument()
                        }
                    } else {
                        PrimaryButton("Capture side photo") {
                            coordinator.navigateToCamera(slot: .side)
                        }
                    }
                }
            }
        }
        .toolbar(.hidden, for: .navigationBar)
        .onChange(of: collectionState) { _, newState in
            if newState == 3 && !hasTriggeredAdvance {
                hasTriggeredAdvance = true
                Task { await coordinator.advanceFromCollection() }
            }
        }
    }

    // MARK: - Headline/subline per state

    private var headline: String {
        switch collectionState {
        case 2: "Got a document for Mochi?"
        case 3: "Everything captured."
        default: "Now, a side view."
        }
    }

    private var subline: String {
        switch collectionState {
        case 2: "Vet passport, DNA test, or any record — speeds up your profile."
        case 3: "Ready to read what these photos tell us about Mochi."
        default: "Different angles help us read breed traits accurately."
        }
    }

    // MARK: - Photo row

    @ViewBuilder
    private func photoRow(
        slot: PhotoSlot,
        title: String,
        subtitle: String,
        isCaptured: Bool,
        isActive: Bool,
        accessibilityID: String
    ) -> some View {
        Button {
            if !isCaptured && isActive {
                coordinator.navigateToCamera(slot: slot)
            }
        } label: {
            HStack(spacing: Spacing.s4) {
                // Thumbnail or placeholder
                Group {
                    if let image = coordinator.capturedPhotos[slot] {
                        Image(uiImage: image)
                            .resizable()
                            .scaledToFill()
                    } else {
                        Color.colorBorderSoft
                    }
                }
                .frame(width: 52, height: 52)
                .clipShape(RoundedRectangle(cornerRadius: BorderRadius.sm, style: .continuous))
                .opacity(isActive || isCaptured ? 1 : 0.4)

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .petsona(.bodyLg)
                        .foregroundStyle(isActive || isCaptured ? Color.colorTextDefault : Color.colorTextMuted)
                    Text(subtitle)
                        .petsona(.caption)
                        .foregroundStyle(Color.colorTextSoft)
                }
                Spacer()
                if isCaptured {
                    Button("Retake") {
                        coordinator.retake(slot: slot)
                    }
                    .petsona(.caption)
                    .foregroundStyle(Color.colorTextMuted)
                } else if isActive {
                    Image(systemName: "chevron.right")
                        .foregroundStyle(Color.colorTextMuted)
                }
            }
            .padding(Spacing.s4)
            .background(
                RoundedRectangle(cornerRadius: BorderRadius.md, style: .continuous)
                    .fill(Color.colorSurfaceElev)
                    .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
            )
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier(accessibilityID)
        .disabled(!isActive && !isCaptured)
    }
}

#Preview("State 1 — front captured") {
    let c = OnboardingCoordinator(
        permissionProvider: MockCameraPermissionProvider(state: .authorized),
        collectionAdvanceDelay: .zero
    )
    c.capturedPhotos.front = UIImage(systemName: "cat") ?? UIImage()
    return PhotoCollectionView().environment(c)
}

#Preview("State 2 — front + side captured") {
    let c = OnboardingCoordinator(
        permissionProvider: MockCameraPermissionProvider(state: .authorized),
        collectionAdvanceDelay: .zero
    )
    c.capturedPhotos.front = UIImage(systemName: "cat") ?? UIImage()
    c.capturedPhotos.side  = UIImage(systemName: "dog") ?? UIImage()
    return PhotoCollectionView().environment(c)
}

#Preview("State 3 — all captured") {
    let c = OnboardingCoordinator(
        permissionProvider: MockCameraPermissionProvider(state: .authorized),
        collectionAdvanceDelay: .zero
    )
    c.capturedPhotos.front    = UIImage(systemName: "cat") ?? UIImage()
    c.capturedPhotos.side     = UIImage(systemName: "dog") ?? UIImage()
    c.capturedPhotos.document = UIImage(systemName: "doc") ?? UIImage()
    return PhotoCollectionView().environment(c)
}
