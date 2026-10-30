import { Router } from 'express';
import {
  getUpcomingEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getMyEvents,
  joinEvent,
  leaveEvent,
  getMyJoinedEvents,
  checkIfJoined,
} from '../controllers/eventController';
import { verifyToken, optionalAuth } from '../middlewares/authMiddleware';

const router = Router();

// Public routes
router.get('/upcoming', getUpcomingEvents);

// Protected routes for current user's collections (must be before /:id)
router.get('/user/created', verifyToken, getMyEvents);
router.get('/user/joined', verifyToken, getMyJoinedEvents);

// Single event routes
router.get('/:id', optionalAuth, getEventById);
router.get('/:id/check-joined', verifyToken, checkIfJoined);

// Protected mutation routes
router.post('/', verifyToken, createEvent);
router.post('/:id/join', verifyToken, joinEvent);
router.delete('/:id/join', verifyToken, leaveEvent);
router.put('/:id', verifyToken, updateEvent);
router.delete('/:id', verifyToken, deleteEvent);

export default router;

