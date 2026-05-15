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
                // Header: back | progress dots | "N / 3"
                HStack {
                    BackButton { coordinator.path.removeLast() }
                    Spacer()
                    ProgressDots(total: 3, current: collectionState)
                    Spacer()
                    SmallCap("\(collectionState) / 3")
                }
                .padding(.horizontal, Spacing.s4)
                .padding(.top, 4)
                .padding(.bottom, Spacing.s3)

                ScrollView {
                    VStack(alignment: .leading, spacing: Spacing.s4) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(headline)
                                .petsona(.displayLg)
                                .foregroundStyle(Color.colorPrimary)
                            Text(subline)
                                .petsona(.body)
                                .foregroundStyle(Color.colorTextMuted)
                        }
                        .padding(.top, Spacing.s1)

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
                                isOptional: false,
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
                                isOptional: false,
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
                                isOptional: true,
                                accessibilityID: "vet-photo-row"
                            )
                        }
                    }
                    .padding(.horizontal, Spacing.s4)
                }

                CtaStack {
                    if collectionState == 3 {
                        Spinner()
                            .padding(.vertical, Spacing.s4)
                    } else if collectionState == 2 {
                        PrimaryButton("Capture document") {
                            coordinator.navigateToCamera(slot: .document)
                        }
                        TextButton("Skip vet docs") {
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
        isOptional: Bool,
        accessibilityID: String
    ) -> some View {
        Button {
            if !isCaptured && isActive {
                coordinator.navigateToCamera(slot: slot)
            }
        } label: {
            HStack(spacing: Spacing.s3) {
                thumbnail(slot: slot, isCaptured: isCaptured, isActive: isActive)

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.petsonaBodyLg)
                        .fontWeight(.semibold)
                        .foregroundStyle(Color.colorTextDefault)
                    Text(subtitle)
                        .font(.petsonaBody)
                        .foregroundStyle(Color.colorTextMuted)
                        .lineLimit(2)
                }
                Spacer()
                if isCaptured {
                    Button("Retake") {
                        coordinator.retake(slot: slot)
                    }
                    .font(.petsonaCaption)
                    .fontWeight(.medium)
                    .foregroundStyle(Color.honeyDk)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                } else if isActive {
                    Image(systemName: "chevron.right")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(Color.honeyDk)
                }
            }
            .padding(.vertical, Spacing.s4)
            .padding(.horizontal, Spacing.s3)
            .overlay(alignment: .topTrailing) {
                if isOptional {
                    cornerPill(isActive: isActive, isCaptured: isCaptured)
                        .padding(.top, 8)
                        .padding(.trailing, 10)
                }
            }
            .background { rowBackground(isCaptured: isCaptured, isActive: isActive, isOptional: isOptional) }
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier(accessibilityID)
        .disabled(!isActive && !isCaptured)
    }

    // MARK: - Thumbnail (B5: 80×80, show captured photo)

    @ViewBuilder
    private func thumbnail(slot: PhotoSlot, isCaptured: Bool, isActive: Bool) -> some View {
        ZStack {
            if let image = coordinator.capturedPhotos[slot], isCaptured {
                // B5: show actual captured photo
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
            } else if isActive {
                Color.honeyTint
                Image(systemName: "camera")
                    .font(.system(size: 24, weight: .medium))
                    .foregroundStyle(Color.honeyDk)
            } else {
                Color.ivoryDim
                Image(systemName: "doc")
                    .font(.system(size: 20, weight: .regular))
                    .foregroundStyle(Color.mutedSoft)
            }
        }
        .frame(width: 80, height: 80)
        .clipShape(RoundedRectangle(cornerRadius: BorderRadius.md, style: .continuous))
    }

    // MARK: - Row background (V9: honey-tint glass for active)

    @ViewBuilder
    private func rowBackground(isCaptured: Bool, isActive: Bool, isOptional: Bool) -> some View {
        if isActive {
            // V9: glass with honey tint — replaces the prior muddy material
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .glassBackground(tier: .regular, tint: .honey, cornerRadius: 18)
        } else if isCaptured {
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .glassBackground(tier: .thin, cornerRadius: 18)
        } else {
            // Inactive optional: dashed border
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(.regularMaterial)
                .overlay {
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .strokeBorder(
                            style: StrokeStyle(lineWidth: 1, dash: [4, 3])
                        )
                        .foregroundStyle(Color.colorBorder.opacity(0.7))
                }
        }
    }

    private func cornerPill(isActive: Bool, isCaptured: Bool) -> some View {
        Text("Optional")
            .petsona(.caption)
            .textCase(.uppercase)
            .foregroundStyle(isActive || isCaptured ? Color.honeyDk : Color.colorTextMuted)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background {
                Capsule(style: .continuous)
                    .fill(isActive || isCaptured ? Color.honeyTint : Color.colorSurfaceDim.opacity(0.8))
            }
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
