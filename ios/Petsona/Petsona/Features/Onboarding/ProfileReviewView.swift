import SwiftUI
import OSLog

struct ProfileReviewView: View {
    let onContinue: () -> Void
    @Environment(OnboardingCoordinator.self) private var coordinator
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    @State private var cardOffset: CGFloat = 0
    @State private var isCardDismissed = false
    @State private var showAgePicker = false
    @State private var weightString = ""

    private let colorOptions = [
        "Black", "White", "Brown tabby", "Orange tabby",
        "Tortoiseshell", "Calico", "Gray", "Cream", "Other"
    ]

    var body: some View {
        @Bindable var coordinator = coordinator
        ZStack(alignment: .bottom) {
            // Background photo
            Group {
                if let front = coordinator.capturedPhotos.front {
                    Image(uiImage: front)
                        .resizable()
                        .scaledToFill()
                } else {
                    Image("splash-1024")
                        .resizable()
                        .scaledToFill()
                }
            }
            .ignoresSafeArea()
            .overlay {
                // Forest-tinted multiply overlay
                Color.forest.opacity(0.5)
                    .blendMode(.multiply)
                    .ignoresSafeArea()
            }
            .overlay {
                // Bottom fade to ivory so card blends seamlessly
                LinearGradient(
                    colors: [.clear, Color.ivory],
                    startPoint: .init(x: 0.5, y: 0.5),
                    endPoint: .bottom
                )
                .ignoresSafeArea()
            }

            // Restore pill when card is dismissed
            if isCardDismissed {
                Button {
                    withAnimation(reduceMotion
                        ? .linear(duration: Motion.fast)
                        : .spring(response: 0.4, dampingFraction: 0.85)) {
                        isCardDismissed = false
                        cardOffset = 0
                    }
                } label: {
                    Pill("Profile")
                }
                .padding(.bottom, Spacing.s7)
            }

            // Profile card
            if !isCardDismissed {
                profileCard(coordinator: coordinator)
                    .offset(y: cardOffset)
                    .gesture(dragGesture)
                    .transition(.move(edge: .bottom))
            }
        }
        .toolbar(.hidden, for: .navigationBar)
        .sheet(isPresented: $showAgePicker) {
            agePickerSheet(coordinator: coordinator)
        }
        .onAppear {
            weightString = String(coordinator.profile.weight)
        }
    }

    // MARK: - Profile card

