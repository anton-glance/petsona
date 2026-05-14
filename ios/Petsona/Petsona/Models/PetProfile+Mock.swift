import Foundation

// Values matched exactly to docs/design/05_ai_review.html
extension PetProfile {
    static let mochi = PetProfile(
        name: "Mochi",
        breed: "Tabby",
        breedConfidence: 91,
        gender: .female,
        ageMonths: 4,
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
            )
        ]
    )
}
