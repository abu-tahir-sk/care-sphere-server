import mongoose from 'mongoose';

const getMongoUri = (): string => {
  if (process.env.MONGO_URI) {
    return process.env.MONGO_URI;
  }

  const user = 'care-sphere';
  const pass = 'SkR8tpsy3NwvOzjZ';
  const shards = [
    'ac-tpl1w1w-shard-00-00.qha6rup.mongodb.net:27017',
    'ac-tpl1w1w-shard-00-01.qha6rup.mongodb.net:27017',
    'ac-tpl1w1w-shard-00-02.qha6rup.mongodb.net:27017',
  ].join(',');
  const options = 'ssl=true&replicaSet=atlas-542sdc-shard-0&authSource=admin&compressors=zlib';
  return `mongodb://${user}:${pass}@${shards}/caresphere_db?${options}`;
};

let cachedPromise: Promise<typeof mongoose> | null = null;

export const connectDB = async (): Promise<typeof mongoose | void> => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose;
  }

  if (cachedPromise) {
    return cachedPromise;
  }

  const mongoUri = getMongoUri();

  try {
    cachedPromise = mongoose.connect(mongoUri, {
      bufferCommands: false,
    });
    const conn = await cachedPromise;
    console.log('MongoDB Connected successfully to CareSphere database.');
    return conn;
  } catch (error) {
    cachedPromise = null;
    console.error('Failed to connect to MongoDB:', error);
    // Never call process.exit(1) on Vercel as it crashes the entire serverless lambda
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
};
