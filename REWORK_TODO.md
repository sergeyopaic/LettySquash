# Letty Squash — REWORK TODO
## Переход от экосистемы к инструменту судейства

**Дата**: 2026-08-07  
**Философия**: *"Приложение, которое позволяет начать матч за 10 секунд"*

---

## 🎯 Стратегия: Three Phases

### **Phase 0: Analysis & Architecture** ✅ (this doc)
Зафиксировать новую архитектуру, выявить, что можно удалить.

### **Phase 1: Core Simplification**
Упростить модели данных, удалить API зависимости, подготовить фундамент для облака.

### **Phase 2: UI/UX Overhaul**
Переделать навигацию, ускорить создание матча, упростить соревнования.

### **Phase 3: Polish & Launch**
Отполировать функционал, исправить баги, подготовить к AppStore.

---

## 📊 ФАЗА 1: Core Simplification

### 1.1 Создать новую архитектуру данных

**Файл**: `src/types/squash.ts`

#### **1.1.1 Заменить `Club` на `Folder`**
```diff
- export interface Club {
-   id: string;
-   name: string;
-   city: string;
-   country: string;
-   countryFlag: string;
- }

+ export interface Folder {
+   id: string;
+   name: string;  // "Tuesday Friends", "Auckland", "Club A", etc.
+   icon?: string; // emoji или preset icon
+   createdAt: string;
+   updatedAt: string;
+ }
```

**Почему**: Папка — универсальный контейнер, которым пользователь сам решает, как её использовать.  
**Что исчезает**: city, country, countryFlag, API интеграции.

#### **1.1.2 Упростить `Player`**
```diff
  export interface Player {
    id: string;
+   uuid?: string;  // для облачной синхронизации (Phase 2)
    name: string;
-   avatarUrl?: string;  // ❌ удалить: нет API
    avatarBgColor: string;
-   skillGrade: NZSquashGrade;  // ⚠️ обсудить: оставить для статистики?
-   countryFlag: string;  // ❌ удалить: слишком сложно
-   countryCode: string;  // ❌ удалить: слишком сложно
-   handedness: Handedness;  // ⚠️ опционально
    clubId?: string;  // ❌ заменить на folderId
+   folderId?: string;  // можно сохранить игрока без папки
    totalMatches: number;
    wins: number;
    losses: number;
    createdAt: string;
+   nickname?: string;  // опционально
+   notes?: string;  // опционально
  }
```

**Что исчезает**: avatarUrl, skillGrade, countryFlag, countryCode  
**Что остаётся**: name, handedness (пригодится для рейтинга), stats  
**Что добавляем**: uuid (для облака), nickname, notes, folderId

#### **1.1.3 Новые типы**
```typescript
// Для отслеживания облачной синхронизации (Phase 2)
export interface SyncMetadata {
  localUUID: string;
  cloudUUID?: string;
  lastSyncedAt?: string;
  isDirty: boolean;  // нужна ресинхронизация
}

// Для будущих авторизаций
export interface UserProfile {
  id?: string;  // опционально, для Apple ID/etc
  displayName: string;
  createdAt: string;
}
```

**Стоимость**: 2-3 часа  
**Файлы**: `src/types/squash.ts`

---

### 1.2 Обновить localStorage слой

**Файл**: `src/context/SquashContext.tsx`

#### **1.2.1 Переименовать версии хранилища**
```typescript
// Старо (но не удаляем первое время - миграция)
const LOCAL_STORAGE_PLAYERS_V4 = 'letty_squash_players_v4';
const LOCAL_STORAGE_CLUBS = 'letty_squash_clubs';  // ❌ deprecated

// Ново
const LOCAL_STORAGE_FOLDERS = 'letty_squash_folders_v1';
const LOCAL_STORAGE_PLAYERS_V5 = 'letty_squash_players_v5';
const LOCAL_STORAGE_MATCHES_V7 = 'letty_squash_matches_v7';
```

#### **1.2.2 Функция миграции данных**
```typescript
// При первой загрузке: если есть старые клубы в Players,
// создаём их как Folders и переносим игроков туда
const migrateClubsToFolders = (): Folder[] => {
  const oldPlayers = loadFromStorage(LOCAL_STORAGE_PLAYERS_V4, []);
  const uniqueClubIds = new Set(oldPlayers.map(p => p.clubId).filter(Boolean));
  
  // Создаём Folder для каждого старого Club
  const folders: Folder[] = Array.from(uniqueClubIds).map(clubId => ({
    id: generateId(),
    name: `Folder ${clubId}`,  // или find in CLUBS_LIST
    createdAt: new Date().toISOString(),
  }));
  
  return folders;
};
```

