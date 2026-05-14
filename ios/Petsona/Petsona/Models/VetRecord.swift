import Foundation

struct VetRecord: Identifiable, Sendable {
    let id: UUID
    var kind: VetRecordKind
    var label: String
    var subtitle: String
}
