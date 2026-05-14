import Foundation

enum Gender: String, Hashable, CaseIterable, Sendable {
    case female
    case male

    var label: String { rawValue.capitalized }
}
