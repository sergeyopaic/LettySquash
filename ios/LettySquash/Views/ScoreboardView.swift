import SwiftUI

struct ScoreboardView: View {
    @EnvironmentObject var dataStore: SquashDataStore
    
    var body: some View {
        NavigationView {
            Group {
                if let state = dataStore.activeMatchState {
                    VStack(spacing: 20) {
                        // Header Set Info
                        HStack {
                            Text("Set \(state.currentSetIndex)")
                                .font(.caption)
                                .fontWeight(.bold)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 4)
                                .background(LettyTheme.navyPrimary)
                                .foregroundColor(LettyTheme.squashYellow)
                                .cornerRadius(8)
                            
                            Spacer()
                            
                            Text("WSF PARS 11")
                                .font(.caption)
                                .fontWeight(.semibold)
                                .foregroundColor(LettyTheme.textSecondary)
                        }
                        
                        // Score Cards Grid
                        HStack(spacing: 16) {
                            // Player 1 Card
                            ScoreCard(
                                name: state.match.player1.name,
                                score: state.p1CurrentScore,
                                isServing: state.currentServerId == state.match.player1.id,
                                serveSide: state.currentServeSide,
                                onTap: {
                                    HapticManager.shared.impact(style: .medium)
                                    dataStore.recordPoint(for: state.match.player1.id)
                                }
                            )
                            
                            // Player 2 Card
                            ScoreCard(
                                name: state.match.player2.name,
                                score: state.p2CurrentScore,
                                isServing: state.currentServerId == state.match.player2.id,
                                serveSide: state.currentServeSide,
                                onTap: {
                                    HapticManager.shared.impact(style: .medium)
                                    dataStore.recordPoint(for: state.match.player2.id)
                                }
                            )
                        }
                        
                        Spacer()
                        
                        Button(action: {
                            dataStore.finishActiveMatch()
                        }) {
                            Text("Finish Match")
                                .font(.headline)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(LettyTheme.navyPrimary)
                                .cornerRadius(16)
                        }
                    }
                    .padding()
                } else {
                    VStack(spacing: 12) {
                        Image(systemName: "circle.circle.fill")
                            .font(.system(size: 48))
                            .foregroundColor(LettyTheme.textSecondary)
                        Text("No active match")
                            .font(.headline)
                            .foregroundColor(LettyTheme.textSecondary)
                    }
                }
            }
            .background(LettyTheme.bgMain.ignoresSafeArea())
            .navigationTitle("Live Referee")
        }
    }
}

struct ScoreCard: View {
    let name: String
    let score: Int
    let isServing: Bool
    let serveSide: ServeSide
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 16) {
                if isServing {
                    Text("SERVE \(serveSide.rawValue)")
                        .font(.caption2)
                        .fontWeight(.black)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(LettyTheme.squashGold)
                        .foregroundColor(LettyTheme.navyPrimary)
                        .cornerRadius(6)
                } else {
                    Spacer().frame(height: 16)
                }
                
                Text(name)
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(LettyTheme.textPrimary)
                    .lineLimit(1)
                
                Text("\(score)")
                    .font(.system(size: 64, weight: .black, design: .rounded))
                    .foregroundColor(LettyTheme.navyPrimary)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.white)
            .cornerRadius(20)
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(isServing ? LettyTheme.squashGold : Color.black.opacity(0.05), lineWidth: isServing ? 2 : 1)
            )
            .shadow(color: Color.black.opacity(0.05), radius: 10, x: 0, y: 4)
        }
        .buttonStyle(PlainButtonStyle())
    }
}
