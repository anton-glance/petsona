import UIKit

extension UIApplication {
    /// Resigns the current first responder, dismissing any active keyboard.
    func endEditing() {
        sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
    }
}