    private func profileCard(coordinator: OnboardingCoordinator) -> some View {
        @Bindable var coordinator = coordinator
        return VStack(spacing: 0) {
            // Drag handle
            Capsule()
                .fill(Color.muted.opacity(0.4))
                .frame(width: 36, height: 4)
                .padding(.top, Spacing.s3)
                .padding(.bottom, Spacing.s4)

            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.s5) {
                    // Hero text
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Hey Mochi 👋")
                            .petsona(.displayWow)
                            .foregroundStyle(Color.forestDk)
                        Text("Here's what we read from your photos.")
                            .font(.custom("DM Sans", size: 13))
                            .foregroundStyle(Color.colorTextMuted)
                    }

                    // Form fields — compact bottom-border style
                    VStack(spacing: 0) {
                        // Breed + AI badge
                        CompactField("Breed") {
                            HStack {
                                TextField("Breed", text: $coordinator.profile.breed)
                                    .font(.custom("DM Sans", size: 14).weight(.medium))
                                    .foregroundStyle(Color.colorTextDefault)
                                Spacer()
                                Text("AI \(coordinator.profile.breedConfidence)%")
                                    .font(.custom("DM Sans", size: 8.5).weight(.bold))
                                    .tracking(0.06 * 8.5)
                                    .textCase(.uppercase)
                                    .foregroundStyle(Color.honeyDk)
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 1)
                                    .background(Capsule(style: .continuous).fill(Color.honeyTint))
                            }
                        }

                        // Name
                        CompactField("Name") {
                            TextField("Name", text: $coordinator.profile.name)
                                .font(.custom("DM Sans", size: 14).weight(.medium))
                                .foregroundStyle(Color.colorTextDefault)
                        }

                        // Gender
                        CompactField("Gender") {
                            Segmented(
                                options: ["Female", "Male"],
                                selectedIndex: Binding(
                                    get: { coordinator.profile.gender == .female ? 0 : 1 },
                                    set: { coordinator.setGender($0 == 0 ? .female : .male) }
                                )
                            )
                        }

                        // Age
                        CompactField("Age") {
                            Button {
                                showAgePicker = true
                            } label: {
                                HStack {
                                    Text(formatAge(coordinator.profile.ageMonths))
                                        .font(.custom("DM Sans", size: 14).weight(.medium))
                                        .foregroundStyle(Color.colorTextDefault)
                                    Spacer()
                                    Image(systemName: "chevron.down")
                                        .font(.system(size: 12))
                                        .foregroundStyle(Color.colorTextMuted)
                                }
                            }
                            .buttonStyle(.plain)
                        }

                        // Weight
                        CompactField("Weight") {
                            HStack {
                                TextField("0", text: Binding(
                                    get: { weightString },
                                    set: {
                                        weightString = $0
                                        if let v = Double($0) { coordinator.setWeight(v) }
                                    }
                                ))
                                .font(.custom("DM Sans", size: 14).weight(.medium))
                                .foregroundStyle(Color.colorTextDefault)
                                .keyboardType(.decimalPad)
                                Text(coordinator.profile.weightUnit.label)
                                    .font(.custom("DM Sans", size: 13))
                                    .foregroundStyle(Color.colorTextMuted)
                            }
                        }

                        // Color
                        CompactField("Color") {
                            Menu {
                                ForEach(colorOptions, id: \.self) { option in
                                    Button(option) { coordinator.setColor(option) }
                                }
                            } label: {
                                HStack {
                                    Text(coordinator.profile.color)
                                        .font(.custom("DM Sans", size: 14).weight(.medium))
                                        .foregroundStyle(Color.colorTextDefault)
                                    Spacer()
                                    Image(systemName: "chevron.down")
                                        .font(.system(size: 12))
                                        .foregroundStyle(Color.colorTextMuted)
                                }
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    // Vet records
                    if !coordinator.profile.vetRecords.isEmpty {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("From vet card")
                                .font(.custom("DM Sans", size: 9.5).weight(.semibold))
                                .tracking(0.06 * 9.5)
                                .textCase(.uppercase)
                                .foregroundStyle(Color.colorTextMuted)
                            ForEach(coordinator.profile.vetRecords) { record in
                                VetRecordRow(record: record) {
                                    coordinator.removeVetRecord(id: record.id)
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, Spacing.s5)
                .padding(.bottom, Spacing.s5)
            }

            // CTA
            CtaStack {
                PrimaryButton("Welcome Mochi") {
                    Logger.petsona.debug("ProfileReview: continue tapped — Phase 2 will wire PersonalityView")
                    onContinue()
                }
            }
        }
        .background(
            RoundedRectangle(cornerRadius: BorderRadius.xl, style: .continuous)
                .fill(Color.colorSurface)
                .shadow(color: .black.opacity(0.18), radius: 24, x: 0, y: -4)
        )
        .ignoresSafeArea(edges: .bottom)
        .frame(maxHeight: UIScreen.main.bounds.height * 0.78)
    }

    // MARK: - Drag gesture (restricted to handle region via card-level gesture)

    private var dragGesture: some Gesture {
        DragGesture(minimumDistance: 8)
            .onChanged { value in
                let t = value.translation.height
                cardOffset = max(0, t)
            }
            .onEnded { value in
                let threshold: CGFloat = 120
                if cardOffset > threshold {
                    withAnimation(reduceMotion
                        ? .linear(duration: Motion.fast)
                        : .spring(response: 0.4, dampingFraction: 0.85)) {
                        isCardDismissed = true
                        cardOffset = 0
                    }
                } else {
                    withAnimation(reduceMotion
                        ? .linear(duration: Motion.fast)
                        : .spring(response: 0.4, dampingFraction: 0.85)) {
                        cardOffset = 0
                    }
                }
            }
    }

    // MARK: - Age picker sheet

    private func agePickerSheet(coordinator: OnboardingCoordinator) -> some View {
        @Bindable var coordinator = coordinator
        return NavigationStack {
            Picker("Age", selection: $coordinator.profile.ageMonths) {
                ForEach(0..<241, id: \.self) { months in
                    Text(formatAge(months)).tag(months)
                }
            }
            .pickerStyle(.wheel)
            .navigationTitle("Age")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { showAgePicker = false }
                }
            }
        }
        .presentationDetents([.medium])
    }

    // MARK: - Age format

    private func formatAge(_ months: Int) -> String {
        switch months {
        case 0:
            return "Less than 1 month"
        case 1..<24:
            return "\(months) month\(months == 1 ? "" : "s")"
        default:
            let y = months / 12
            let m = months % 12
            if m == 0 {
                return "\(y) year\(y == 1 ? "" : "s")"
            }
            return "\(y) year\(y == 1 ? "" : "s") \(m) month\(m == 1 ? "" : "s")"
        }
    }
}

// MARK: - Supporting views

private struct VetRecordRow: View {
    let record: VetRecord
    let onRemove: () -> Void

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: record.kind.symbolName)
                .font(.system(size: 13))
                .foregroundStyle(Color.honeyDk)
                .frame(width: 16)
            Text("\(record.label) · \(record.subtitle)")
                .font(.custom("DM Sans", size: 12).weight(.medium))
                .foregroundStyle(Color.honeyDk)
                .lineLimit(1)
            Spacer()
            Button { onRemove() } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 11))
                    .foregroundStyle(Color.colorTextMuted)
            }
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    let c = OnboardingCoordinator(
        permissionProvider: MockCameraPermissionProvider(state: .authorized),
        collectionAdvanceDelay: .zero
    )
    c.capturedPhotos.front = UIImage(named: "splash-1024") ?? UIImage()
    return ProfileReviewView(onContinue: {}).environment(c)
}
