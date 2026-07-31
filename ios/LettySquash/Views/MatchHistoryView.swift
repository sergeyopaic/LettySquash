import SwiftUI

struct MatchHistoryView: View {
    @EnvironmentObject var dataStore: SquashDataStore
    
    var body: some View {
        NavigationView {
            List {
                ForEach(dataStore.matches) { match in
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            Text(match.matchType.title)
                                .font(.caption2)
                                .fontWeight(.bold)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 2)
                                .background(Color.gray.opacity(0.1))
                                .foregroundColor(LettyTheme.textSecondary)
                                .cornerRadius(6)
                            
                            Spacer()
                            
                            Text(match.date, style: .date)
                                .font(.caption2)
                                .foregroundColor(LettyTheme.textSecondary)
                        }
                        
                        HStack {
                            VStack(alignment: .leading) {
                                Text(match.player1.name)
                                    .font(.subheadline)
                                    .fontWeight(match.winnerId == match.player1.id ? .bold : .regular)
                            }
                            
                            Spacer()
                            
                            Text("\(match.p1SetsWon) : \(match.p2SetsWon)")
                                .font(.headline)
                                .fontWeight(.black)
                                .foregroundColor(LettyTheme.navyPrimary)
                            
                            Spacer()
                            
                            VStack(alignment: .trailing) {
                                Text(match.player2.name)
                                    .font(.subheadline)
                                    .fontWeight(match.winnerId == match.player2.id ? .bold : .regular)
                            }
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
            .navigationTitle("Match History")
        }
    }
}