**Стоимость**: 1 час  
**Важно**: Это backward-compatible, старые данные не удаляются сразу.

---

### 1.3 Удалить API/MySquash зависимости

**Файлы для удаления**:
- `src/utils/ratingUtils.ts` — полностью? Или оставить для локальной статистики? ⚠️ **РЕШЕНИЕ ПОТОМ**
- `src/components/ClubSelectorModal.tsx` — переделать на `FolderSelectorModal`
- `CLUBS_LIST` из App.tsx

**Файлы для обновления**:
- `src/data/mockData.ts` — заменить CLUBS_LIST на INITIAL_FOLDERS
- `src/context/SquashContext.tsx` — addFolder(), deleteFolder(), updateFolder() вместо Club методов

**Стоимость**: 1-2 часа  
**Зависимость**: от 1.1 + 1.2

---

### 1.4 Добавить UUID для будущей облачной синхронизации

⚠️ **НЕ реализуем облачную синхронизацию**  
✅ **Но закладываем фундамент**

#### **1.4.1 UUID генератор**
```typescript
// src/utils/uuidUtils.ts
export const generateLocalUUID = (): string => {
  return 'local_' + Math.random().toString(36).substr(2, 9);
};

export const isLocalUUID = (uuid: string): boolean => {
  return uuid.startsWith('local_');
};
```

#### **1.4.2 Обновить все сущности**
```typescript
// При создании Player/Match/Competition/Folder
const newPlayer: Player = {
  id: generateId(),  // текущая система
  uuid: generateLocalUUID(),  // новая, для облака
  name,
  // ...остальное
};
```

**Стоимость**: 1 час  
**Важно**: Это не усложняет текущий функционал, просто добавляет поле.

---

## 📊 ФАЗА 2: UI/UX Overhaul

### 2.1 Переделать главный экран (Dashboard)

**Файл**: `src/components/DashboardView.tsx`

**Текущее состояние**:
- Top section: Club selector (Davenport Squash Club)
- Много кнопок: New Match, New Competition, Advanced Stats, etc.
- Клубная статистика
- Список соревнований

**Новое состояние**:
```
┌─────────────────────────────────┐
│ Resume Match (if active)         │
├─────────────────────────────────┤
│                                  │
│   ┌───────────────────────┐    │
│   │    QUICK MATCH         │    │ ← primary, большая
│   │  (saved defaults)      │    │
│   └───────────────────────┘    │
│                                  │
│  ┌───────────┐ ┌───────────┐   │
│  │  Custom   │ │Competitions│   │ ← secondary, вдвое меньше
│  │  Match    │ │            │   │
│  └───────────┘ └───────────┘   │
│                                  │
├─────────────────────────────────┤
│ [Players]  [History]  [Settings]│ ← tab bar / нижняя навигация
├─────────────────────────────────┤
│ Quick Stats (total matches, etc) │
├─────────────────────────────────┤
│ Recent Matches (last 5)         │
└─────────────────────────────────┘
```

**Три точки входа в матч** (см. 2.2 ниже):
1. **Quick Match** (primary CTA) — использует сохранённые настройки из Settings, самый быстрый путь (поиск игроков → Start)
2. **Custom Match** (secondary) — тот же поиск игроков, но перед стартом можно **разово** поменять формат (BO3/BO5, PARS-11/15, gap), не трогая сохранённый дефолт
3. **Competitions** (secondary) — структурированные турниры (Interclub, League) со своей моделью фикстур

**Почему разделяем Custom и Settings**: Если judge на один вечер играет Single Game вместо обычного Best of 3, ему не нужно лезть в Settings и потом возвращать обратно — Custom Match даёt одноразовое переопределение.

**Изменения**:
- ❌ Убрать Club Selector (больше нет главного клуба)
- ✅ Оставить Resume Match (если матч в процессе)
- ✅ Quick Match — primary кнопка, вдвое крупнее остальных
- ✅ Custom Match + Competitions — secondary, одинакового меньшего размера, рядом
- ✅ Простая статистика (кол-во матчей, выигрышей, последние)
- ❌ Убрать Advanced Stats (перенести в Players)

