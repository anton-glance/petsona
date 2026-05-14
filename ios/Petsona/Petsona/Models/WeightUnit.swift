import Foundation

enum WeightUnit: String, Hashable, CaseIterable, Sendable {
    case kg
    case lb

    var label: String { rawValue }
}
