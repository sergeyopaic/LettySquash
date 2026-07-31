import Foundation

enum SkillLevel: String, Codable, CaseIterable {
    case a1 = "A1"
    case a2 = "A2"
    case b1 = "B1"
    case b2 = "B2"
    case c1 = "C1"
    case c2 = "C2"
    case d1 = "D1"
    case d2 = "D2"
    case e1 = "E1"
    case e2 = "E2"
    case f = "F"
    case j1 = "J1"
    case j2 = "J2"
    case j3 = "J3"
    case j4 = "J4"
    
    var localizedName: String {
        return rawValue
    }
}

enum Handedness: String, Codable, CaseIterable {
    case right = "Right"
    case left = "Left"
    
    var localizedName: String {
        switch self {
        case .right: return "Right-handed"
        case .left: return "Left-handed"
        }
    }
}

struct Player: Identifiable, Codable, Hashable {
    let id: String
    var name: String
    var avatarBgHex: String
    var skillLevel: SkillLevel
    var countryFlag: String
    var countryCode: String
    var handedness: Handedness
    var totalMatches: Int
    var wins: Int
    var losses: Int
    let createdAt: Date
    
    var winRateFormatted: String {
        guard totalMatches > 0 else { return "0%" }
        let rate = Double(wins) / Double(totalMatches) * 100.0
        return String(format: "%.0f%%", rate)
    }
}
