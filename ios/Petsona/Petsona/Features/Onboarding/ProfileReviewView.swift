import SwiftUI
import OSLog

struct ProfileReviewView: View {
    let onContinue: () -> Void
    @Environment(OnboardingCoordinator.self) private var coordinator

    @State private var showAgePicker = false
    @State private var weightString = ""

    private let colorOptions = [
        "Black", "White", "Brown tabby", "Orange tabby",
        "Tortoiseshell", "Calico", "Gray", "Cream", "Other"
    ]

    // B7: fall back to "there" when name is empty
    private var displayName: String {
        coordinator.profile.name.isEmpty ? "there" : coordinator.profile.name
    }

    var body: some View {
        @Bindable var coordinator = coordinator
        GeometryReader { geo in
            let photoH = geo.size.height / 3

            ZStack(alignment: .top) {
                // Base: ivory fills entire screen
                Color.ivory.ignoresSafeArea()

                // Photo hero: top 1/3, fades to ivory at the bottom
                heroImage(height: photoH, width: geo.size.width)
                    .ignoresSafeArea(edges: .top)

                // Content column
                VStack(spacing: 0) {
                    // Offset so greeting text overlaps the gradient fade zone
                    Color.clear.frame(height: photoH - 56)

                    // Fixed header
                    VStack(alignment: .leading, spacing: Spacing.s1) {
                        Text("Hey \(displayName) 👋")
                            .petsona(.displayWow)
                            .foregroundStyle(Color.forestDk)
                        Text("Here's what we read from your photos.")
                            .petsona(.body)
                            .foregroundStyle(Color.colorTextMuted)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, Spacing.s5)
                    .padding(.bottom, Spacing.s3)

                    // Scrollable form — ONLY this region scrolls
                    ScrollView {
                        VStack(spacing: 0) {
                            formSection(coordinator: coordinator)
                            vetRecordsSection(coordinator: coordinator)
                        }
                        .padding(.horizontal, Spacing.s5)
                        .padding(.bottom, Spacing.s5)
                    }

                    // Fixed CTA
                    CtaStack {
                        PrimaryButton("Welcome \(displayName)") {
                            Logger.petsona.debug("ProfileReview: continue tapped")
                            onContinue()
                        }
                    }
                }
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

    // MARK: - Photo hero

    @ViewBuilder
    private func heroImage(height: CGFloat, width: CGFloat) -> some View {
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
        .frame(width: width, height: height)
        .clipped()
        .overlay {
            // Forest tint multiply
            Color.forest.opacity(0.4)
                .blendMode(.multiply)
        }
        .overlay(alignment: .bottom) {
            // Fade to ivory over bottom half of the photo
            LinearGradient(
                colors: [.clear, Color.ivory],
                startPoint: .center,
                endPoint: .bottom
            )
        }
    }

    // MARK: - Form (single-column, V12)

    @ViewBuilder
    private func formSection(coordinator: OnboardingCoordinator) -> some View {
        @Bindable var coordinator = coordinator
        VStack(spacing: 0) {
            // Breed + AI badge
            CompactField("Breed") {
                HStack {
                    TextField("Breed", text: $coordinator.profile.breed)
                        .font(.petsonaBody)
                        .fontWeight(.medium)
                        .foregroundStyle(Color.colorTextDefault)
                    Spacer()
                    Text("AI \(coordinator.profile.breedConfidence)%")
                        .petsona(.caption)
                        .fontWeight(.bold)
                        .textCase(.uppercase)
                        .foregroundStyle(Color.honeyDk)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Capsule(style: .continuous).fill(Color.honeyTint))
                }
            }

            // Name
            CompactField("Name") {
                TextField("Name", text: $coordinator.profile.name)
                    .font(.petsonaBody)
                    .fontWeight(.medium)
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
                            .font(.petsonaBody)
                            .fontWeight(.medium)
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
                    .font(.petsonaBody)
                    .fontWeight(.medium)
                    .foregroundStyle(Color.colorTextDefault)
                    .keyboardType(.decimalPad)
                    Text(coordinator.profile.weightUnit.label)
                        .font(.petsonaBody)
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
                            .font(.petsonaBody)
                            .fontWeight(.medium)
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
    }

    // MARK: - Vet records

    @ViewBuilder
    private func vetRecordsSection(coordinator: OnboardingCoordinator) -> some View {
        if !coordinator.profile.vetRecords.isEmpty {
            VStack(alignment: .leading, spacing: 6) {
                Text("From vet card")
                    .petsona(.caption)
                    .textCase(.uppercase)
                    .foregroundStyle(Color.colorTextMuted)
                    .padding(.top, Spacing.s4)
                ForEach(coordinator.profile.vetRecords) { record in
                    VetRecordRow(record: record) {
                        coordinator.removeVetRecord(id: record.id)
                    }
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
            if m == 0 { return "\(y) year\(y == 1 ? "" : "s")" }
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
                .font(.petsonaBody)
                .fontWeight(.medium)
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
