# PRD.md — Project Requirements Document

## 1. Product Overview

### 1.1 Product Name

**Working title:** Bollywood Game  
**Optional product name direction:** A broader, brandable name may be chosen later if the game expands beyond Bollywood into other entertainment categories.

### 1.2 One-Line Summary

A mobile-first word-guessing game inspired by the classic notebook-and-pen **Bollywood** game, where players guess a movie title, actor, actress, and song using limited clues while wrong guesses reduce the remaining letters in **BOLLYWOOD**.

### 1.3 Product Vision

Create a modern, premium, highly replayable mobile game that preserves the nostalgia of the original classroom/hostel Bollywood game while adding polished UX, structured hint systems, multiplayer support, progression, daily challenges, and scalable content generation.

### 1.4 Product Philosophy

The product should feel like a mix of:

- a nostalgic social game,
- a premium entertainment app,
- and a lightweight competitive puzzle game.

The experience should be simple to learn, fast to play, visually attractive, and flexible enough to support future categories beyond Bollywood.

---

## 2. Problem Statement

The original notebook version of the game is fun but has several limitations:

- It depends on manual setup and human memory.
- It is difficult to scale beyond a small group.
- It lacks persistent progress, rewards, and replay value.
- Puzzle quality can vary widely.
- There is no structured onboarding, tutorial, or fairness system.
- It cannot support modern mobile gameplay patterns such as daily challenges, streaks, ranked play, or asynchronous multiplayer.

This project solves those limitations by turning the game into a structured mobile app with consistent rules, modern UI, and a scalable puzzle engine.

---

## 3. Goals and Objectives

### 3.1 Primary Goals

1. Recreate the classic Bollywood pen-and-paper game in digital form.
2. Make the experience mobile-first and intuitive.
3. Build a robust hint-based guessing flow.
4. Support one-player and multiplayer gameplay.
5. Add progression, rewards, and replay loops.
6. Provide a content system that can grow over time.

### 3.2 Secondary Goals

1. Make the game feel premium rather than like a basic quiz app.
2. Enable future expansion into other entertainment categories.
3. Support AI-assisted or rule-based puzzle generation.
4. Create an implementation foundation that can be expanded in phases.

### 3.3 Success Definition

The product is successful if users:

- understand the game quickly,
- return regularly to play new puzzles,
- complete puzzles with meaningful challenge,
- enjoy sharing or competing with friends,
- and keep engaging with the app over time.

---

## 4. Target Users

### 4.1 Primary Audience

- Students who played the notebook version in school or college.
- Casual mobile gamers who like word games and trivia.
- Movie lovers who enjoy guessing actors, songs, and film names.
- Friend groups looking for a lightweight social game.

### 4.2 Secondary Audience

- Family users who want a simple entertainment game.
- Nostalgia-driven users who remember the original pen-and-paper format.
- Content creators or community groups looking for party-style games.

### 4.3 User Personas

#### Persona A: Nostalgic Player

- Grew up playing Bollywood in notebooks.
- Wants familiar mechanics.
- Prefers simple UI and quick rounds.

#### Persona B: Competitive Player

- Likes leaderboards, streaks, and challenge modes.
- Wants measurable progress and replayability.

#### Persona C: Social Player

- Plays with friends in a room or party setting.
- Wants multiplayer and turn-based interaction.

#### Persona D: Movie Buff

- Knows actors, actresses, songs, and movie trivia.
- Wants harder puzzles and deeper content.

---

## 5. Product Scope

### 5.1 In Scope

- Single-player puzzle gameplay.
- Classic Bollywood-style puzzle format.
- Hint system with penalties.
- Wrong-guess penalty based on letters in **BOLLYWOOD**.
- Daily challenge mode.
- Endless mode.
- Local or online multiplayer mode.
- Progression, XP, streaks, badges, and rewards.
- Categorized puzzle packs.
- Basic onboarding/tutorial.
- User profile and game statistics.
- Puzzle validation and answer checking.

### 5.2 Out of Scope for Initial Release

- Real-money gambling mechanics.
- Social media account dependency.
- Complex live voice chat.
- User-generated content moderation at scale.
- Full AI chat assistant inside gameplay.
- Large open-world game systems.
- Video streaming or licensed clip playback.

### 5.3 Future Scope

- Expansion beyond Bollywood into Hollywood, anime, TV shows, sports, and other categories.
- Seasonal events.
- Tournament mode.
- Advanced matchmaking.
- AI-generated clue chains.
- Community-created puzzle packs.

---

## 6. Core Game Concept

The core gameplay is based on four answer slots:

