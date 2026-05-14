import UIKit

struct CapturedPhotos {
    var front: UIImage? = nil
    var side: UIImage? = nil
    var document: UIImage? = nil

    subscript(slot: PhotoSlot) -> UIImage? {
        get {
            switch slot {
            case .front:    front
            case .side:     side
            case .document: document
            }
        }
        set {
            switch slot {
            case .front:    front = newValue
            case .side:     side = newValue
            case .document: document = newValue
            }
        }
    }
}
