import SwiftUI

struct NewMatchView: View {
    @Environment(\.presentationMode) var presentationMode
    @EnvironmentObject var dataStore: SquashDataStore
    
    @State private var player1Index = 0
    @State private var player2Index = 1
    @State private var selectedFormat: MatchFormat = .bestOf5
    @State private var selectedType: MatchType = .friendly
    @State private var serveSide: ServeSide = .right
    
    var onMatchStarted: () -> Void
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Players")) {
                    Picker("Player 1", selection: $player1Index) {
                        ForEach(0..<dataStore.players.count, id: \.self) { idx in
                            Text(dataStore.players[idx].name).tag(idx)
                        }
                    }
                    Picker("Player 2", selection: $player2Index) {
                        ForEach(0..<dataStore.players.count, id: \.self) { idx in
                            Text(dataStore.players[idx].name).tag(idx)
                        }
                    }
                }
                
                Section(header: Text("Match Format")) {
                    Picker("Format", selection: $selectedFormat) {
                        ForEach(MatchFormat.allCases, id: \.self) { fmt in
                            Text(fmt.title).tag(fmt)
                        }
                    }
                    Picker("Match Type", selection: $selectedType) {
                        ForEach(MatchType.allCases, id: \.self) { type in
                            Text(type.title).tag(type)
                        }
                    }
                }
                
                Section {
                    Button(action: {
                        guard dataStore.players.count >= 2, player1Index != player2Index else { return }
                        let p1 = dataStore.players[player1Index]
                        let p2 = dataStore.players[player2Index]
                        dataStore.startNewMatch(player1: p1, player2: p2, format: selectedFormat, matchType: selectedType, initialServerId: p1.id, serveSide: serveSide)
                        presentationMode.wrappedValue.dismiss()
                        onMatchStarted()
                    }) {
                        HStack {
                            Spacer()
                            Text("Start Match")
                                .font(.headline)
                                .fontWeight(.bold)
                                .foregroundColor(LettyTheme.squashYellow)
                            Spacer()
                        }
                    }
                    .listRowBackground(LettyTheme.navyPrimary)
                }
            }
            .navigationTitle("New Match")
            .navigationBarItems(leading: Button("Cancel") {
                presentationMode.wrappedValue.dismiss()
            })
        }
    }
}