**Стоимость**: 2-3 часа  
**Зависимость**: от 1.3

---

### 2.2 Ускорить создание матча: "Quick Match" с настройками

**Файл**: `src/components/NewMatchModal.tsx` + `src/components/SettingsModal.tsx`

**Философия**:
- **90% матчей** — стандартные (Best of 3, PARS-11, 2-point gap)
- **10% юзеров** — играют PARS-15 или BO5 в своём клубе/регионе
- **Решение**: Quick Match с фиксированными параметрами + Settings для их изменения

**Новая архитектура**:

```typescript
// AppSettings расширяется
export interface AppSettings {
  showMascotTips: boolean;
  
  // Параметры Quick Match
  quickMatchFormat: 'BEST_OF_3' | 'BEST_OF_5';  // default: BEST_OF_3
  quickMatchTargetPoints: 11 | 15;               // default: 11 (PARS)
  quickMatchTwoPointGap: boolean;                // default: true
}
```

**UI: NewMatchModal имеет два режима — Quick и Custom, которые открываются с разных кнопок Dashboard**

#### **Режим A: Quick Match** (с primary кнопки)

```
┌────────────────────────────────┐
│ Quick Match                    │
├────────────────────────────────┤
│                                │
│ Player 1                       │
│ [Search / type name...]        │
│ - Recent ☝️                    │
│ - Alice      [x]               │
│ - Bob                          │
│ - Carol                        │
│                                │
│ Player 2                       │
│ [Search / type name...]        │
│ - Dave                         │
│ - Eve                          │
│                                │
│ ⚙️ Best of 3 • PARS-11        │  ← только инфо, клик → Settings
│                                │
│ [Cancel]  [Start Match]        │
└────────────────────────────────┘
```

Параметры **всегда** берутся из `settings.quickMatch*` — их нельзя поменять прямо тут, только через Settings (если юзер часто так делает — путь описан выше). Клик по строке параметров просто открывает `SettingsModal` → вкладка "Quick Match".

#### **Режим B: Custom Match** (с secondary кнопки)

```
┌────────────────────────────────┐
│ Custom Match                   │
├────────────────────────────────┤
│                                │
│ Player 1  [Search...]          │
│ Player 2  [Search...]          │
│                                │
│ Format                         │
│ ○ Best of 3  ○ Best of 5       │
│ ○ Single Game                  │
│                                │
│ Points                         │
│ ○ PARS-11  ○ PARS-15           │
│                                │
│ ☑ Two-point gap                │
│                                │
│ [Cancel]  [Start Match]        │
└────────────────────────────────┘
```

Те же поля выбора игроков, но добавляется **разовый** выбор формата — не трогает `settings.quickMatch*`, действует только на этот конкретный матч. Значения по умолчанию в форме = текущие Quick Match настройки (чтобы не начинать с нуля), но при сохранении никуда не пишутся, кроме самого матча.

**Общая логика для обоих режимов**:

1. **Поиск по имени** — в реальном времени фильтр
2. **Если не найден** → "+ Create 'Alice'"
   ```
   Alice
   [Enter]
   ↓
   "Player 'Alice' not found. [+ Create]"
   ↓
   Создаётся Player { name: 'Alice', id, uuid, ... }
   ```
3. **Новых игроков сохранить в папку** → **после матча** (не сейчас)

**Технически**: один компонент `NewMatchModal` с пропом `mode: 'quick' | 'custom'`, разница только в наличии блока выбора формата.

**UI: SettingsModal → "Quick Match" вкладка**

```
┌────────────────────────────────┐
│ Settings                       │
├─ Mascot Tips                   │
├─ Quick Match ← here            │
├─ About                         │
├────────────────────────────────┤
│                                │
│ Match Format                   │
│ ○ Best of 3 (first to 2 wins)  │
│ ○ Best of 5 (first to 3 wins)  │
│                                │
│ Points Per Game                │
│ ○ PARS-11 (standard)           │
│ ○ PARS-15 (regional variant)   │
│                                │
│ Two-Point Gap Rule             │
│ ☑ Enabled                      │
│ (if score tied at 10-10, play  │
│  until one player leads by 2)  │
│                                │
│ [Save]                         │
└────────────────────────────────┘
```

