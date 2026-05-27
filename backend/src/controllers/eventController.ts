import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/requests';
import * as eventService from '../services/eventService';
import { ValidationError } from '../utils/errors';

// ─── Create Event ──────────────────────────────────────────────────────────────

export const handleCreateEvent = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, date, location, type, imageUrl } = req.body;
    if (!title || !date) throw new ValidationError('Title and date are required');
    const event = await eventService.createEvent({
      title, description, date, location, type, imageUrl, createdBy: req.user.uid,
    });
    res.status(201).json({ success: true, data: event });
  } catch (err) { next(err); }
};

// ─── Get All Events ────────────────────────────────────────────────────────────

export const handleGetEvents = async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const events = await eventService.getAllEvents();
    res.json({ success: true, data: events });
  } catch (err) { next(err); }
};

// ─── Get Event Detail ──────────────────────────────────────────────────────────

export const handleGetEventDetail = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const event = await eventService.getEventById(req.params.eventId);
    if (!event) { res.status(404).json({ success: false, error: 'Event not found' }); return; }
    res.json({ success: true, data: event });
  } catch (err) { next(err); }
};

// ─── RSVP ──────────────────────────────────────────────────────────────────────

export const handleRsvpEvent = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const rsvp = await eventService.rsvpToEvent(req.params.eventId, req.user.uid, req.body.status);
    res.json({ success: true, data: rsvp });
  } catch (err) { next(err); }
};

// ─── Get RSVPs ─────────────────────────────────────────────────────────────────

export const handleGetEventRSVPs = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const rsvps = await eventService.getEventRsvps(req.params.eventId);
    res.json({ success: true, data: rsvps });
  } catch (err) { next(err); }
};

// ─── Delete ────────────────────────────────────────────────────────────────────

export const handleDeleteEvent = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await eventService.deleteEvent(req.params.eventId);
    res.json({ success: true, data: { deleted: req.params.eventId } });
  } catch (err) { next(err); }
};
