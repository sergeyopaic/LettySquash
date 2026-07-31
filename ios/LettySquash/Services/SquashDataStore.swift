import SwiftUI
import Combine

class SquashDataStore: ObservableObject {
    static let shared = SquashDataStore()
    
    @Published var players: [Player] = []
    @Published var matches: [SquashMatch] = []
    @Published var activeMatchState: LiveMatchStateSwift?
    @Published var showMascotTips: Bool = true
    
    struct LiveMatchStateSwift {
        var match: SquashMatch
        var currentSetIndex: Int
        var p1CurrentScore: Int
        var p2CurrentScore: Int
        var currentServerId: String
        var currentServeSide: ServeSide
        var isTimerRunning: Bool
        var timerSeconds: Int
    }
    
    private init() {
        loadMockData()
    }
    
    private func loadMockData() {
        let p1 = Player(id: "p1", name: "Liam Walker", avatarBgHex: "3B82F6", skillLevel: .b1, countryFlag: "🇳🇿", countryCode: "NZ", handedness: .right, totalMatches: 12, wins: 9, losses: 3, createdAt: Date())
        let p2 = Player(id: "p2", name: "Sophia Chen", avatarBgHex: "EC4899", skillLevel: .c2, countryFlag: "🇦🇺", countryCode: "AU", handedness: .right, totalMatches: 8, wins: 5, losses: 3, createdAt: Date())
        let p3 = Player(id: "p3", name: "James Smith", avatarBgHex: "10B981", skillLevel: .a2, countryFlag: "🇬🇧", countryCode: "GB", handedness: .left, totalMatches: 15, wins: 13, losses: 2, createdAt: Date())
        
        players = [p1, p2, p3]
        
        let m1 = SquashMatch(
            id: "m1",
            date: Date(),
            player1: p1,
            player2: p2,
            p1SetsWon: 3,
            p2SetsWon: 1,
            sets: [
                SetResult(setNumber: 1, p1Score: 11, p2Score: 8, winnerId: "p1", durationSeconds: 420),
                SetResult(setNumber: 2, p1Score: 9, p2Score: 11, winnerId: "p2", durationSeconds: 510),
                SetResult(setNumber: 3, p1Score: 11, p2Score: 6, winnerId: "p1", durationSeconds: 360),
                SetResult(setNumber: 4, p1Score: 11, p2Score: 9, winnerId: "p1", durationSeconds: 480)
            ],
            decisions: [],
            matchFormat: .bestOf5,
            matchType: .friendly,
            targetPoints: 11,
            status: .completed,
            winnerId: "p1",
            totalDurationSeconds: 1770,
            notes: "Dynamic fast-paced match!"
        )
        
        matches = [m1]
    }
    
    func addPlayer(name: String, skillLevel: SkillLevel, countryFlag: String, countryCode: String, handedness: Handedness, avatarBgHex: String) {
        let newPlayer = Player(
            id: UUID().uuidString,
            name: name,
            avatarBgHex: avatarBgHex,
            skillLevel: skillLevel,
            countryFlag: countryFlag,
            countryCode: countryCode,
            handedness: handedness,
            totalMatches: 0,
            wins: 0,
            losses: 0,
            createdAt: Date()
        )
        players.insert(newPlayer, at: 0)
    }
    
    func startNewMatch(player1: Player, player2: Player, format: MatchFormat, matchType: MatchType, initialServerId: String, serveSide: ServeSide) {
        let newMatch = SquashMatch(
            id: UUID().uuidString,
            date: Date(),
            player1: player1,
            player2: player2,
            p1SetsWon: 0,
            p2SetsWon: 0,
            sets: [],
            decisions: [],
            matchFormat: format,
            matchType: matchType,
            targetPoints: 11,
            status: .inProgress,
            totalDurationSeconds: 0
        )
        
        activeMatchState = LiveMatchStateSwift(
            match: newMatch,
            currentSetIndex: 1,
            p1CurrentScore: 0,
            p2CurrentScore: 0,
            currentServerId: initialServerId,
            currentServeSide: serveSide,
            isTimerRunning: true,
            timerSeconds: 0
        )
    }
    
    func recordPoint(for playerId: String) {
        guard var state = activeMatchState else { return }
        
        if playerId == state.match.player1.id {
            state.p1CurrentScore += 1
        } else {
            state.p2CurrentScore += 1
        }
        
        if playerId == state.currentServerId {
            state.currentServeSide = (state.currentServeSide == .left) ? .right : .left
        } else {
            state.currentServerId = playerId
            state.currentServeSide = .right
        }
        
        let target = state.match.targetPoints
        if (state.p1CurrentScore >= target && state.p1CurrentScore - state.p2CurrentScore >= 2) {
            winSet(winnerId: state.match.player1.id, state: &state)
        } else if (state.p2CurrentScore >= target && state.p2CurrentScore - state.p1CurrentScore >= 2) {
            winSet(winnerId: state.match.player2.id, state: &state)
        }
        
        activeMatchState = state
    }
    
    private func winSet(winnerId: String, state: inout LiveMatchStateSwift) {
        let newSet = SetResult(
            setNumber: state.currentSetIndex,
            p1Score: state.p1CurrentScore,
            p2Score: state.p2CurrentScore,
            winnerId: winnerId,
            durationSeconds: state.timerSeconds
        )
        state.match.sets.append(newSet)
        
        if winnerId == state.match.player1.id {
            state.match.p1SetsWon += 1
        } else {
            state.match.p2SetsWon += 1
        }
        
        let needed = state.match.matchFormat.setsNeededToWin
        if state.match.p1SetsWon >= needed {
            state.match.winnerId = state.match.player1.id
            state.match.status = .completed
        } else if state.match.p2SetsWon >= needed {
            state.match.winnerId = state.match.player2.id
            state.match.status = .completed
        } else {
            state.currentSetIndex += 1
            state.p1CurrentScore = 0
            state.p2CurrentScore = 0
        }
    }
    
    func finishActiveMatch() {
        guard let state = activeMatchState else { return }
        var finalMatch = state.match
        finalMatch.status = .completed
        matches.insert(finalMatch, at: 0)
        activeMatchState = nil
    }
}