**Что убрать из диалога**:
- ❌ Выбор типа (Casual/Rated) → всегда Casual
- ❌ Выбор серве на этом экране → спросим на Scoreboard
- ✅ Поиск/фильтр игроков → главная фишка
- ✅ Быстрые настройки (одна ссылка вместо выбора каждый раз)

**Сценарий использования**:

*День 1, первый матч*:
```
1. Открыл NewMatchModal
2. Набрал "Alice" → Enter → "+ Create Alice"
3. Набрал "Bob" → Enter → "+ Create Bob"
4. Клик [Start Match]
5. На Scoreboard выбрал серве (Alice L / Bob R)
6. Отсудил матч
7. После матча: "Save Alice to folder? ○ No ○ Tuesday Friends"
```
**Время**: ~10 сек от открытия до старта судейства

*День 2, хочет PARS-15*:
```
1. Settings → Quick Match
2. Изменил "PARS-11" на "PARS-15"
3. [Save]
4. Теперь все матчи автоматически на PARS-15
```
**Время**: 30 сек, один раз

**Стоимость**: 3-4 часа (логика проста, нужна только рефакторинг Settings)  
**Зависимость**: от 1.1 (новая модель Player) + 4.1 (обновленные Settings)

---

### 2.3 Создать `FolderSelectorModal` (вместо `ClubSelectorModal`)

**Файл**: `src/components/FolderSelectorModal.tsx` (rename + update)

**Функционал**:
- Список папок (Folders)
- Кнопка "+ New Folder"
- После матча: "Save player to..."
  ```
  Player "Alice" created.
  
  Save to folder?
  ○ No thanks (save to "Unsorted")
  ○ Tuesday Friends
  ○ Auckland League
  ○ Club A
  [+ New Folder]
  ```

**Стоимость**: 2 часа  
**Зависимость**: от 1.3

---

### 2.4 Переделать PlayersView с папками

**Файл**: `src/components/PlayersView.tsx`

**Текущее**:
- Club selector вверху (Davenport)
- Фильтр по грейду
- Таблица игроков с рейтингом

**Новое** (как Files на iPhone):
```
ALL PLAYERS (showing 347)
🔍 [Search]

Folders
├─ Tuesday Friends (12)
├─ Auckland (8)
├─ Office (3)
└─ Junior Squad (5)

UNSORTED (127)
├─ Alice
├─ Bob
└─ ...
```

**Клик на папку** → раскрывается список игроков в ней  
**Клик на игрока** → PlayerProfileModal (статистика, всё как раньше)

**Стоимость**: 3-4 часа  
**Зависимость**: от 1.3, 2.3

---

### 2.5 Упростить Competitions

**Файл**: `src/components/NewCompetitionModal.tsx`

**Текущие форматы**:
- INTERCLUB_4VS4
- LEAGUE
- GROUPS_PLAYOFF
- SINGLE_ELIMINATION
- DOUBLE_ELIMINATION

**Новые** (Phase 1):
- ✅ INTERCLUB_4VS4 (100% оставляем)
- ✅ LEAGUE (уже готов)
- ❌ GROUPS_PLAYOFF → Phase 2
- ❌ SINGLE_ELIMINATION → Phase 2
- ❌ DOUBLE_ELIMINATION → Phase 2

**Изменения в NewCompetitionModal**:
```diff
  <select>
    <option value="INTERCLUB">Interclub (4v4)</option>
    <option value="LEAGUE">League (Round-Robin)</option>
-   <option value="GROUPS">Groups + Knockout</option>
-   <option value="SINGLE">Single Elimination</option>
-   <option value="DOUBLE">Double Elimination</option>
+   <!-- остальные перенесены, пока не реализованы полностью -->
  </select>
```

**UI**:
- Название турнира
- Выбрать участников (мультиселект)
- [Create]

**Формат автоматически** создаёт fixtures, как сейчас.

**Стоимость**: 1 час (просто скрыть опции)  
**Зависимость**: нет

---

### 2.6 Упростить ScoreboardView

**Файл**: `src/components/ScoreboardView.tsx`

**Что останется**:
- ✅ Выбор серве перед стартом
- ✅ Live scoreboard (P1 vs P2)
- ✅ Point tracking
- ✅ Timer (game, break)
- ✅ Rally Flow/Log
- ✅ Finish Match

**Что упростится**:
- ❌ Убрать выбор формата (11 vs 15) → всегда PARS-11
- ❌ Убрать выбор типа (Casual/Rated) → всегда Casual
- ✅ Кнопка "Save to Folder" → показывается после finish

