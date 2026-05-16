import Foundation

struct PetProfile: Sendable {
    var name: String
    var breed: String
    var breedConfidence: Int  // 0-100
    var gender: Gender
    var ageMonths: Int
    var ageDays: Int?          // nil = not set; set by week-stage picker for precise sub-month ages
    var weight: Double
    var weightUnit: WeightUnit
    var color: String
    var vetRecords: [VetRecord]
}
