import Testing
import UIKit
@testable import Petsona

@MainActor
@Suite("OnboardingCoordinator")
struct OnboardingCoordinatorTests {

    private func makeCoordinator(
        state: CameraPermissionState = .authorized
    ) -> OnboardingCoordinator {
        OnboardingCoordinator(
            permissionProvider: MockCameraPermissionProvider(state: state),
            collectionAdvanceDelay: .zero
        )
    }

    @Test("Initial path is empty")
    func testInitialPathIsEmpty() {
        let c = makeCoordinator()
        #expect(c.path.isEmpty)
    }

    @Test("start() pushes cameraExplainer")
    func testStartPushesExplainer() {
        let c = makeCoordinator()
        c.start()
        #expect(c.path == [.cameraExplainer])
    }

    @Test("activeSlot is .front when nothing captured")
    func testActiveSlotIsFrontWhenNothingCaptured() {
        let c = makeCoordinator()
        #expect(c.activeSlot == .front)
    }

    @Test("activeSlot is .side after front captured")
    func testActiveSlotIsSideAfterFrontCaptured() {
        let c = makeCoordinator()
        c.capturedPhotos.front = UIImage()
        #expect(c.activeSlot == .side)
    }

    @Test("activeSlot is .document after front and side captured")
    func testActiveSlotIsDocumentAfterSideCaptured() {
        let c = makeCoordinator()
        c.capturedPhotos.front = UIImage()
        c.capturedPhotos.side = UIImage()
        #expect(c.activeSlot == .document)
    }

    @Test("activeSlot is nil when all captured")
    func testActiveSlotIsNilWhenAllCaptured() {
        let c = makeCoordinator()
        c.capturedPhotos.front = UIImage()
        c.capturedPhotos.side = UIImage()
        c.capturedPhotos.document = UIImage()
        #expect(c.activeSlot == nil)
    }

    @Test("capturePhoto(slot:image:) mutates capturedPhotos.front")
    func testCapturingFrontMutatesPhotos() {
        let c = makeCoordinator()
        c.path = [.cameraExplainer, .photoCollection, .cameraCapture(.front)]
        c.capturePhoto(slot: .front, image: UIImage())
        #expect(c.capturedPhotos.front != nil)
    }

    @Test("capturePhoto(slot:image:) pops camera from path")
    func testCapturingFrontPopsCamera() {
        let c = makeCoordinator()
        c.path = [.cameraExplainer, .photoCollection, .cameraCapture(.front)]
        c.capturePhoto(slot: .front, image: UIImage())
        #expect(!c.path.contains(.cameraCapture(.front)))
    }

    @Test("retake(slot:) clears slot and pushes camera")
    func testRetakingFrontClearsThatSlotAndPushesCamera() {
        let c = makeCoordinator()
        c.capturedPhotos.front = UIImage()
        c.retake(slot: .front)
        #expect(c.capturedPhotos.front == nil)
        #expect(c.path.last == .cameraCapture(.front))
    }

    @Test("advanceFromCollection() pushes profileReview")
    func testAdvanceFromCollectionPushesProfileReview() async {
        let c = makeCoordinator()
        c.path = [.cameraExplainer, .photoCollection]
        await c.advanceFromCollection()
        #expect(c.path.last == .profileReview)
    }

    @Test("setBreed(_:) mutates profile.breed")
    func testUpdateProfileBreedMutatesProfile() {
        let c = makeCoordinator()
        c.setBreed("Persian")
        #expect(c.profile.breed == "Persian")
    }

    @Test("setGender(_:) mutates profile.gender")
    func testUpdateProfileGenderMutatesProfile() {
        let c = makeCoordinator()
        c.setGender(.male)
        #expect(c.profile.gender == .male)
    }

    @Test("removeVetRecord(id:) reduces list by one")
    func testRemoveVetRecordReducesListByOne() {
        let c = makeCoordinator()
        let initial = c.profile.vetRecords.count
        guard let first = c.profile.vetRecords.first else {
            Issue.record("mochi mock should have at least one vet record")
            return
        }
        c.removeVetRecord(id: first.id)
        #expect(c.profile.vetRecords.count == initial - 1)
    }

    @Test("skipDocument() sets isDocumentSkipped")
    func testSkipDocumentSetsFlag() {
        let c = makeCoordinator()
        c.skipDocument()
        #expect(c.isDocumentSkipped)
    }
}