1. Movie Title
2. Actor
3. Actress
4. Song

A setter provides initial letters or partial clues for each slot. The guesser attempts to identify all four correctly.

### 6.1 Penalty System

Every wrong guess or purchased hint removes one letter from the word **BOLLYWOOD**.

Example life track:

- B
- O
- L
- L
- Y
- W
- O
- O
- D

If all letters are removed, the round ends in failure.

### 6.2 Win Condition

The user wins the round when all four slots are correctly guessed before all lives are exhausted.

---

## 7. Game Modes

### 7.1 Classic Mode

The closest digital version of the notebook game.

- A single puzzle contains the four slots.
- Initial clue letters are shown.
- Wrong guesses reduce lives.
- Hints may be requested at a cost.

### 7.2 Daily Challenge

A fixed puzzle released once per day.

- Same puzzle for all players.
- Encourages streaks and repeat visits.
- Can support leaderboards.

### 7.3 Endless Mode

Continuously generated puzzles.

- Used for casual practice.
- No daily limitation.
- Good for high replay value.

### 7.4 Multiplayer Mode

One player creates a room, others join, and the group solves or sets puzzles depending on the selected sub-mode.

- Turn-based setup can be supported.
- Party mode should be easy to join.

### 7.5 Survival Mode

Players keep going through puzzles until they lose all lives or fail a set number of rounds.

- Suitable for score chasing.
- Supports tension and replayability.

### 7.6 Blitz Mode

A time-based mode where the player solves as many puzzles as possible in a short timer.

- Encourages speed and pattern recognition.

### 7.7 Practice Mode

A low-pressure mode where the player can explore categories and learn the mechanics.

- May include unlimited retries.
- Useful for onboarding.

---

## 8. Functional Requirements

### 8.1 Onboarding and Entry

- The app must teach the rules quickly.
- First-time users must see a short interactive tutorial.
- The game should explain what the four slots mean.
- The app should explain how BOLLYWOOD lives work.

### 8.2 Puzzle Start Flow

- User selects a mode.
- System loads a puzzle.
- Initial clues are displayed.
- Lives, score, and hint controls become visible.

### 8.3 Guessing Flow

- User enters guesses for each slot.
- Correct answers lock the slot.
- Wrong answers reduce lives.
- Duplicate wrong guesses should not break the system.
- Input should support text entry, paste, and optional voice input later.

### 8.4 Hint System

- Hints must cost lives or a similar currency.
- Hints should progressively reveal more specific information.
- Hint types may include release year, director, genre, plot clue, singer, extra letter, or answer length.
- Hints should be designed so they help without fully trivializing the puzzle.

### 8.5 Scoring and Progression

- Users earn points for solving puzzles.
- Bonus points may be awarded for solving without hints.
- Bonus points may be awarded for fewer wrong guesses.
- XP, levels, and badges should reward continued play.

### 8.6 Profile and Stats

The app should track:

- total puzzles solved,
- win rate,
- hint usage,
- streaks,
- favorite categories,
- best modes,
- and recent performance.

### 8.7 Puzzle Validation

- Answers must be checked in a normalized way.
- Matching should ignore case differences.
- Matching should handle punctuation and spacing variations.
- The system should support aliases where necessary.

### 8.8 Content Pack System

- Puzzles should be grouped by category or theme.
- Users should be able to select packs.
- Packs can be unlocked progressively.

### 8.9 Multiplayer Requirements

- The host should be able to create a room.
- Other users should be able to join with a room code.
- Game state should sync correctly between players.
- The host should be able to start, reset, or end the session.

### 8.10 Accessibility Requirements

- Text must be readable on small screens.
- Color contrast must be strong enough for legibility.
- Controls should be large enough for touch input.
- Feedback should not depend only on color.

---

## 9. Non-Functional Requirements

### 9.1 Performance

- Screens should load quickly.
- Puzzle transitions should feel immediate.
- Hint and validation responses should be near-instant.
- The app should remain usable on mid-range devices.

### 9.2 Reliability

- Puzzle state must not be lost during common navigation.
- Multiplayer sessions should recover gracefully from dropped connections.
- The app should avoid crashes caused by invalid or incomplete content.

### 9.3 Scalability

- The architecture should allow more categories, more puzzles, and more modes later.
- The content system should be easy to extend without rewriting core gameplay.

### 9.4 Maintainability

- Game logic should be modular.
- UI components should be reusable.
- Answer validation and hint generation should be separated from presentation.

### 9.5 Security

- User data should be protected.
- Multiplayer room codes should not expose sensitive information.
- Any admin or content-management features should be restricted.

---

