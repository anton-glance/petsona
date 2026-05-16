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
                // S04.8: ZStack centers dots absolutely regardless of button widths
                ZStack(alignment: .center) {
                    HStack {
                        BackButton { coordinator.path.removeLast() }
                        Spacer()
                        SmallCap("\(collectionState) / 3")
                    }
                    ProgressDots(total: 3, current: collectionState)
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
                        // S04.6: stepping paws replaces the spinner
                        SteppingPawsLoader()
                            .padding(.vertical, Spacing.s4)
                    } else if collectionState == 2 {
                        PrimaryButton("Capture document") {
                            coordinator.navigateToCamera(slot: .document)
                        }
                        // S04.7: explicit 18pt gap between CTA and skip link
                        Spacer().frame(height: 18)
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

    // MARK: - Headline / subline

    private var headline: String {
        switch collectionState {
        case 2: "Got a document for \(coordinator.profile.name.isEmpty ? "your pet" : coordinator.profile.name)?"
        case 3: "Everything captured."
        default: "Now, a side view."
        }
    }

    private var subline: String {
        switch collectionState {
        case 2: "Vet passport, DNA test, or any record — speeds up your profile."
        case 3: "Ready to read what these photos tell us."
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

                // S04.5: Retake only on states 1 and 2, not when all captured (state 3)
                if isCaptured && collectionState < 3 {
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
                // S04.4: OPTIONAL pill only when not yet captured
                if isOptional && !isCaptured {
                    optionalPill(isActive: isActive)
                        .padding(.top, 8)
                        .padding(.trailing, 10)
                }
            }
            .background { rowBackground(isCaptured: isCaptured, isActive: isActive) }
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier(accessibilityID)
        .disabled(!isActive && !isCaptured)
    }

    // MARK: - Thumbnail

    @ViewBuilder
    private func thumbnail(slot: PhotoSlot, isCaptured: Bool, isActive: Bool) -> some View {
        ZStack {
            if let image = coordinator.capturedPhotos[slot], isCaptured {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
            } else if isActive {
                // S04.1 active: honeySoft background
                Color.honeySoft
                Image(systemName: "camera")
                    .font(.system(size: 24, weight: .medium))
                    .foregroundStyle(Color.honeyDk)
            } else {
                // S04.2: camera icon on all rows (not doc icon)
                Color.rule
                Image(systemName: "camera")
                    .font(.system(size: 20, weight: .regular))
                    .foregroundStyle(Color.muted)
            }
        }
        .frame(width: 80, height: 80)
        .clipShape(RoundedRectangle(cornerRadius: BorderRadius.md, style: .continuous))
    }

    // MARK: - Row background (S04.1: solid fills, S04.3: no dotted border)

    @ViewBuilder
    private func rowBackground(isCaptured: Bool, isActive: Bool) -> some View {
        RoundedRectangle(cornerRadius: 18, style: .continuous)
            .fill(
                isCaptured ? Color.honeyTint :
                isActive   ? Color.honeySoft :
                             Color.rule
            )
    }

    // MARK: - Optional pill

    private func optionalPill(isActive: Bool) -> some View {
        Text("Optional")
            .font(.custom("DM Sans", size: 11))
            .fontWeight(.medium)
            .textCase(.uppercase)
            .foregroundStyle(isActive ? Color.honeyDk : Color.colorTextMuted)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background {
                Capsule(style: .continuous)
                    .fill(isActive ? Color.honeyTint : Color.colorSurfaceDim.opacity(0.8))
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
