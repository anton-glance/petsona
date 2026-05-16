import SwiftUI
import UIKit

@main
struct PetsonaApp: App {
    @State private var coordinator = OnboardingCoordinator.forCurrentEnvironment()

    init() {
        // G2: Force light keyboard appearance globally — the app has no dark scheme yet,
        // so a dark keyboard under a light UI is jarring.
        UITextField.appearance().keyboardAppearance = .light
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(coordinator)
        }
    }
}
