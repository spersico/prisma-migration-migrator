import dotenv from 'dotenv';
import { knexFilePrismaAdapter } from './src/knexFilePrismaAdapter.mjs';

dotenv.config();

export default knexFilePrismaAdapter({
  client: 'pg',
  connection: process.env.DATABASE_URL,
});
