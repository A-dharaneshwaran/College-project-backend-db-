const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const activityService = require('./activityLog.service');
const ApiError = require('../utils/ApiError');

/**
 * Get or create a direct conversation
 */
exports.createConversation = async (participants, type = 'direct', department = null, name = null, createdBy = null) => {
  if (type === 'direct' && participants.length !== 2) {
    throw new ApiError(400, 'Direct conversations must have exactly 2 participants');
  }

  // Check if a direct conversation already exists between these two users
  if (type === 'direct') {
    const existing = await Conversation.findOne({
      type: 'direct',
      participants: { $all: participants, $size: 2 }
    }).populate('participants', 'name email role profilePhoto');
    if (existing) return existing;
  }

  const conversation = await Conversation.create({
    participants,
    type,
    department,
    name,
    createdBy
  });

  // Log activity
  if (createdBy) {
    await activityService.logActivity(
      createdBy,
      'CONVERSATION_CREATED',
      'Message',
      `Created a new ${type} conversation`
    );
  }

  return Conversation.findById(conversation._id).populate('participants', 'name email role profilePhoto');
};

/**
 * Get paginated conversations for a user
 */
/**
 * Get paginated conversations for a user
 */
exports.getConversations = async (userId, cursor, limit = 20, archived = false) => {
  const isArchivedRequested = archived === true || archived === 'true';

  const matchStage = {
    participants: new mongoose.Types.ObjectId(userId),
    isDeleted: false
  };

  if (isArchivedRequested) {
    matchStage.archivedBy = new mongoose.Types.ObjectId(userId);
  } else {
    matchStage.archivedBy = { $ne: new mongoose.Types.ObjectId(userId) };
  }

  if (cursor) {
    matchStage.lastMessageAt = { $lt: new Date(cursor) };
  }

  const conversations = await Conversation.aggregate([
    { $match: matchStage },
    {
      $addFields: {
        isPinned: {
          $cond: {
            if: { $in: [new mongoose.Types.ObjectId(userId), { $ifNull: ["$pinnedBy", []] }] },
            then: 1,
            else: 0
          }
        },
        hasUnread: {
          $cond: {
            if: { $gt: [{ $ifNull: [{ $getField: { field: userId.toString(), input: "$unreadCounts" } }, 0] }, 0] },
            then: 1,
            else: 0
          }
        }
      }
    },
    { $sort: { isPinned: -1, hasUnread: -1, lastMessageAt: -1 } },
    { $limit: limit + 1 }, // Fetch +1 to determine nextCursor
    {
      $lookup: {
        from: 'messages',
        localField: 'lastMessage',
        foreignField: '_id',
        as: 'lastMessageDoc'
      }
    },
    { $unwind: { path: '$lastMessageDoc', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'users',
        localField: 'participants',
        foreignField: '_id',
        as: 'participantsDocs'
      }
    },
    {
      $project: {
        _id: 1,
        type: 1,
        name: 1,
        department: 1,
        lastMessageAt: 1,
        unreadCount: { $ifNull: [{ $getField: { field: userId.toString(), input: "$unreadCounts" } }, 0] },
        lastMessage: "$lastMessageDoc",
        isPinned: 1,
        isArchived: {
          $cond: {
            if: { $in: [new mongoose.Types.ObjectId(userId), { $ifNull: ["$archivedBy", []] }] },
            then: true,
            else: false
          }
        },
        participants: {
          $map: {
            input: "$participantsDocs",
            as: "p",
            in: { _id: "$$p._id", name: "$$p.name", email: "$$p.email", role: "$$p.role", profilePhoto: "$$p.profilePhoto" }
          }
        }
      }
    }
  ]);

  const hasNextPage = conversations.length > limit;
  const results = hasNextPage ? conversations.slice(0, -1) : conversations;
  const nextCursor = hasNextPage ? results[results.length - 1].lastMessageAt : null;

  // Secondary enrichment for student/faculty roles and departments
  const Student = require('../models/Student');
  const Faculty = require('../models/Faculty');

  require('../models/Department');
  const allParticipantIds = [];

  results.forEach(conv => {
    conv.participants.forEach(p => {
      if (p._id.toString() !== userId.toString()) {
        allParticipantIds.push(p._id);
      }
    });
  });

  const students = await Student.find({ user: { $in: allParticipantIds } }).populate('department', 'name code').lean();
  const faculties = await Faculty.find({ user: { $in: allParticipantIds } }).populate('department', 'name code').lean();

  const detailsMap = {};
  students.forEach(s => {
    detailsMap[s.user.toString()] = {
      department: s.department?.code || s.department?.name || '',
      roleBadge: 'student'
    };
  });
  faculties.forEach(f => {
    detailsMap[f.user.toString()] = {
      department: f.department?.code || f.department?.name || '',
      roleBadge: 'faculty'
    };
  });

  results.forEach(conv => {
    // Map participants with details
    conv.participants = conv.participants.map(p => {
      const details = detailsMap[p._id.toString()] || {};
      const initials = p.name ? p.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
      return {
        ...p,
        department: details.department || '',
        initials
      };
    });

    // Populate top-level fields for convenience
    conv.isPinned = conv.isPinned === 1;
    if (conv.type === 'direct') {
      const other = conv.participants.find(p => p._id.toString() !== userId.toString());
      if (other) {
        conv.avatar = other.profilePhoto || '';
        conv.displayName = other.name;
        conv.displayRole = other.role;
        conv.displayDepartment = other.department;
        conv.initials = other.initials;
      } else {
        conv.avatar = '';
        conv.displayName = 'Unknown User';
        conv.displayRole = '';
        conv.displayDepartment = '';
        conv.initials = 'U';
      }
    } else {
      conv.avatar = '';
      conv.displayName = conv.name || 'Group Chat';
      conv.displayRole = conv.type === 'department_broadcast' ? 'department' : 'institution';
      conv.displayDepartment = '';
      conv.initials = conv.displayName.substring(0, 2).toUpperCase();
    }
  });

  return { conversations: results, nextCursor };
};

