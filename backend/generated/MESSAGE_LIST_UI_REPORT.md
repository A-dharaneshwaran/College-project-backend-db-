# Message List UI Report — Phase XXIV-C.1

## 1. Objective
Enhance the messaging frontend experience with detailed, responsive, and aesthetic conversation cards, live search filtering, and cross-platform action sheets for pin and archive controls.

## 2. Conversation Card Layout & Elements
We modified [ConversationList.jsx](file:///d:/projects/College_project_frontend/components/chat/ConversationList.jsx) to display:
- **User Avatar / Initials Fallback**: Displays the user's profile photo if uploaded, otherwise falls back to a clean Indigo circle containing user initials (e.g. "JD" for John Doe).
- **Online/Offline Placeholder Status**: Displays a live indicator dot on the corner of the avatar (green for simulated active, gray for offline).
- **User Name & Role Badge**: Shows the sender's display name alongside a styled badge with a curated color scheme matching the user's role:
  - **student**: Light green background (`#e8f5e9`) with deep forest green text (`#2e7d32`).
  - **faculty**: Light orange background (`#fff3e0`) with deep orange text (`#ef6c00`).
- **Department**: Displays the participant's academic department (e.g. CSE, ECE) directly beneath the name.
- **Last Message Preview**: Shows a single-line preview of the last message sent in the chat.
- **Formatted Timestamp**: Uses a smart helper to display date/time relative to today:
  - Sent today: Formatted time (e.g., `10:45 AM`)
  - Sent yesterday: `"Yesterday"`
  - Older messages: Short date format (e.g., `Oct 12` or `Jul 2`)
- **Unread Badge**: Shows a vibrant red circular badge containing the count of unread messages.
- **Pin Icon**: Shows a thumb-tack icon if the conversation has been pinned by the user.

## 3. Responsive Styling and Interactive States
- **Hover/Pressed Feedbacks**: Pressing any conversation card triggers a subtle opacity shift (`activeOpacity={0.7}`) and displays active background highlights.
- **Pinned Highlight**: Pinned chats are rendered with a very subtle background tint (`#f5f6fc`) to clearly set them apart from the rest of the list.

## 4. Debounced Conversation Search
- A text search bar is mounted directly above the conversation list in the student, faculty, and admin messages views.
- **Debounce Mechanism**: The search input triggers updates debounced by `300ms` via a React hook timer to prevent UI lag.
- **Filtering Logic**: Users can search existing conversations by typing keywords matching:
  - Participant display name
  - Participant email
  - Participant department code/name
  - Last message content
- Searching does not initiate new chats, keeping the focus strictly on finding existing active conversations.

## 5. Action Modal Menu
- Clicking the three-dot button on a card or long-pressing the conversation item triggers a cross-platform options overlay.
- Features:
  - **Pin / Unpin**: Pinned chats stay stuck at the top of the conversation list.
  - **Archive / Restore**: Archived chats are moved out of the active list into the archived repository, from where they can be restored back to active view.
