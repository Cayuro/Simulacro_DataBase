import mongoose from 'mongoose';
import { env } from './env.js';

// Función para conectar a MongoDB
export async function connectMongoDB() {
  try {
    await mongoose.connect(env.mongoUri);
    console.log('✅ MongoDB conectado');
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    process.exit(1);
  }
}

// Función para cerrar la conexión
export async function closeMongoDB() {
  await mongoose.connection.close();
  console.log('✅ MongoDB cerrado');
}

export default mongoose;
