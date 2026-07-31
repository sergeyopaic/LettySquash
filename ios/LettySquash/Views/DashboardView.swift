import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var dataStore: SquashDataStore
    var onStartNewMatch: () -> Void
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Letty Mascot Banner
                    LettyBannerView(tipMessage: "In squash, scoring is to 11 points (PARS). At 10-10, play continues until a player leads by 2 points!")
                    
                    // Quick Action Buttons
                    HStack(spacing: 12) {
                        Button(action: onStartNewMatch) {
                            VStack(alignment: .leading, spacing: 10) {
                                Image(systemName: "play.fill")
                                    .font(.title2)
                                    .padding(10)
                                    .background(LettyTheme.navyPrimary)
                                    .foregroundColor(.white)
                                    .clipShape(RoundedRectangle(cornerRadius: 12))
                                
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("New Match")
                                        .font(.subheadline)
                                        .fontWeight(.bold)
                                        .foregroundColor(LettyTheme.textPrimary)
                                    Text("Keep live score")
                                        .font(.caption2)
                                        .foregroundColor(LettyTheme.textSecondary)
                                }
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .lettyCardStyle()
                        }
                    }
                    
                    // Club Statistics Card
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Club Statistics")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(LettyTheme.textSecondary)
                            .textCase(.uppercase)
                        
                        HStack(spacing: 12) {
                            StatBox(title: "Total Matches", value: "\(dataStore.matches.count)")
                            StatBox(title: "Players", value: "\(dataStore.players.count)")
                            StatBox(title: "Rules", value: "PARS 11")
                        }
                    }
                    .lettyCardStyle()
                    
                    // Recent Matches Section
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Recent Matches")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(LettyTheme.textPrimary)
                        
                        ForEach(dataStore.matches.prefix(3)) { match in
                            HStack {
                                Text(match.player1.name)
                                    .font(.subheadline)
                                    .fontWeight(match.winnerId == match.player1.id ? .bold : .regular)
                                
                                Spacer()
                                
                                Text("\(match.p1SetsWon) : \(match.p2SetsWon)")
                                    .font(.headline)
                                    .fontWeight(.black)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 4)
                                    .background(LettyTheme.navyPrimary)
                                    .foregroundColor(LettyTheme.squashYellow)
                                    .cornerRadius(8)
                                
                                Spacer()
                                
                                Text(match.player2.name)
                                    .font(.subheadline)
                                    .fontWeight(match.winnerId == match.player2.id ? .bold : .regular)
                            }
                            .padding(.vertical, 8)
                            .lettyCardStyle()
                        }
                    }
                }
                .padding()
            }
            .background(LettyTheme.bgMain.ignoresSafeArea())
            .navigationTitle("Letty Squash")
        }
    }
}

struct StatBox: View {
    let title: String
    let value: String
    
    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title3)
                .fontWeight(.black)
                .foregroundColor(LettyTheme.navyPrimary)
            Text(title)
                .font(.caption2)
                .foregroundColor(LettyTheme.textSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(10)
        .background(Color.gray.opacity(0.05))
        .cornerRadius(12)
    }
}
