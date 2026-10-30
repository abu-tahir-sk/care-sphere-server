import { Response } from 'express';
import mongoose from 'mongoose';
import { Event } from '../models/Event';
import { EventJoin } from '../models/EventJoin';
import { AuthRequest } from '../middlewares/authMiddleware';

// GET /api/events/upcoming
// Supports query params: limit (number), search (string), eventType (string)
export const getUpcomingEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { limit, search, eventType } = req.query;
    const now = new Date();

    // Only events whose dates have NOT passed (eventDate >= now)
    const query: any = {
      eventDate: { $gte: now },
    };

    if (eventType && typeof eventType === 'string' && eventType !== 'All') {
      query.eventType = eventType;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { location: searchRegex },
        { description: searchRegex },
        { eventType: searchRegex },
      ];
    }

    let eventsQuery = Event.find(query).sort({ eventDate: 1 });

    if (limit) {
      const parsedLimit = parseInt(limit as string, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        eventsQuery = eventsQuery.limit(parsedLimit);
      }
    }

    const events = await eventsQuery.exec();

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error: any) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve upcoming events.',
      error: error.message,
    });
  }
};

// GET /api/events/:id
export const getEventById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid event identifier provided.',
      });
      return;
    }

    const event = await Event.findById(id);

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found or has been removed.',
      });
      return;
    }

    let isJoined = false;
    if (req.user?.email) {
      const joinRecord = await EventJoin.findOne({
        eventId: event._id,
        userEmail: req.user.email.toLowerCase(),
      });
      isJoined = !!joinRecord;
    }

    res.status(200).json({
      success: true,
      data: event,
      isJoined,
    });
  } catch (error: any) {
    console.error('Error fetching event details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve event details.',
      error: error.message,
    });
  }
};

// POST /api/events (Protected)
export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required to create an event.' });
      return;
    }

    const { title, description, eventType, thumbnail, location, eventDate } = req.body;

    // Validation
    if (!title || !description || !eventType || !thumbnail || !location || !eventDate) {
      res.status(400).json({
        success: false,
        message: 'All fields are required (title, description, eventType, thumbnail, location, eventDate).',
      });
      return;
    }

    const parsedDate = new Date(eventDate);
    if (isNaN(parsedDate.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid ISO date for the event.',
      });
      return;
    }

    // Rule: Ensure that no past date can be added. The date must be in the future.
    const now = new Date();
    if (parsedDate <= now) {
      res.status(400).json({
        success: false,
        message: 'Event date must be scheduled in the future. Past dates cannot be added.',
      });
      return;
    }

    const newEvent = await Event.create({
      title: title.trim(),
      description: description.trim(),
      eventType: eventType.trim(),
      thumbnail: thumbnail.trim(),
      location: location.trim(),
      eventDate: parsedDate,
      organizerEmail: req.user.email.toLowerCase().trim(),
      organizerName: req.user.name.trim(),
      organizerPhoto: req.user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      participantsCount: 0,
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully! Inspiring positive change in the community.',
      data: newEvent,
    });
  } catch (error: any) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event. Please verify your inputs.',
      error: error.message,
    });
  }
};

// PUT /api/events/:id (Protected - Only Creator)
export const updateEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid event identifier.' });
      return;
    }

    const event = await Event.findById(id);

    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    // Authorization rule: Users can only update their own created event data
    if (event.organizerEmail.toLowerCase() !== req.user.email.toLowerCase()) {
      res.status(403).json({
        success: false,
        message: 'Permission denied. You can only update events created by you.',
      });
      return;
    }

    const { title, description, eventType, thumbnail, location, eventDate } = req.body;

    if (eventDate) {
      const parsedDate = new Date(eventDate);
      if (isNaN(parsedDate.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Invalid date format provided.',
        });
        return;
      }
      if (parsedDate <= new Date()) {
        res.status(400).json({
          success: false,
          message: 'Event date must be in the future.',
        });
        return;
      }
      event.eventDate = parsedDate;
    }

    if (title) event.title = title.trim();
    if (description) event.description = description.trim();
    if (eventType) event.eventType = eventType.trim();
    if (thumbnail) event.thumbnail = thumbnail.trim();
    if (location) event.location = location.trim();

    await event.save();

    res.status(200).json({
      success: true,
      message: 'Event updated successfully!',
      data: event,
    });
  } catch (error: any) {
    console.error('Error updating event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event.',
      error: error.message,
    });
  }
};

