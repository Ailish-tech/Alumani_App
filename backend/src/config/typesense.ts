import { Client } from 'typesense';
import dotenv from 'dotenv';

dotenv.config();

export const typesenseClient = new Client({
  nodes: [
    {
      host: process.env.TYPESENSE_HOST || 'localhost',
      port: parseInt(process.env.TYPESENSE_PORT || '8108', 10),
      protocol: process.env.TYPESENSE_PROTOCOL || 'http',
    },
  ],
  apiKey: process.env.TYPESENSE_API_KEY || 'your_typesense_api_key',
  connectionTimeoutSeconds: 5,
});
