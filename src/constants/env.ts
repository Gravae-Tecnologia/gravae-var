import { z } from 'zod'

const envSchema = z.object({
  SHINOBI_URL: z.url(),
  SHINOBI_GROUP_KEY: z.string(),
  SHINOBI_API_KEY: z.string(),
})

export const env = envSchema.parse({
  SHINOBI_URL: import.meta.env.VITE_SHINOBI_URL,
  SHINOBI_GROUP_KEY: import.meta.env.VITE_SHINOBI_GROUP_KEY,
  SHINOBI_API_KEY: import.meta.env.VITE_SHINOBI_API_KEY,
})
