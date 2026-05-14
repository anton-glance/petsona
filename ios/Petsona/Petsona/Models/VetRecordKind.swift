import Foundation

enum VetRecordKind: String, Hashable, Sendable {
    case vaccination
    case microchip
    case other

    // SF Symbol per kind:
    // vaccination → "syringe" (injection semantics, SF Symbols 3, iOS 15+)
    // microchip   → "barcode.viewfinder" (ID scanning semantics, SF Symbols 1, iOS 14+)
    // other       → "doc.text" (generic document, SF Symbols 1, iOS 13+)
    var symbolName: String {
        switch self {
        case .vaccination: "syringe"
        case .microchip:   "barcode.viewfinder"
        case .other:       "doc.text"
        }
    }
}
