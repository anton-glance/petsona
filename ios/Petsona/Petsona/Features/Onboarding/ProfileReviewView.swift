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

    private var displayName: String {
        coordinator.profile.name.isEmpty ? "there" : coordinator.profile.name
    }

    var body: some View {
        @Bindable var coordinator = coordinator
        GeometryReader { geo in
            let photoH = geo.size.height / 3

            ZStack(alignment: .top) {
                // S05.1 ✅ — ivory fills entire screen
                Color.ivory.ignoresSafeArea()

                // S05.1 ✅ — photo hero top 1/3, fades to ivory at the bottom
                heroImage(height: photoH, width: geo.size.width)
                    .ignoresSafeArea(edges: .top)

                VStack(spacing: 0) {
                    // S05.1 ✅ — greeting text overlaps the gradient fade zone
                    Color.clear.frame(height: photoH - 56)

                    VStack(alignment: .leading, spacing: Spacing.s1) {
                        // XC1 ✅ — live-bound to coordinator.profile.name
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

                    ScrollView {
                        VStack(spacing: 0) {
                            formSection(coordinator: coordinator)
                            vetRecordsSection(coordinator: coordinator)
                        }
                        .padding(.horizontal, Spacing.s5)
                        .padding(.bottom, Spacing.s5)
                    }
                    .toolbar {
                        ToolbarItemGroup(placement: .keyboard) {
                            Spacer()
                            Button("Done") { UIApplication.shared.endEditing() }
                                .fontWeight(.semibold)
                        }
                    }

                    CtaStack {
                        // XC1 ✅ — live-bound to coordinator.profile.name
                        PrimaryButton("Welcome \(displayName)") {
                            Logger.petsona.debug("ProfileReview: continue tapped")
                            onContinue()
                        }
                    }
                }
            }
        }
        .ignoresSafeArea(.keyboard)
        .toolbar(.hidden, for: .navigationBar)
        .sheet(isPresented: $showAgePicker) {
            agePickerSheet(coordinator: coordinator)
        }
        .onAppear {
            weightString = String(coordinator.profile.weight)
        }
    }

    // MARK: - S05.1: Photo hero (top 1/3)

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
            Color.forest.opacity(0.4)
                .blendMode(.multiply)
        }
        .overlay(alignment: .bottom) {
            LinearGradient(
                colors: [.clear, Color.ivory],
                startPoint: .center,
                endPoint: .bottom
            )
        }
    }

    // MARK: - Form

    @ViewBuilder
    private func formSection(coordinator: OnboardingCoordinator) -> some View {
        @Bindable var coordinator = coordinator
        VStack(spacing: 0) {
            // Breed + AI confidence badge
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

            // Name — XC1: live binding drives headline and CTA
            CompactField("Name") {
                TextField("Name", text: $coordinator.profile.name)
                    .font(.petsonaBody)
                    .fontWeight(.medium)
                    .foregroundStyle(Color.colorTextDefault)
            }

            // S05.2: subtle style — honeySoft/honeyTint fills, md radius
            CompactField("Gender") {
                Segmented(
                    options: ["Female", "Male"],
                    selectedIndex: Binding(
                        get: { coordinator.profile.gender == .female ? 0 : 1 },
                        set: { coordinator.setGender($0 == 0 ? .female : .male) }
                    ),
                    style: .subtle
                )
            }

            // Age — opens three-stage picker sheet
            CompactField("Age") {
                Button {
                    showAgePicker = true
                } label: {
                    HStack {
                        Text(formatAge(ageMonths: coordinator.profile.ageMonths,
                                       ageDays: coordinator.profile.ageDays))
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

            // S05.3: weight unit as subtle Segmented toggle instead of static label
            CompactField("Weight") {
                HStack(spacing: Spacing.s3) {
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

                    Segmented(
                        options: ["kg", "lb"],
                        selectedIndex: Binding(
                            get: { coordinator.profile.weightUnit == .kg ? 0 : 1 },
                            set: { coordinator.setWeightUnit($0 == 0 ? .kg : .lb) }
                        ),
                        style: .subtle
                    )
                    .frame(width: 84)
                }
            }

            // S05.4: Menu anchored to chevron on right — opens from the chevron side
            CompactField("Color") {
                HStack {
                    Text(coordinator.profile.color)
                        .font(.petsonaBody)
                        .fontWeight(.medium)
                        .foregroundStyle(Color.colorTextDefault)
                    Spacer()
                    Menu {
                        ForEach(colorOptions, id: \.self) { option in
                            Button(option) { coordinator.setColor(option) }
                        }
                    } label: {
                        Image(systemName: "chevron.down")
                            .font(.system(size: 12))
                            .foregroundStyle(Color.colorTextMuted)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    // MARK: - Vet records (S05.6: 5 mock rows)

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

    // MARK: - S05.7/S05.8: Age picker sheet — light ivory background, three-stage custom picker

    private func agePickerSheet(coordinator: OnboardingCoordinator) -> some View {
        ThreeStageAgePicker(
            ageMonths: Binding(
                get: { coordinator.profile.ageMonths },
                set: { coordinator.setAgeMonths($0) }
            ),
            ageDays: Binding(
                get: { coordinator.profile.ageDays },
                set: { coordinator.profile.ageDays = $0 }
            ),
            onDone: { showAgePicker = false }
        )
        .presentationDetents([.height(360)])
        .presentationBackground(Color.ivory)
    }

    // MARK: - Age display string

    private func formatAge(ageMonths: Int, ageDays: Int?) -> String {
        if let days = ageDays {
            let weeks = days / 7
            if weeks == 0 { return "Less than 1 week" }
            return weeks == 1 ? "1 week" : "\(weeks) weeks"
        }
        switch ageMonths {
        case 0:      return "Less than 1 month"
        case 1..<12: return "\(ageMonths) month\(ageMonths == 1 ? "" : "s")"
        default:
            let y = ageMonths / 12, m = ageMonths % 12
            if m == 0 { return "\(y) year\(y == 1 ? "" : "s")" }
            return "\(y) year\(y == 1 ? "" : "s") \(m) month\(m == 1 ? "" : "s")"
        }
    }
}

// MARK: - S05.8: Three-stage age picker

private struct ThreeStageAgePicker: View {
    @Binding var ageMonths: Int
    @Binding var ageDays: Int?
    let onDone: () -> Void

    enum AgeStage { case weeks, months, years }
    @State private var stage: AgeStage = .months
    @State private var selectedWeeks = 4
    @State private var selectedMonths = 4
    @State private var selectedYears = 1

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            HStack {
                Text("Age")
                    .petsona(.displayMd)
                    .foregroundStyle(Color.colorTextDefault)
                Spacer()
                Button("Done") { onDone() }
                    .font(.petsonaBody)
                    .fontWeight(.semibold)
                    .foregroundStyle(Color.colorPrimary)
            }
            .padding(.horizontal, Spacing.s5)
            .padding(.top, Spacing.s5)
            .padding(.bottom, Spacing.s4)

            Divider().padding(.horizontal, Spacing.s5)

            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    stageSection(title: "Weeks") {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(0..<9) { w in
                                    agePill(
                                        label: w == 1 ? "1 week" : "\(w) weeks",
                                        isSelected: stage == .weeks && selectedWeeks == w
                                    ) {
                                        stage = .weeks
                                        selectedWeeks = w
                                        ageDays = w * 7
                                        ageMonths = 0
                                    }
                                }
                            }
                            .padding(.horizontal, Spacing.s5)
                        }
                    }

                    stageSection(title: "Months") {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(2..<12) { m in
                                    agePill(
                                        label: "\(m) months",
                                        isSelected: stage == .months && selectedMonths == m
                                    ) {
                                        stage = .months
                                        selectedMonths = m
                                        ageDays = nil
                                        ageMonths = m
                                    }
                                }
                            }
                            .padding(.horizontal, Spacing.s5)
                        }
                    }

                    stageSection(title: "Years") {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(1...30, id: \.self) { y in
                                    agePill(
                                        label: y == 1 ? "1 year" : "\(y) years",
                                        isSelected: stage == .years && selectedYears == y
                                    ) {
                                        stage = .years
                                        selectedYears = y
                                        ageDays = nil
                                        ageMonths = y * 12
                                    }
                                }
                            }
                            .padding(.horizontal, Spacing.s5)
                        }
                    }
                }
                .padding(.bottom, Spacing.s5)
            }
        }
        .background(Color.ivory)
        .onAppear { syncSelectionFromProfile() }
    }

    private func stageSection<C: View>(title: String, @ViewBuilder content: () -> C) -> some View {
        VStack(alignment: .leading, spacing: Spacing.s2) {
            Text(title)
                .petsona(.caption)
                .textCase(.uppercase)
                .foregroundStyle(Color.colorTextMuted)
                .padding(.horizontal, Spacing.s5)
                .padding(.top, Spacing.s4)
            content()
        }
    }

    private func agePill(label: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(label)
                .petsona(.body)
                .foregroundStyle(isSelected ? Color.ivory : Color.ink)
                .padding(.horizontal, 14)
                .padding(.vertical, 9)
                .background(
                    RoundedRectangle(cornerRadius: BorderRadius.md, style: .continuous)
                        .fill(isSelected ? Color.forest : Color.honeyTint)
                )
                .scaleEffect(isSelected ? 1.05 : 1.0)
                .animation(.easeOut(duration: Motion.medium), value: isSelected)
        }
        .buttonStyle(.plain)
    }

    private func syncSelectionFromProfile() {
        if let days = ageDays, days > 0 {
            stage = .weeks
            selectedWeeks = min(days / 7, 8)
        } else if ageMonths > 0 && ageMonths < 12 {
            stage = .months
            selectedMonths = max(2, min(ageMonths, 11))
        } else if ageMonths >= 12 {
            stage = .years
            selectedYears = min(ageMonths / 12, 30)
        }
    }
}

// MARK: - Vet record row

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
