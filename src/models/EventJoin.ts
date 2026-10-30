import mongoose, { Document, Schema } from 'mongoose';

export interface IEventJoin extends Document {
  eventId: mongoose.Types.ObjectId;
  userEmail: string;
  userName: string;
  userPhoto?: string;
  joinedAt: Date;
}

const EventJoinSchema: Schema = new Schema(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    userEmail: {
      type: String,
      required: [true, 'User email is required'],
      lowercase: true,
      trim: true,
    },
    userName: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
    },
    userPhoto: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate joining by the same user to the same event
EventJoinSchema.index({ eventId: 1, userEmail: 1 }, { unique: true });

export const EventJoin = mongoose.model<IEventJoin>('EventJoin', EventJoinSchema);