/**
 * Toggle pin conversation for user
 */
exports.togglePinConversation = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new ApiError(404, 'Conversation not found');
  }
  
  if (!conversation.pinnedBy) {
    conversation.pinnedBy = [];
  }
  
  const index = conversation.pinnedBy.indexOf(userId);
  if (index > -1) {
    conversation.pinnedBy.splice(index, 1);
  } else {
    conversation.pinnedBy.push(userId);
  }
  
  await conversation.save();
  return conversation;
};

/**
 * Toggle archive conversation for user
 */
exports.toggleArchiveConversation = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new ApiError(404, 'Conversation not found');
  }
  
  if (!conversation.archivedBy) {
    conversation.archivedBy = [];
  }
  
  const index = conversation.archivedBy.indexOf(userId);
  if (index > -1) {
    conversation.archivedBy.splice(index, 1);
  } else {
    conversation.archivedBy.push(userId);
  }
  
  await conversation.save();
  return conversation;
};


/**
 * Send a message
 */
exports.sendMessage = async (conversationId, senderId, content, type = 'text', attachments = [], replyTo = null, forwardedFrom = null) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: senderId,
    isDeleted: false
  });

  if (!conversation) {
    throw new ApiError(404, 'Conversation not found or unauthorized');
  }

  if (type === 'text' && (!content || content.trim() === '') && attachments.length === 0) {
    throw new ApiError(400, 'Message content or attachments are required');
  }

  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    content,
    type,
    attachments,
    replyTo,
    forwardedFrom,
    readBy: [senderId],
    deliveredTo: [senderId]
  });

  // Update conversation lastMessage and unreadCounts
  const updateQuery = {
    $set: { 
      lastMessage: message._id, 
      lastMessageAt: message.createdAt 
    }
  };

  // Increment unread counts for all other participants
  conversation.participants.forEach(pId => {
    if (pId.toString() !== senderId.toString()) {
      const key = `unreadCounts.${pId.toString()}`;
      updateQuery.$inc = updateQuery.$inc || {};
      updateQuery.$inc[key] = 1;
    }
  });

  await Conversation.findByIdAndUpdate(conversationId, updateQuery);

  // Trigger notifications
  const otherParticipants = conversation.participants.filter(p => p.toString() !== senderId.toString());
  
  // Try sending notifications without blocking message completion
  try {
    const notifications = otherParticipants.map(recipientId => ({
      user: recipientId,
      title: conversation.type === 'direct' ? 'New Message' : `New message in ${conversation.name || 'group'}`,
      message: type === 'text' ? (content.substring(0, 50) + (content.length > 50 ? '...' : '')) : `Sent an attachment`,
      type: 'message',
      priority: 'low',
      sender: senderId,
      link: `/messages/${conversationId}`
    }));
    
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (err) {
    console.error('Failed to dispatch message notifications:', err);
  }

  // Log Activity for Broadcasts
  if (conversation.type === 'department_broadcast' || conversation.type === 'institution_broadcast') {
    await activityService.logActivity(senderId, 'BROADCAST_SENT', 'Message', `Sent a broadcast to ${conversation.type}`);
  } else {
    await activityService.logActivity(senderId, 'MESSAGE_SENT', 'Message', `Sent a message`);
  }

  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'name')
    .populate({
      path: 'replyTo',
      populate: { path: 'sender', select: 'name' }
    })
    .populate({
      path: 'forwardedFrom',
      populate: { path: 'sender', select: 'name' }
    })
    .lean();

  if (populatedMessage.replyTo) {
    populatedMessage.replyToDetails = {
      senderName: populatedMessage.replyTo.sender?.name || 'Unknown',
      preview: populatedMessage.replyTo.isDeleted ? "This message was deleted" : populatedMessage.replyTo.content,
      timestamp: populatedMessage.replyTo.createdAt
    };
  }
  if (populatedMessage.forwardedFrom) {
    populatedMessage.forwardedFromDetails = {
      senderName: populatedMessage.forwardedFrom.sender?.name || 'Unknown',
      preview: populatedMessage.forwardedFrom.isDeleted ? "This message was deleted" : populatedMessage.forwardedFrom.content,
      timestamp: populatedMessage.forwardedFrom.createdAt
    };
  }

  return populatedMessage;
};

