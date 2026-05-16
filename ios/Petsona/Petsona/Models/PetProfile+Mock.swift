import Foundation

// Values matched exactly to docs/design/05_ai_review.html
extension PetProfile {
    // Anton: extended to 5 vet records for layout review — may reduce later
    static let mochi = PetProfile(
        name: "Mochi",
        breed: "Tabby",
        breedConfidence: 91,
        gender: .female,
        ageMonths: 4,
        ageDays: nil,
        weight: 4.2,
        weightUnit: .kg,
        color: "Brown tabby",
        vetRecords: [
            VetRecord(
                id: UUID(),
                kind: .vaccination,
                label: "Rabies",
                subtitle: "Apr 2025 · next Apr 2026"
            ),
            VetRecord(
                id: UUID(),
                kind: .microchip,
                label: "Microchip",
                subtitle: "985 121 047 992 384"
            ),
            VetRecord(
                id: UUID(),
                kind: .vaccination,
                label: "FVRCP",
                subtitle: "Mar 2025 · next Mar 2026"
            ),
            VetRecord(
                id: UUID(),
                kind: .other,
                label: "Health check",
                subtitle: "Annual exam · Feb 2025"
            ),
            VetRecord(
                id: UUID(),
                kind: .other,
                label: "Surgery",
                subtitle: "Spay · Jan 2025"
            )
        ]
    )
}
