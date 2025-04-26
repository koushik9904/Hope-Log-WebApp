import { OpenAI } from "openai";
import fs from "fs";
import path from "path";
import axios from "axios";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the avatars to generate
const avatarDescriptions = [
  "Professional avatar with short dark hair, gender-neutral",
  "Professional avatar with long blonde hair, gender-neutral",
  "Professional avatar, East Asian features, gender-neutral",
  "Professional avatar, South Asian features, gender-neutral",
  "Professional avatar, African features, gender-neutral",
  "Professional avatar, Middle Eastern features, gender-neutral",
  "Professional avatar with glasses, gender-neutral",
  "Professional avatar with curly hair, gender-neutral",
];

// Create avatars directory if it doesn't exist
const avatarsDir = path.join(process.cwd(), "public", "avatars");
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

// Function to generate an avatar and save it
async function generateAvatar(description: string, index: number) {
  try {
    console.log(`Generating avatar ${index + 1}: ${description}`);
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `${description}. Close-up portrait style suitable for a profile picture, minimalist, soft lighting, clean background.`,
      n: 1,
      size: "1024x1024",
      style: "natural",
    });
    
    const imageUrl = response.data[0].url;
    
    if (!imageUrl) {
      console.error(`No image URL returned for avatar ${index + 1}`);
      return;
    }
    
    // Download the image
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(imageResponse.data);
    
    // Save to disk
    const filePath = path.join(avatarsDir, `avatar${index + 1}.png`);
    fs.writeFileSync(filePath, buffer);
    
    console.log(`Avatar ${index + 1} saved to ${filePath}`);
  } catch (error) {
    console.error(`Error generating avatar ${index + 1}:`, error);
  }
}

// Main function to generate all avatars
async function generateAllAvatars() {
  console.log("Starting avatar generation...");
  
  for (let i = 0; i < avatarDescriptions.length; i++) {
    await generateAvatar(avatarDescriptions[i], i);
  }
  
  console.log("Avatar generation complete!");
}

// Execute the main function
generateAllAvatars()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error in avatar generation:", error);
    process.exit(1);
  });