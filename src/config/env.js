import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

config({ path: resolve(__dirname, '../../.env') });

const required = ['POSTGRES_URI', 'MONGO_URI'];

for (const key of required) {
  if (!process.env[key]) {
    console.log(`Error: Falta variable de entorno requerida: ${key}`);
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  port: process.env.PORT ?? 3000,
  postgresUri: process.env.POSTGRES_URI,
  mongoUri: process.env.MONGO_URI,
  nodeEnv: process.env.NODE_ENV ?? 'development',
  fileDataCsv: process.env.FILE_DATA_CSV ?? './data/simulation_saludplus_data.csv',
};
