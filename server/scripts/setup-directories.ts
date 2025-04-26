import * as fs from 'fs';
import * as path from 'path';

/**
 * Ensure all required directories exist for the application
 */
export function setupDirectories() {
  // Create directories for avatars
  const uploadDir = path.join(process.cwd(), 'public');
  const avatarDir = path.join(uploadDir, 'avatars');
  const avatarUploadsDir = path.join(avatarDir, 'uploads');
  const avatarGeneratedDir = path.join(avatarDir, 'generated');
  const avatarStandardDir = path.join(avatarDir, 'standard');
  
  // Create directories for exports and temporary files
  const exportsDir = path.join(uploadDir, 'exports');
  const tempDir = path.join(uploadDir, 'temp');
  
  // Create all directories that don't exist
  const dirsToCreate = [
    uploadDir,
    avatarDir,
    avatarUploadsDir,
    avatarGeneratedDir,
    avatarStandardDir,
    exportsDir,
    tempDir
  ];
  
  for (const dir of dirsToCreate) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  }
}

// Call the setupDirectories function to ensure it runs when imported
// This is safe since it's idempotent (won't cause issues if called multiple times)
setupDirectories();