import SwiftUI

@main
struct PetsonaApp: App {
    @State private var coordinator = OnboardingCoordinator.forCurrentEnvironment()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(coordinator)
        }
    }
}