## 10. Key User Flows

### 10.1 First-Time User Flow

1. Open app.
2. See intro screen.
3. Read or tap through simple tutorial.
4. Choose Classic or Practice mode.
5. Start first puzzle.

### 10.2 Standard Gameplay Flow

1. Select mode.
2. Review clue letters.
3. Enter guesses for four slots.
4. Use hints if needed.
5. Either solve the puzzle or run out of lives.
6. Receive score and summary.

### 10.3 Daily Challenge Flow

1. Open app.
2. See today’s puzzle.
3. Attempt solve.
4. Submit score.
5. View streak and leaderboard position.

### 10.4 Multiplayer Flow

1. One player creates a room.
2. Others join with code.
3. Game begins.
4. Each player participates based on room rules.
5. Final result is displayed.

---

## 11. Content Requirements

### 11.1 Puzzle Data Fields

Each puzzle should ideally include:

- Puzzle ID
- Category / language / pack
- Movie title
- Actor
- Actress
- Song
- Initial clue letters
- Difficulty rating
- Hint chain
- Validation aliases
- Release year
- Metadata for analytics

### 11.2 Content Quality Rules

- Answers must be verified.
- Songs must belong to the selected movie.
- Actor and actress choices must be relevant to the movie.
- Clues should feel fair and solvable.
- Difficulty should vary across modes and packs.

### 11.3 Content Variety

The first release should avoid repetitive puzzles and should mix:

- popular mainstream films,
- iconic songs,
- different decades,
- different difficulty levels,
- and a mix of easy and hard titles.

---

## 12. AI Requirements

If AI is used in the project, it should support—not replace—core game logic.

### 12.1 Suitable AI Uses

- Puzzle generation assistance.
- Hint sequence generation.
- Difficulty estimation.
- Metadata normalization.
- Duplicate avoidance.
- Category expansion planning.

### 12.2 AI Constraints

- AI must not invent invalid answers.
- AI must not create puzzles without validation.
- AI-generated content should be checked against trusted data sources or rules.
- AI should not directly control critical game state without safeguards.

---

## 13. User Stories

### 13.1 Casual Player

- As a player, I want to solve a puzzle quickly so I can enjoy a short game session.
- As a player, I want clear clues so I know what I am solving.

### 13.2 Nostalgia Player

- As a player, I want the game to feel like the original notebook version.
- As a player, I want the BOLLYWOOD penalty system to remain central.

### 13.3 Competitive Player

- As a player, I want streaks, XP, and leaderboards so I have a reason to return.
- As a player, I want harder modes that test my knowledge.

### 13.4 Social Player

- As a player, I want to create a room so friends can join.
- As a player, I want the game to work smoothly in a group.

---

## 14. Edge Cases and Special Cases

- The user enters a partial answer.
- The user enters the same wrong answer repeatedly.
- A movie has multiple known song titles.
- An actor has multiple spellings or aliases.
- A song title contains punctuation or special characters.
- A puzzle has too few hints or too many hints.
- A user disconnects during multiplayer.
- A puzzle is too hard and needs fallback support.

The product must handle these cases gracefully instead of failing abruptly.

---

## 15. Metrics and Success Indicators

### 15.1 Engagement Metrics

- Daily active users
- Return rate
- Session length
- Puzzles completed per session
- Hint usage frequency

### 15.2 Retention Metrics

- Day 1 / Day 7 / Day 30 retention
- Streak continuation rate
- Repeat participation in daily challenge

### 15.3 Game Quality Metrics

- Puzzle solve rate
- Rage-quit rate after failed rounds
- Hint overuse rate
- Multiplayer session completion rate

---

## 16. Release Criteria

The initial release should include:

- core gameplay,
- one polished mode,
- hint system,
- lives system,
- scoring,
- basic profile/stats,
- and a clean visual design.

A later release can add:

- multiplayer,
- daily challenge,
- progression systems,
- and broader category support.

---

## 17. Product Principles

1. Preserve nostalgia.
2. Keep rules simple.
3. Make progress visible.
4. Keep content trustworthy.
5. Design for mobile first.
6. Support future expansion.
7. Avoid clutter.
8. Make every hint feel valuable.
9. Keep the game fair.
10. Make the app feel premium.

---

## 18. Summary

This project is a modern digital version of the classic Bollywood notebook game, designed as a scalable mobile entertainment product. The app should preserve the original game’s emotional appeal while adding structure, progression, multiplayer, and a premium visual identity. The PRD defines the product as a fun, nostalgic, competitive, and expandable word-guessing experience centered around movie titles, actors, actresses, and songs.
