import XCTest

final class OnboardingFlowUITests: XCTestCase {

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
    }

    // MARK: - Happy path: Welcome → Camera explainer → Camera capture
    //         (mock grant) → Photo collection → Skip vet docs → Profile review

    func testHappyPathFromWelcomeToReview() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-MockCameraPermission", "grant"]
        app.launch()

        XCTAssert(app.buttons["Get started"].waitForExistence(timeout: 10))
        app.buttons["Get started"].tap()

        XCTAssert(app.buttons["Allow access"].waitForExistence(timeout: 10))
        app.buttons["Allow access"].tap()

        // Simulator path: "Use mock photo" is now in the main VStack (not behind a Spacer)
        XCTAssert(app.buttons["Use mock photo"].waitForExistence(timeout: 10))
        app.buttons["Use mock photo"].tap()

        // Photo collection state 1 — front captured, side active
        XCTAssert(app.buttons["Capture side photo"].waitForExistence(timeout: 10))
        app.buttons["Capture side photo"].tap()

        XCTAssert(app.buttons["Use mock photo"].waitForExistence(timeout: 10))
        app.buttons["Use mock photo"].tap()

        // Photo collection state 2 — front+side captured, skip vet docs
        XCTAssert(app.buttons["Skip vet docs"].waitForExistence(timeout: 10))
        app.buttons["Skip vet docs"].tap()

        // Profile review appears
        XCTAssert(app.staticTexts["Hey Mochi 👋"].waitForExistence(timeout: 15))
    }

    // MARK: - Denied permission shows the edge-case screen

    func testPermissionDeniedShowsEdgeCase() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-MockCameraPermission", "deny"]
        app.launch()

        XCTAssert(app.buttons["Get started"].waitForExistence(timeout: 10))
        app.buttons["Get started"].tap()

        XCTAssert(app.buttons["Allow access"].waitForExistence(timeout: 10))
        app.buttons["Allow access"].tap()

        XCTAssert(app.staticTexts["Camera access needed"].waitForExistence(timeout: 10))
    }

    // MARK: - Both the photo-row tap and the CTA button navigate to the same slot

    func testSidePhotoRowAndCTABothNavigateToCamera() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-MockCameraPermission", "grant"]
        app.launch()

        // Navigate to photo collection state 1
        XCTAssert(app.buttons["Get started"].waitForExistence(timeout: 10))
        app.buttons["Get started"].tap()
        XCTAssert(app.buttons["Allow access"].waitForExistence(timeout: 10))
        app.buttons["Allow access"].tap()
        XCTAssert(app.buttons["Use mock photo"].waitForExistence(timeout: 10))
        app.buttons["Use mock photo"].tap()

        // Path 1: CTA button
        XCTAssert(app.buttons["Capture side photo"].waitForExistence(timeout: 10))
        app.buttons["Capture side photo"].tap()
        XCTAssert(app.staticTexts["Photo 2 of 3 · Side"].waitForExistence(timeout: 10))
        app.buttons["Close camera"].tap()

        // Back on photo collection state 1
        XCTAssert(app.buttons["Capture side photo"].waitForExistence(timeout: 10))

        // Path 2: tappable side-photo row
        app.buttons["side-photo-row"].tap()
        XCTAssert(app.staticTexts["Photo 2 of 3 · Side"].waitForExistence(timeout: 10))
    }
}
