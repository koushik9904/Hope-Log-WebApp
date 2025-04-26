import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await db.select().from(users).where(eq(users.username, 'admin')).limit(1);
    
    if (existingAdmin.length > 0) {
      console.log('Admin user already exists');
      
      // Make sure the admin user has an email address and is verified
      const admin = existingAdmin[0];
      if (!admin.email || !admin.isVerified) {
        await db.update(users)
          .set({
            email: admin.email || 'admin@hopelog.ai',
            isVerified: true
          })
          .where(eq(users.id, admin.id));
        console.log('Updated admin user with email and verified status');
      }
      return;
    }
    
    // Create the admin user
    const hashedPassword = await hashPassword('admin234');
    
    await db.insert(users).values({
      username: 'admin',
      password: hashedPassword,
      name: 'Administrator', // Added required name field
      email: 'admin@hopelog.ai',
      isAdmin: true,
      isVerified: true,
    });
    
    console.log('Admin user created successfully');
  } catch (error) {
    console.error('Failed to create admin user:', error);
  }
}

// Export the function so it can be called from other files
export { createAdminUser };