**Стоимость**: 1 час  
**Зависимость**: от 2.2

---

## 📊 ФАЗА 3: Data Model Simplification

### 3.1 Упростить компонент AddPlayerModal

**Файл**: `src/components/AddPlayerModal.tsx`

**Текущие поля**:
- name
- grade (NZSquashGrade)
- country + flag
- handedness
- avatar (URL)
- club (selector)

**Новые поля**:
```typescript
export interface AddPlayerInput {
  name: string;        // required
  nickname?: string;   // optional
  handedness?: 'Right' | 'Left';  // optional, default 'Right'
  notes?: string;      // optional
  folderId?: string;   // optional, можно выбрать при создании
}
```

**UI**:
```
┌──────────────────────────────┐
│ Add New Player               │
├──────────────────────────────┤
│ Name: [________________]      │
│ Nickname: [________________]  │
│ Handedness: ○Right ○Left     │
│ Notes: [________________]     │
│ Folder: (None) ↓             │
│ [Create] [Cancel]            │
└──────────────────────────────┘
```

**Стоимость**: 1-2 часа  
**Зависимость**: от 1.1

---

### 3.2 Обновить MatchDetailModal

**Файл**: `src/components/MatchDetailModal.tsx`

**Информация**:
- Players (P1 vs P2)
- Score (games, final)
- Duration
- Date
- Folder (если матч был в турнире)
- Статистика (points, longest rally)
- Rally Flow (как сейчас)

**Что убрать**:
- ❌ Club информация (больше нет)
- ❌ Rating/Grade информация
- ✅ Оставить всю статистику (это ценность!)

**Стоимость**: 1 час  
**Зависимость**: от 1.1

---

### 3.3 Обновить PlayerProfileModal

**Файл**: `src/components/PlayerProfileModal.tsx`

**Показывать**:
- Основная инфо (name, nickname, notes)
- Папка (если в какой-то)
- **Статистика**:
  - Matches played
  - Wins / Losses
  - Win percentage
  - Average points per game
  - Longest rally
  - Head-to-head (vs других игроков)
  - Last 5 matches

**Что убрать**:
- ❌ Grade (не храним)
- ❌ Club membership
- ❌ Country flag
- ❌ Avatar URL
- ✅ Оставить всю статистику

**Стоимость**: 1 час  
**Зависимость**: от 1.1

---

### 3.4 Обновить MatchHistoryView

**Файл**: `src/components/MatchHistoryView.tsx`

**Текущее**:
- Фильтр по клубу (вверху)
- Таблица всех матчей

**Новое**:
- Таблица всех матчей (никакого фильтра по клубу)
- Опционально: фильтр по дате/игроку
- Клик на матч → MatchDetailModal

**Стоимость**: 1 час  
**Зависимость**: от 1.3

---

## 📊 ФАЗА 4: Settings & Documentation

### 4.1 Обновить SettingsModal с Quick Match конфигурацией

**Файл**: `src/components/SettingsModal.tsx`

**Текущие настройки**:
```typescript
export interface AppSettings {
  showMascotTips: boolean;
  soundEffects: boolean;  // ⚠️ не работает
  hapticFeedback: boolean;  // ⚠️ не работает
}
```

**Новые настройки**:
```typescript
export interface AppSettings {
  showMascotTips: boolean;
  
  // Quick Match defaults
  quickMatchFormat: 'BEST_OF_3' | 'BEST_OF_5';
  quickMatchTargetPoints: 11 | 15;
  quickMatchTwoPointGap: boolean;  // "play to 2-point gap if tied at 10-10"
  
  // На будущее:
  theme?: 'light' | 'dark' | 'system';
}
```

**Структура UI (вкладки)**:
```
┌─────────────────────────────────┐
│ Settings                        │
├─ Mascot Tips                    │
├─ Quick Match ← новое!           │
├─ About                          │
└─────────────────────────────────┘
```

**Вкладка "Mascot Tips"**:
- ☑ Show tips from Letty mascot

**Вкладка "Quick Match"** (новая):
- Match Format: ○ Best of 3 | ○ Best of 5
- Points Per Game: ○ PARS-11 | ○ PARS-15
- Two-Point Gap: ☑ Enabled
- [Save]

**Вкладка "About"**:
- Version: 1.0.0
- Made with ❤️ for squash referees

