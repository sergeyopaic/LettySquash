import SwiftUI

struct LettyBannerView: View {
    @EnvironmentObject var dataStore: SquashDataStore
    let tipMessage: String
    var isHome: Bool = true
    
    var body: some View {
        if !dataStore.showMascotTips && isHome {
            EmptyView()
        } else {
            HStack(alignment: .top, spacing: 14) {
                ZStack(alignment: .bottomTrailing) {
                    Image("letty_avatar")
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(width: 56, height: 56)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .stroke(LettyTheme.navyPrimary.opacity(0.1), lineWidth: 1)
                        )
                    
                    Image(systemName: "sparkles")
                        .font(.system(size: 9, weight: .black))
                        .padding(3)
                        .background(LettyTheme.squashGold)
                        .foregroundColor(LettyTheme.navyPrimary)
                        .clipShape(Circle())
                        .offset(x: 4, y: 4)
                }
                
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text("Tips from Letty")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 2)
                            .background(Color.blue.opacity(0.1))
                            .foregroundColor(LettyTheme.navyPrimary)
                            .cornerRadius(6)
                        Spacer()
                    }
                    
                    Text(tipMessage)
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(LettyTheme.textPrimary)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(Color.white)
                    .shadow(color: Color.black.opacity(0.04), radius: 8, x: 0, y: 3)
            )
        }
    }
}
