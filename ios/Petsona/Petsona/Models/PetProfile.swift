import Foundation

struct PetProfile: Sendable {
    var name: String
    var breed: String
    var breedConfidence: Int  // 0-100
    var gender: Gender
    var ageMonths: Int
    var weight: Double
    var weightUnit: WeightUnit
    var color: String
    var vetRecords: [VetRecord]
}
