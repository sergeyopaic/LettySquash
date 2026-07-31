import SwiftUI

@main
struct LettySquashApp: App {
    @StateObject private var dataStore = SquashDataStore.shared

    var body: some Scene {
        WindowGroup {
            MainTabView()
                .environmentObject(dataStore)
                .preferredColorScheme(.light)
        }
    }
}

struct MainTabView: View {
    @EnvironmentObject var dataStore: SquashDataStore
    @State private var selectedTab: Tab = .home
    @State private var isNewMatchPresented = false

    enum Tab {
        case home, match, players, history
    }

    var body: some View {
        TabView(selection: $selectedTab) {
            DashboardView(onStartNewMatch: { isNewMatchPresented = true })
                .tabItem {
                    Label("Home", systemImage: "house.fill")
                }
                .tag(Tab.home)

            ScoreboardView()
                .tabItem {
                    Label("Live Match", systemImage: "play.circle.fill")
                }
                .tag(Tab.match)

            PlayersView()
                .tabItem {
                    Label("Players", systemImage: "person.2.fill")
                }
                .tag(Tab.players)

            MatchHistoryView()
                .tabItem {
                    Label("History", systemImage: "clock.arrow.circlepath")
                }
                .tag(Tab.history)
        }
        .accentColor(LettyTheme.navyPrimary)
        .sheet(isPresented: $isNewMatchPresented) {
            NewMatchView(onMatchStarted: {
                selectedTab = .match
            })
        }
    }
}
