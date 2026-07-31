import Foundation

enum MatchFormat: String, Codable, CaseIterable {
    case bestOf5 = "BEST_OF_5"
    case bestOf3 = "BEST_OF_3"
    case singleSet = "SINGLE_SET"
    
    var title: String {
        switch self {
        case .bestOf5: return "Best of 5"
        case .bestOf3: return "Best of 3"
        case .singleSet: return "Single Set"
        }
    }
    
    var setsNeededToWin: Int {
        switch self {
        case .bestOf5: return 3
        case .bestOf3: return 2
        case .singleSet: return 1
        }
    }
}

enum MatchType: String, Codable, CaseIterable {
    case friendly = "FRIENDLY"
    case tournament = "TOURNAMENT"
    case league = "LEAGUE"
    case practice = "PRACTICE"
    
    var title: String {
        switch self {
        case .friendly: return "Friendly"
        case .tournament: return "Tournament"
        case .league: return "League"
        case .practice: return "Practice"
        }
    }
}

enum MatchStatus: String, Codable {
    case inProgress = "IN_PROGRESS"
    case completed = "COMPLETED"
    case paused = "PAUSED"
}

enum ServeSide: String, Codable {
    case left = "L"
    case right = "R"
    
    var title: String {
        switch self {
        case .left: return "Left Box (L)"
        case .right: return "Right Box (R)"
        }
    }
}

enum DecisionType: String, Codable {
    case yesLet = "YES_LET"
    case stroke = "STROKE"
    case noLet = "NO_LET"
    
    var title: String {
        switch self {
        case .yesLet: return "YES LET (Replay)"
        case .stroke: return "STROKE (Point Awarded)"
        case .noLet: return "NO LET (Denied)"
        }
    }
}

struct RefereeDecision: Identifiable, Codable {
    let id: String
    let timestamp: Date
    let setIndex: Int
    let requestingPlayerId: String
    let decision: DecisionType
    let p1Score: Int
    let p2Score: Int
}

struct SetResult: Identifiable, Codable {
    var id: Int { setNumber }
    let setNumber: Int
    let p1Score: Int
    let p2Score: Int
    let winnerId: String
    let durationSeconds: Int
}

struct SquashMatch: Identifiable, Codable {
    let id: String
    let date: Date
    let player1: Player
    let player2: Player
    var p1SetsWon: Int
    var p2SetsWon: Int
    var sets: [SetResult]
    var decisions: [RefereeDecision]
    let matchFormat: MatchFormat
    let matchType: MatchType
    let targetPoints: Int // Defaults to 11 (PARS)
    var status: MatchStatus
    var winnerId: String?
    var totalDurationSeconds: Int
    var notes: String?
}
