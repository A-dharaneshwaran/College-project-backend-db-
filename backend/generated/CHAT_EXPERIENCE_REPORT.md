# Chat Experience Report — Phase XXIV-C.2

## 1. Objective
Elevate the conversation interface with modern chat design systems, sticky layouts, scroll optimizations, date separators, and loading animations.

## 2. Implemented UX Features

### 2.1 Sticky Chat Header
- Renders recipient profile avatar (or fallback initials in Indigo background), display name, role badge (green for student, orange for faculty), and academic department code (e.g. "CSE", "ECE").
- Persistently sticks at the top of the chat viewport, acting as a sibling container outside the scroll view.

### 2.2 Date Grouping Separators
- Evaluates dates on list rendering. A date header node is dynamically injected whenever subsequent messages belong to different calendar days.
- Separators render as a centered capsule shape containing:
  - `"Today"` for today's date group.
  - `"Yesterday"` for yesterday's date group.
  - Full formatted date string (e.g., `Thursday, July 2, 2026`) for older days.
- Integrates seamlessly with the FlatList's `inverted={true}` view.

### 2.3 Intelligent Auto-Scroll
- Implements automated scroll offsets using a React ref pointing to the message FlatList.
- **Scroll Rules**:
  - Auto-scroll to bottom offset `0` triggers automatically upon sending a message, or when receiving new poll messages *only if* the user is already near the bottom (`offsetY < 100`).
  - If the user has scrolled up to read older messages (`offsetY >= 100`), auto-scroll is disabled to prevent disrupting the user's reading flow.
  - Instead, a floating **"↓ New Messages"** button appears at the bottom right. Clicking it smoothly scrolls the user back to the bottom.

### 2.4 Loading Skeletons
- Displays five modern animated gray/indigo placeholder message bubbles while fetching history from the server.
- Aligns skeletons to the left/right to simulate active sender/receiver bubbles.

### 2.5 Empty Chat Illustrations
- Renders a clean conversational placeholder screen if the conversation has zero history.
- Displays a `comments-o` chat icon and a friendly greeting: *"Start the Conversation. No messages here yet. Send a friendly greeting to begin!"*.