**Что убрать**:
- ❌ Sound Effects (пока убрали)
- ❌ Haptic Feedback (пока убрали)
- ❌ Cloud Sync (Phase 2)

**Примечание**: Эти настройки применяются ко **всем** Quick Match матчам, пока не изменены снова. Для турниров/соревнований формат задаётся при создании турнира.

**Стоимость**: 1-1.5 часа (нужно добавить вкладку, ввести настройки в AppSettings, связать с NewMatchModal)  
**Зависимость**: от 1.3 + 2.2 (Quick Match логика уже в Modal)

---

### 4.2 Полностью переписать HowToPlayModal

**Файл**: `src/components/HowToPlayModal.tsx`

**Текущее**:
- Подробные правила сквоша
- Скриншоты корта
- Hand-out, Service, etc.

**Новое**:
- Как начать матч за 10 секунд
- Основные правила сквоша (short version)
- Как работает судейство в приложении
- Что делать после матча

**Секции**:
1. **Quick Start** (1 экран)
   - "1. Найти или создать 2 игроков"
   - "2. Начать матч"
   - "3. Фиксировать очки"
   - "4. Сохранить результат"

2. **Basic Rules** (1-2 экрана)
   - Service, hand-out, game ball
   - PARS 11

3. **Refereeing Tips** (1-2 экрана)
   - Как вызывать let/stroke
   - Common disputes

**Стоимость**: 2 часа  
**Важно**: Не переусложнять, это не учебник, это туториал.

---

### 4.3 Удалить или переделать HowToUseAppModal

**Файл**: `src/components/HowToUseAppModal.tsx`

**Текущее**: Пояснения про интерфейс  
**Новое**: Может быть, полностью удалить и заменить встроенными подсказками (Letty mascot tips)?

**Решение**: Скрыть из меню, оставить пока что (может пригодиться).

---

## ⚙️ ФАЗА 5: Cleanup & Dead Code

### 5.1 Удалить неиспользуемые компоненты

- `src/components/RallyProgressionChart.tsx` (1190 строк, мёртвый код)
- Заброшенный `export default function App()` в `SquashCourtDiagrams.tsx`

**Стоимость**: 10 мин

---

### 5.2 Удалить неиспользуемые ассеты

- `public/assets/hero.png`
- `public/assets/letty_winner.jpg`
- `public/assets/letty_avatar.jpg`

**Стоимость**: 5 мин

---

### 5.3 Очистить mockData.ts

- ❌ Удалить `DEFAULT_SETTINGS` (мёртвый экспорт)
- ✅ Оставить `INITIAL_PLAYERS`, `INITIAL_MATCHES`, `INITIAL_COMPETITIONS` (это demo data)
- 🔄 Заменить `CLUBS_LIST` на `INITIAL_FOLDERS`

**Стоимость**: 30 мин

---

## 🔧 Utility Functions: What to Keep/Remove/Add

### Keep (Essential)
- ✅ `matchUtils.ts` — логика матчей (serve, points, games)
- ✅ `dateUtils.ts` — форматирование дат, длительности
- ✅ `fixtureUtils.ts` — генерация фикстур (League, Interclub)
- ✅ `standingsUtils.ts` — таблицы, standings (нужны для League, Interclub)

### Remove or Deprecate
- ❌ `ratingUtils.ts` — для Phase 1 просто игнорируем, Phase 2 переделаем под локальную статистику (не Club Rating)
- ❌ `gradeUtils.ts` — больше нет грейдов в Player
- ❌ `clubUtils.ts` — заменить на `folderUtils.ts`

### Add New
- ✅ `folderUtils.ts` — работа с папками
- ✅ `uuidUtils.ts` — UUID для облака
- ✅ `playerStatsUtils.ts` — локальная статистика игрока (wins, losses, head-to-head)

---

## 🧪 Testing Checklist (for each Phase)

После каждого этапа убедиться:
- [ ] localStorage загружается без ошибок
- [ ] Old data (если есть) мигрирует корректно
- [ ] UI не сломана, нет console errors
- [ ] Создание матча работает за <30 секунд
- [ ] История матчей полна
- [ ] Статистика игроков корректна

---

## 📋 Implementation Order (Recommended)

**Week 1**:
1. ✅ 1.1 — Обновить types (Club → Folder, Player simplification)
2. ✅ 1.2 — localStorage миграция
3. ✅ 1.3 — Удалить Club-related код
4. ✅ 1.4 — Добавить UUID слой

