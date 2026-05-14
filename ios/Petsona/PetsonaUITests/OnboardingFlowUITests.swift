import XCTest

final class OnboardingFlowUITests: XCTestCase {

    // MARK: - Happy path: Welcome → Camera explainer → Camera capture
    //         (mock grant) → Photo collection → Skip vet docs → Profile review

    func testHappyPathFromWelcomeToReview() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-MockCameraPermission", "grant"]
        app.launch()

        XCTAssert(app.buttons["Get started"].waitForExistence(timeout: 5))
        app.buttons["Get started"].tap()

        XCTAssert(app.buttons["Allow access"].waitForExistence(timeout: 5))
        app.buttons["Allow access"].tap()

        // Simulator path: mock shutter fires immediately
        XCTAssert(app.buttons["Use mock photo"].waitForExistence(timeout: 5))
        app.buttons["Use mock photo"].tap()

        // Photo collection state 1 — front captured, side active
        XCTAssert(app.buttons["Capture side photo"].waitForExistence(timeout: 5))
        app.buttons["Capture side photo"].tap()

        XCTAssert(app.buttons["Use mock photo"].waitForExistence(timeout: 5))
        app.buttons["Use mock photo"].tap()

        // Photo collection state 2 — front+side captured, skip vet docs
        XCTAssert(app.buttons["Skip vet docs"].waitForExistence(timeout: 5))
        app.buttons["Skip vet docs"].tap()

        // Profile review appears
        XCTAssert(app.staticTexts["Hey Mochi 👋"].waitForExistence(timeout: 10))
    }

    // MARK: - Denied permission shows the edge-case screen

    func testPermissionDeniedShowsEdgeCase() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-MockCameraPermission", "deny"]
        app.launch()

        XCTAssert(app.buttons["Get started"].waitForExistence(timeout: 5))
        app.buttons["Get started"].tap()

        XCTAssert(app.buttons["Allow access"].waitForExistence(timeout: 5))
        app.buttons["Allow access"].tap()

        XCTAssert(app.staticTexts["Camera access needed"].waitForExistence(timeout: 5))
    }

    // MARK: - Both the photo-row tap and the CTA button navigate to the same slot

    func testSidePhotoRowAndCTABothNavigateToCamera() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-MockCameraPermission", "grant"]
        app.launch()

        // Navigate to photo collection state 1
        app.buttons["Get started"].tap()
        XCTAssert(app.buttons["Allow access"].waitForExistence(timeout: 5))
        app.buttons["Allow access"].tap()
        XCTAssert(app.buttons["Use mock photo"].waitForExistence(timeout: 5))
        app.buttons["Use mock photo"].tap()

        // Path 1: CTA button
        XCTAssert(app.buttons["Capture side photo"].waitForExistence(timeout: 5))
        app.buttons["Capture side photo"].tap()
        XCTAssert(app.staticTexts["Photo 2 of 3 · Side"].waitForExistence(timeout: 5))
        app.buttons["Close camera"].tap()

        // Back on photo collection state 1
        XCTAssert(app.buttons["Capture side photo"].waitForExistence(timeout: 5))

        // Path 2: tappable side-photo row
        app.buttons["side-photo-row"].tap()
        XCTAssert(app.staticTexts["Photo 2 of 3 · Side"].waitForExistence(timeout: 5))
    }
}
