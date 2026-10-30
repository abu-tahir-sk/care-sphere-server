import mongoose, { Document, Schema } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  description: string;
  eventType: string;
  thumbnail: string;
  location: string;
  eventDate: Date;
  organizerEmail: string;
  organizerName: string;
  organizerPhoto?: string;
  participantsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
    },
    eventType: {
      type: String,
      required: [true, 'Event type is required'],
      enum: [
        'Cleanup',
        'Plantation',
        'Donation',
        'Food Drive',
        'Healthcare',
        'Education',
        'Winter Relief',
        'Other',
      ],
      default: 'Donation',
    },
    thumbnail: {
      type: String,
      required: [true, 'Event thumbnail URL is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Event location is required'],
      trim: true,
    },
    eventDate: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    organizerEmail: {
      type: String,
      required: [true, 'Organizer email is required'],
      lowercase: true,
      trim: true,
    },
    organizerName: {
      type: String,
      required: [true, 'Organizer name is required'],
      trim: true,
    },
    organizerPhoto: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    participantsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

EventSchema.index({ eventDate: 1 });
EventSchema.index({ organizerEmail: 1 });
EventSchema.index({ eventType: 1 });

export const Event = mongoose.model<IEvent>('Event', EventSchema);