**Week 2**:
5. ✅ 2.1 — Переделать Dashboard
6. ✅ 2.2 — Ускорить NewMatchModal
7. ✅ 2.3 — FolderSelectorModal
8. ✅ 2.4 — PlayersView с папками
9. ✅ 3.1 — Упростить AddPlayerModal

**Week 3**:
10. ✅ 3.2-3.4 — Обновить модалки (Match, Player, History)
11. ✅ 2.5 — Упростить Competitions
12. ✅ 2.6 — Упростить Scoreboard (мелко)

**Week 4**:
13. ✅ 4.1-4.3 — Settings, Documentation
14. ✅ 5.1-5.3 — Cleanup
15. ✅ Testing, bug fixes, polish

---

## 🎨 Success Metrics

Когда Phase 1-2 завершены, приложение должно:

1. **Запуск матча в <10 сек** ✅ Quick Match Profile
   - Открыл > быстро набрал имена (или выбрал из истории) > [Start] 
   - Параметры уже настроены в Settings (Best of 3, PARS-11 по умолчанию)
   - Новых игроков можно создать за 1 Enter
   
2. **Нет внешних API/зависимостей**
   - Всё работает оффлайн, нет CLUBS_LIST, нет MySquash запросов
   
3. **Фундамент для облака заложен**
   - UUID у всех сущностей
   - localStorage слой абстрактен
   - Нет хардкода на структуру данных
   
4. **История и статистика полны**
   - Каждый матч сохраняется
   - Stats игрока корректны
   - Head-to-head работает
   
5. **Интерфейс чистый и быстрый**
   - Папки вместо клубов
   - Dashboard инструментален
   - NewMatchModal показывает только то, что нужно (поиск игроков + настройки ссылка)
   - Settings позволяют один раз настроить формат и забыть про выборы

---

## 🚀 Phase 2 (NOT Phase 1): Optional Enhancements

Когда MVP стабилен, можно добавить:
- Cloud Sync через iCloud / Supabase
- Apple ID авторизация
- Остальные форматы соревнований (Knockout, Elimination)
- Sound Effects и Haptic Feedback (реальная реализация)
- Export/Import matches
- QR-коды для быстрого добавления игроков
- Multi-device sync
- Истории результатов с скриншотами

---

## 🎯 Final Thought

**Цель Phase 1**: Из "экосистемы с API интеграциями" превратить приложение в "простой, быстрый инструмент судьи для локального использования, который уже подготовлен к облачной синхронизации позже".

Всё остальное (рейтинги, API, общие базы) — это облако, это будет, но **не сейчас**.

---

## 💡 Три точки входа: Quick / Custom / Competitions

**Финальная схема Dashboard**:

| Кнопка | Размер | Что делает | Формат матча |
|---|---|---|---|
| **Quick Match** | Primary (2x) | Поиск/создание 2 игроков → Start | Из `settings.quickMatch*` |
| **Custom Match** | Secondary | Поиск/создание 2 игроков + разовый выбор формата | Выбирается тут же, не сохраняется |
| **Competitions** | Secondary | Список/создание турниров (Interclub, League) | Задаётся при создании турнира |

**Почему три, а не одна с настройками внутри**:
- ✅ Quick Match — 90% случаев, никаких решений кроме "кто играет"
- ✅ Custom Match — редкий разовый случай (сегодня Single Game), не хочется лезть в Settings и потом возвращать обратно
- ✅ Competitions — принципиально другая модель данных (fixtures, standings), не может быть просто "ещё одной опцией" в форме матча
- ✅ Settings остаются местом для **постоянных** дефолтов, а не для разовых решений

**Реализация**:
1. `AppSettings` получает `quickMatchFormat`, `quickMatchTargetPoints`, `quickMatchTwoPointGap`
2. `NewMatchModal` принимает `mode: 'quick' | 'custom'`; в `quick` формат — только текст-ссылка на Settings, в `custom` — реальные radio-переключатели
3. `SettingsModal` добавляет вкладку "Quick Match" для изменения дефолтов
4. `DashboardView` рендерит 3 кнопки: Quick Match (primary), Custom Match + Competitions (secondary, в ряд)
5. `ScoreboardView` использует переданный формат матча (не важно, откуда он взялся — quick default, custom choice, или competition fixture)

---

**Last Updated**: 2026-08-07  
**Status**: Ready for implementation
