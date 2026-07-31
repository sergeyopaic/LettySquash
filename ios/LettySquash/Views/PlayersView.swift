import SwiftUI

struct PlayersView: View {
    @EnvironmentObject var dataStore: SquashDataStore
    @State private var isAddPlayerPresented = false
    
    var body: some View {
        NavigationView {
            List {
                ForEach(dataStore.players) { player in
                    HStack(spacing: 14) {
                        Text(String(player.name.prefix(1)))
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .frame(width: 44, height: 44)
                            .background(LettyTheme.navyPrimary)
                            .clipShape(Circle())
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text(player.name)
                                .font(.headline)
                                .foregroundColor(LettyTheme.textPrimary)
                            Text("\(player.skillLevel.localizedName) • \(player.handedness.localizedName)")
                                .font(.caption)
                                .foregroundColor(LettyTheme.textSecondary)
                        }
                        
                        Spacer()
                        
                        VStack(alignment: .trailing, spacing: 2) {
                            Text("\(player.wins)W / \(player.losses)L")
                                .font(.subheadline)
                                .fontWeight(.bold)
                                .foregroundColor(LettyTheme.navyPrimary)
                            Text("Win Rate \(player.winRateFormatted)")
                                .font(.caption2)
                                .foregroundColor(LettyTheme.squashGold)
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
            .navigationTitle("Club Roster")
            .navigationBarItems(trailing: Button(action: {
                isAddPlayerPresented = true
            }) {
                Image(systemName: "person.badge.plus")
                    .foregroundColor(LettyTheme.navyPrimary)
            })
            .sheet(isPresented: $isAddPlayerPresented) {
                AddPlayerFormView()
            }
        }
    }
}

struct AddPlayerFormView: View {
    @Environment(\.presentationMode) var presentationMode
    @EnvironmentObject var dataStore: SquashDataStore
    
    @State private var name = ""
    @State private var skillLevel: SkillLevel = .intermediate
    @State private var handedness: Handedness = .right
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Personal Info")) {
                    TextField("Full Name", text: $name)
                    Picker("Skill Level", selection: $skillLevel) {
                        ForEach(SkillLevel.allCases, id: \.self) { level in
                            Text(level.localizedName).tag(level)
                        }
                    }
                    Picker("Handedness", selection: $handedness) {
                        ForEach(Handedness.allCases, id: \.self) { hand in
                            Text(hand.localizedName).tag(hand)
                        }
                    }
                }
                
                Section {
                    Button("Save Profile") {
                        guard !name.isEmpty else { return }
                        dataStore.addPlayer(name: name, skillLevel: skillLevel, handedness: handedness, avatarBgHex: "3B82F6")
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
            .navigationTitle("New Player")
            .navigationBarItems(leading: Button("Cancel") {
                presentationMode.wrappedValue.dismiss()
            })
        }
    }
}