// DELETE /api/events/:id (Protected - Only Creator)
export const deleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid event identifier.' });
      return;
    }

    const event = await Event.findById(id);

    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    // Authorization rule: Users can only delete their own created event data
    if (event.organizerEmail.toLowerCase() !== req.user.email.toLowerCase()) {
      res.status(403).json({
        success: false,
        message: 'Permission denied. You can only delete events created by you.',
      });
      return;
    }

    await Event.findByIdAndDelete(id);

    // Also clean up joined event records
    await EventJoin.deleteMany({ eventId: id });

    res.status(200).json({
      success: true,
      message: 'Event and associated registrations deleted successfully.',
    });
  } catch (error: any) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event.',
      error: error.message,
    });
  }
};

// GET /api/events/user/created (Protected - Manage Events)
export const getMyEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const events = await Event.find({
      organizerEmail: req.user.email.toLowerCase().trim(),
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error: any) {
    console.error('Error fetching user events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve your created events.',
      error: error.message,
    });
  }
};

// POST /api/events/:id/join (Protected)
export const joinEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'You must be logged in to join an event.' });
      return;
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid event identifier.' });
      return;
    }

    const event = await Event.findById(id);

    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    // Check if event is in the past
    if (new Date(event.eventDate) < new Date()) {
      res.status(400).json({
        success: false,
        message: 'This event has already concluded. You cannot join past events.',
      });
      return;
    }

    // Check if user has already joined
    const existingJoin = await EventJoin.findOne({
      eventId: event._id,
      userEmail: req.user.email.toLowerCase().trim(),
    });

    if (existingJoin) {
      res.status(409).json({
        success: false,
        message: 'You have already joined this event.',
      });
      return;
    }

    // Create join record with event and user data
    const joinRecord = await EventJoin.create({
      eventId: event._id,
      userEmail: req.user.email.toLowerCase().trim(),
      userName: req.user.name,
      userPhoto: req.user.photoURL,
      joinedAt: new Date(),
    });

    // Increment participantsCount
    event.participantsCount = (event.participantsCount || 0) + 1;
    await event.save();

    res.status(201).json({
      success: true,
      message: `Successfully joined "${event.title}"! We look forward to seeing you make a difference.`,
      data: joinRecord,
      participantsCount: event.participantsCount,
    });
  } catch (error: any) {
    console.error('Error joining event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join event. Please try again.',
      error: error.message,
    });
  }
};

// DELETE /api/events/:id/join (Protected - Leave/Cancel Join)
export const leaveEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const joinRecord = await EventJoin.findOneAndDelete({
      eventId: id,
      userEmail: req.user.email.toLowerCase().trim(),
    });

    if (!joinRecord) {
      res.status(404).json({
        success: false,
        message: 'You are not registered for this event.',
      });
      return;
    }

    await Event.findByIdAndUpdate(id, {
      $inc: { participantsCount: -1 },
    });

    res.status(200).json({
      success: true,
      message: 'You have successfully left the event.',
    });
  } catch (error: any) {
    console.error('Error leaving event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave event.',
      error: error.message,
    });
  }
};

// GET /api/events/user/joined (Protected - Joined Events Page)
// Requirement: "This page will show all events joined by the logged-in user. Show events sorted by event date."
export const getMyJoinedEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const joins = await EventJoin.find({
      userEmail: req.user.email.toLowerCase().trim(),
    })
      .populate('eventId')
      .exec();

    // Filter out deleted events if any, and map to clean structure
    const validJoinedEvents = joins
      .filter((join) => join.eventId !== null)
      .map((join) => {
        const eventData = join.eventId as any;
        return {
          joinId: join._id,
          joinedAt: join.joinedAt,
          event: {
            _id: eventData._id,
            title: eventData.title,
            description: eventData.description,
            eventType: eventData.eventType,
            thumbnail: eventData.thumbnail,
            location: eventData.location,
            eventDate: eventData.eventDate,
            organizerName: eventData.organizerName,
            organizerEmail: eventData.organizerEmail,
            organizerPhoto: eventData.organizerPhoto,
            participantsCount: eventData.participantsCount,
          },
        };
      });

    // Requirement: Show events sorted by event date
    validJoinedEvents.sort((a, b) => {
      const dateA = new Date(a.event.eventDate).getTime();
      const dateB = new Date(b.event.eventDate).getTime();
      return dateA - dateB;
    });

    res.status(200).json({
      success: true,
      count: validJoinedEvents.length,
      data: validJoinedEvents,
    });
  } catch (error: any) {
    console.error('Error fetching user joined events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve joined events.',
      error: error.message,
    });
  }
};

// GET /api/events/:id/check-joined (Protected)
export const checkIfJoined = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(200).json({ isJoined: false });
      return;
    }

    const { id } = req.params;
    const joinRecord = await EventJoin.findOne({
      eventId: id,
      userEmail: req.user.email.toLowerCase().trim(),
    });

    res.status(200).json({
      success: true,
      isJoined: !!joinRecord,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error checking join status',
      error: error.message,
    });
  }
};

