import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Event } from '../models/Event';
import { EventJoin } from '../models/EventJoin';

dotenv.config();

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is missing in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for database seeding...');

    // Clear existing collections if desired, or ensure clean slate
    await User.deleteMany({ email: { $in: ['organizer@caresphere.org', 'volunteer@caresphere.org', 'tahmid@caresphere.org'] } });
    await Event.deleteMany({ organizerEmail: { $in: ['organizer@caresphere.org', 'tahmid@caresphere.org'] } });

    // Create demo users
    const salt = await bcrypt.genSalt(10);
    const demoPassword = await bcrypt.hash('CareSphere@2026', salt);

    const organizerUser = await User.create({
      name: 'Tahmidur Rahman',
      email: 'organizer@caresphere.org',
      password: demoPassword,
      photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      bio: 'Social activist and organizer working on grassroots poverty alleviation and disaster relief in Dhaka.',
      role: 'organizer',
    });

    const volunteerUser = await User.create({
      name: 'Nusrat Jahan',
      email: 'volunteer@caresphere.org',
      password: demoPassword,
      photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
      bio: 'Passionate youth volunteer dedicated to environmental causes and primary education support.',
      role: 'volunteer',
    });

    console.log('Demo users created.');

    // Helper for future dates
    const daysFromNow = (days: number): Date => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      d.setHours(10, 0, 0, 0);
      return d;
    };

    const initialEvents = [
      {
        title: 'Winter Clothes Distribution – Mirpur 10, Dhaka',
        description: 'Join us to distribute warm winter jackets, sweaters, and woolen caps to underprivileged families and rickshaw pullers around the Mirpur 10 roundabout. Help us spread warmth this upcoming winter season.',
        eventType: 'Winter Relief',
        thumbnail: 'https://images.unsplash.com/photo-1578357078586-491adf1aa5ba?w=800&auto=format&fit=crop&q=80',
        location: 'Mirpur 10 Community Center Grounds, Dhaka',
        eventDate: daysFromNow(5),
        organizerEmail: 'organizer@caresphere.org',
        organizerName: 'Tahmidur Rahman',
        organizerPhoto: organizerUser.photoURL,
        participantsCount: 14,
      },
      {
        title: 'Blanket Distribution for the Needy – Mohammadpur, Dhaka',
        description: 'An emergency winter drive aiming to hand over 500 thick blankets to homeless individuals and elderly residents living in temporary shelters across Mohammadpur and Town Hall areas.',
        eventType: 'Donation',
        thumbnail: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&auto=format&fit=crop&q=80',
        location: 'Town Hall Market Square, Mohammadpur, Dhaka',
        eventDate: daysFromNow(8),
        organizerEmail: 'organizer@caresphere.org',
        organizerName: 'Tahmidur Rahman',
        organizerPhoto: organizerUser.photoURL,
        participantsCount: 22,
      },
      {
        title: 'Community Tree Plantation Drive – Dhanmondi Lake, Dhaka',
        description: 'Help restore the green canopy along the lakeside walkway. Volunteers will plant 300 native fruit and shade saplings, install protective bamboo cages, and learn urban ecological care.',
        eventType: 'Plantation',
        thumbnail: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80',
        location: 'Dhanmondi Lake Walkway (Sector 8 Entrance), Dhaka',
        eventDate: daysFromNow(12),
        organizerEmail: 'organizer@caresphere.org',
        organizerName: 'Tahmidur Rahman',
        organizerPhoto: organizerUser.photoURL,
        participantsCount: 35,
      },
      {
        title: 'Clean Dhaka Youth Cleanup Initiative – Gulshan 2 Lake Park',
        description: 'A neighborhood cleanup campaign tackling single-use plastic waste around public parks and pedestrian pathways. Gloves, collection bags, and safety gear will be provided to all volunteers.',
        eventType: 'Cleanup',
        thumbnail: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop&q=80',
        location: 'Gulshan 2 Lake Park Main Gate, Dhaka',
        eventDate: daysFromNow(15),
        organizerEmail: 'organizer@caresphere.org',
        organizerName: 'Tahmidur Rahman',
        organizerPhoto: organizerUser.photoURL,
        participantsCount: 19,
      },
      {
        title: 'Free Health Screening & Medicine Camp – Uttara Sector 4',
        description: 'Volunteer doctors and medical students offering free blood glucose tests, general physician consultations, eye health screenings, and necessary prescription medications for low-income residents.',
        eventType: 'Healthcare',
        thumbnail: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80',
        location: 'Uttara Sector 4 Kalyan Samiti Hall, Dhaka',
        eventDate: daysFromNow(18),
        organizerEmail: 'organizer@caresphere.org',
        organizerName: 'Tahmidur Rahman',
        organizerPhoto: organizerUser.photoURL,
        participantsCount: 28,
      },
      {
        title: 'Education for All: Book & Stationary Drive – Farmgate, Dhaka',
        description: 'Collecting and packaging primary school textbooks, notebooks, geometry sets, and storybooks to distribute among children attending free street school initiatives in Tejgaon and Farmgate.',
        eventType: 'Education',
        thumbnail: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80',
        location: 'Ananda Cinema Hall Open Plaza, Farmgate, Dhaka',
        eventDate: daysFromNow(22),
        organizerEmail: 'organizer@caresphere.org',
        organizerName: 'Tahmidur Rahman',
        organizerPhoto: organizerUser.photoURL,
        participantsCount: 31,
      },
      {
        title: 'Nutritious Hot Meal Distribution – Old Dhaka (Lalbagh)',
        description: 'Cooking and packaging nutritious hot khichuri meals for over 400 vulnerable families, orphans, and daily wage laborers in the historic Lalbagh and Chawkbazar neighborhoods.',
        eventType: 'Food Drive',
        thumbnail: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&auto=format&fit=crop&q=80',
        location: 'Lalbagh Fort Community Ground, Lalbagh, Old Dhaka',
        eventDate: daysFromNow(26),
        organizerEmail: 'organizer@caresphere.org',
        organizerName: 'Tahmidur Rahman',
        organizerPhoto: organizerUser.photoURL,
        participantsCount: 42,
      },
      {
        title: 'Coastal Mangrove Restoration Drive – Chattogram Coastline',
        description: 'Collaborate with local environmentalists to plant resilient mangrove saplings along vulnerable coastal embankments, mitigating erosion and safeguarding biodiversity.',
        eventType: 'Plantation',
        thumbnail: 'https://images.unsplash.com/photo-1516214104703-d870798883c5?w=800&auto=format&fit=crop&q=80',
        location: 'Patenga Beach Estuary, Chattogram',
        eventDate: daysFromNow(30),
        organizerEmail: 'organizer@caresphere.org',
        organizerName: 'Tahmidur Rahman',
        organizerPhoto: organizerUser.photoURL,
        participantsCount: 25,
      },
    ];

    const insertedEvents = await Event.insertMany(initialEvents);
    console.log(`Successfully seeded ${insertedEvents.length} upcoming events!`);

    // Add a join sample
    if (insertedEvents.length > 0) {
      await EventJoin.create({
        eventId: insertedEvents[0]._id,
        userEmail: volunteerUser.email,
        userName: volunteerUser.name,
        userPhoto: volunteerUser.photoURL,
        joinedAt: new Date(),
      });
      console.log('Sample event registration created.');
    }

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();