/**
 * Get message history for a conversation
 */
exports.getMessageHistory = async (conversationId, userId, cursor, limit = 50) => {
  // Ensure user is participant
  const conversation = await Conversation.findOne({ _id: conversationId, participants: userId });
  if (!conversation) {
    throw new ApiError(403, 'Unauthorized access to conversation');
  }

  const matchStage = {
    conversation: new mongoose.Types.ObjectId(conversationId)
  };

  if (cursor) {
    matchStage.createdAt = { $lt: new Date(cursor) };
  }

  const messages = await Message.aggregate([
    { $match: matchStage },
    { $sort: { createdAt: -1 } },
    { $limit: limit + 1 },
    {
      $lookup: {
        from: 'users',
        localField: 'sender',
        foreignField: '_id',
        as: 'senderDoc'
      }
    },
    { $unwind: "$senderDoc" },
    
    // replyTo lookup
    {
      $lookup: {
        from: 'messages',
        localField: 'replyTo',
        foreignField: '_id',
        as: 'replyToDoc'
      }
    },
    { $unwind: { path: '$replyToDoc', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'users',
        localField: 'replyToDoc.sender',
        foreignField: '_id',
        as: 'replyToSenderDoc'
      }
    },
    { $unwind: { path: '$replyToSenderDoc', preserveNullAndEmptyArrays: true } },

    // forwardedFrom lookup
    {
      $lookup: {
        from: 'messages',
        localField: 'forwardedFrom',
        foreignField: '_id',
        as: 'forwardedFromDoc'
      }
    },
    { $unwind: { path: '$forwardedFromDoc', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'users',
        localField: 'forwardedFromDoc.sender',
        foreignField: '_id',
        as: 'forwardedFromSenderDoc'
      }
    },
    { $unwind: { path: '$forwardedFromSenderDoc', preserveNullAndEmptyArrays: true } },

    {
      $project: {
        _id: 1,
        content: {
          $cond: {
            if: { $eq: ["$isDeleted", true] },
            then: "This message was deleted",
            else: "$content"
          }
        },
        type: 1,
        attachments: 1,
        replyTo: 1,
        forwardedFrom: 1,
        isEdited: 1,
        isDeleted: { $ifNull: ["$isDeleted", false] },
        createdAt: 1,
        editedAt: 1,
        deletedAt: 1,
        sender: {
          _id: "$senderDoc._id",
          name: "$senderDoc.name"
        },
        replyToDetails: {
          $cond: {
            if: { $gt: [{ $type: "$replyToDoc" }, "missing"] },
            then: {
              senderName: "$replyToSenderDoc.name",
              preview: {
                $cond: {
                  if: { $eq: ["$replyToDoc.isDeleted", true] },
                  then: "This message was deleted",
                  else: "$replyToDoc.content"
                }
              },
              timestamp: "$replyToDoc.createdAt"
            },
            else: null
          }
        },
        forwardedFromDetails: {
          $cond: {
            if: { $gt: [{ $type: "$forwardedFromDoc" }, "missing"] },
            then: {
              senderName: "$forwardedFromSenderDoc.name",
              preview: {
                $cond: {
                  if: { $eq: ["$forwardedFromDoc.isDeleted", true] },
                  then: "This message was deleted",
                  else: "$forwardedFromDoc.content"
                }
              },
              timestamp: "$forwardedFromDoc.createdAt"
            },
            else: null
          }
        }
      }
    }
  ]);

  const hasNextPage = messages.length > limit;
  const results = hasNextPage ? messages.slice(0, -1) : messages;
  const nextCursor = hasNextPage ? results[results.length - 1].createdAt : null;

  return { messages: results, nextCursor };
};

