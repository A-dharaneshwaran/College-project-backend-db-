# Message Actions Report — Phase XXIV-C.2

## 1. Objective
Enable users to interact with individual messages by replying, copying, editing, soft-deleting, and forwarding them while ensuring sender controls, action window enforcement, and zero database mutations of original content.

## 2. Implemented Backend Message Actions

### 2.1 Reply to Message
- **Service Integration**: The `sendMessage` function takes `replyTo` (message ID).
- **Populate & Preview**: When returning the new message, it populates `replyTo` details. In `getMessageHistory`, the aggregator performs a lookup on the parent message and its sender, returning a lightweight `replyToDetails` block:
  - `senderName`: Display name of the parent message sender.
  - `preview`: Message body (or `"This message was deleted"` if the parent message has been soft deleted).
  - `timestamp`: Date/time when the parent message was sent.

### 2.2 Edit Message
- **Sender Restrictions**: Only the original sender of the message is authorized to edit the message.
- **15-Minute Window**: Enforced by calculating `Date.now() - message.createdAt`. If it exceeds 900,000 milliseconds (15 minutes), a `400 Bad Request` validation error is thrown with the text: `"Message cannot be edited after 15 minutes"`.
- **Fields Set**: Updates `content`, sets `isEdited: true`, and logs `editedAt: Date.now()`.

### 2.3 Delete Message (Soft-Delete)
- **Sender Restrictions**: Only the sender of the message can delete it.
- **Database Safety**: We do **NOT** delete the document, nor do we overwrite the original `content` in the database. Instead, the document sets `isDeleted: true` and `deletedAt: Date.now()`.
- **Safe API Masking**: In `getMessageHistory` aggregation projection, if `isDeleted` is true, the `content` is mapped to `"This message was deleted"` over the wire. This guarantees that original content is never leaked after deletion, while maintaining conversation history.

### 2.4 Forward Message
- **Service Integration**: The `sendMessage` function takes `forwardedFrom` (source message ID).
- **Metadata**: Returns `forwardedFromDetails` containing original sender, content preview, and timestamp.

---

## 3. Implemented Frontend Actions (MessageBubble & ChatInput)

### 3.1 Actions Menu Modal
- **Triggers**: Users can open the actions modal sheet by performing a long press (mobile/native platforms) or clicking the hover menu dropdown trigger (web).
- **Options**:
  - **Reply**: Sets `replyingTo` state. Renders a reply preview bar above the keyboard input block.
  - **Copy**: Copies message contents using the platform Clipboard.
  - **Edit**: Populates the input box with the old message and sets the `editingMessage` state. Only visible if the message was sent by the user and is less than 15 minutes old.
  - **Delete**: Shows a native confirmation dialogue and triggers the soft-delete API.
  - **Forward**: Opens an overlay picker listing all active chats. Selecting a chat forwards the content.

### 3.2 Display Indicators
- **(edited)**: Renders next to the timestamp if a message has been edited.
- **Forwarded**: Renders above the message body with a share icon if the message was forwarded.
- **Deleted Placeholder**: Renders the text *"This message was deleted"* in a muted italicized style.
