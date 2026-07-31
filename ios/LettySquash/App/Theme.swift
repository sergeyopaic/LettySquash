import SwiftUI

enum LettyTheme {
    // Primary Navy Blue matching Letty's shirt
    static let navyPrimary = Color(red: 0.118, green: 0.161, blue: 0.231) // #1E293B
    static let navyLight = Color(red: 0.200, green: 0.255, blue: 0.333) // #334155
    
    // Otter Warm Brown matching Letty's fur
    static let otterBrown = Color(red: 0.604, green: 0.384, blue: 0.216) // #9A6237
    static let otterWarm = Color(red: 0.706, green: 0.471, blue: 0.275) // #B47846
    
    // Squash Gold matching ball & trophies
    static let squashGold = Color(red: 0.961, green: 0.620, blue: 0.043) // #F59E0B
    static let squashYellow = Color(red: 0.980, green: 0.800, blue: 0.082) // #FACC15
    
    // Light background system
    static let bgMain = Color(red: 0.973, green: 0.980, blue: 0.988) // #F8FAFC
    static let cardBg = Color.white
    
    // Text colors
    static let textPrimary = Color(red: 0.059, green: 0.090, blue: 0.165)
    static let textSecondary = Color(red: 0.392, green: 0.455, blue: 0.545)
    
    // Gradients
    static let lettyGradient = LinearGradient(
        colors: [navyPrimary, Color(red: 0.059, green: 0.090, blue: 0.165)],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    
    static let goldGradient = LinearGradient(
        colors: [squashGold, squashYellow],
        startPoint: .leading,
        endPoint: .trailing
    )
}

struct CardModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding()
            .background(LettyTheme.cardBg)
            .cornerRadius(20)
            .shadow(color: Color.black.opacity(0.04), radius: 10, x: 0, y: 4)
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(Color.black.opacity(0.05), lineWidth: 1)
            )
    }
}

extension View {
    func lettyCardStyle() -> some View {
        self.modifier(CardModifier())
    }
}