/**
 * Mark conversation as read
 */
exports.markConversationRead = async (conversationId, userId) => {
  // Clear unread count on conversation
  const updateKey = `unreadCounts.${userId.toString()}`;
  await Conversation.updateOne(
    { _id: conversationId },
    { $set: { [updateKey]: 0 } }
  );

  // Clear related notifications safely
  try {
    await Notification.updateMany(
      { user: userId, type: 'message', link: `/messages/${conversationId}`, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
  } catch (err) {
    console.error('Failed to mark message notifications as read:', err);
  }

  return { success: true };
};

exports.editMessage = async (messageId, userId, newContent) => {
  const message = await Message.findOne({ _id: messageId, sender: userId, isDeleted: false });
  if (!message) {
    throw new ApiError(404, 'Message not found or unauthorized');
  }

  // Enforce 15-minute edit window
  const timeDifference = Date.now() - new Date(message.createdAt).getTime();
  if (timeDifference > 15 * 60 * 1000) {
    throw new ApiError(400, 'Message cannot be edited after 15 minutes');
  }

  message.content = newContent;
  message.isEdited = true;
  message.editedAt = Date.now();
  await message.save();

  // Populate sender to keep responses fully populated and backward compatible
  const populated = await Message.findById(message._id).populate('sender', 'name');
  return populated;
};

/**
 * Soft delete a message
 */
exports.deleteMessage = async (messageId, userId) => {
  const message = await Message.findOne({ _id: messageId, sender: userId });
  if (!message) {
    throw new ApiError(404, 'Message not found or unauthorized');
  }

  message.isDeleted = true;
  message.deletedAt = Date.now();
  await message.save();

  await activityService.logActivity(userId, 'MESSAGE_DELETED', 'Message', `Deleted a message`);
  return { success: true };
};

/**
 * Search messages
 */
exports.searchMessages = async (userId, query) => {
  if (!query) return [];

  // Find conversations user is part of
  const userConversations = await Conversation.find({ participants: userId, isDeleted: false }).distinct('_id');

  const messages = await Message.aggregate([
    {
      $match: {
        conversation: { $in: userConversations },
        isDeleted: false,
        $or: [
          { content: { $regex: query, $options: 'i' } },
          { attachments: { $regex: query, $options: 'i' } }
        ]
      }
    },
    { $sort: { createdAt: -1 } },
    { $limit: 20 },
    {
      $lookup: {
        from: 'users',
        localField: 'sender',
        foreignField: '_id',
        as: 'senderDoc'
      }
    },
    { $unwind: "$senderDoc" },
    {
      $project: {
        content: 1,
        createdAt: 1,
        conversation: 1,
        sender: {
          _id: "$senderDoc._id",
          name: "$senderDoc.name"
        }
      }
    }
  ]);

  return messages;
};
