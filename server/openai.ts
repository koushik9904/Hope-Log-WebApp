import OpenAI from "openai";
import { db } from "./db";
import { journalEntries, journalEmbeddings } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Generate embeddings for text
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

// Store embedding for a journal entry
export async function storeEmbedding(journalEntryId: number, text: string): Promise<void> {
  try {
    const embedding = await generateEmbedding(text);
    
    try {
      // Try to insert into journal_embeddings table
      await db.insert(journalEmbeddings).values({
        journalEntryId,
        embeddingJson: embedding as any
      });
      
      console.log(`Stored embedding for journal entry ${journalEntryId}`);
    } catch (dbError) {
      // If table doesn't exist yet, just log but don't fail
      console.log(`Could not store embedding (table may not exist yet): ${dbError}`);
      
      // We could queue this for later processing if needed
    }
  } catch (error) {
    console.error("Error generating embedding:", error);
  }
}

// Retrieve similar journal entries based on semantic search
export async function retrieveSimilarEntries(
  query: string, 
  userId: number, 
  limit: number = 3
): Promise<{ id: number; content: string; date: string; transcript?: string | null; similarity: number }[]> {
  try {
    // First, try the optimized version with embeddings if that table exists
    try {
      // Generate embedding for the query
      const queryEmbedding = await generateEmbedding(query);
      
      // Get all embeddings for the user's journal entries
      const userEntries = await db.select({
        id: journalEntries.id,
        content: journalEntries.content,
        date: journalEntries.date,
        transcript: journalEntries.transcript,
        embedding: journalEmbeddings.embeddingJson
      })
      .from(journalEntries)
      .innerJoin(
        journalEmbeddings,
        eq(journalEntries.id, journalEmbeddings.journalEntryId)
      )
      .where(
        and(
          eq(journalEntries.userId, userId),
          eq(journalEntries.isAiResponse, false),
          eq(journalEntries.isJournal, true) // Only retrieve from permanent journal entries, not temporary chat messages
        )
      );
      
      // If we successfully got entries with embeddings, calculate similarity
      if (userEntries.length > 0) {
        // Calculate similarity using cosine similarity
        const similarEntries = userEntries
          .map(entry => {
            // Extract embedding
            const entryEmbedding = entry.embedding as unknown as number[];
            
            // Calculate cosine similarity
            let dotProduct = 0;
            let queryMagnitude = 0;
            let entryMagnitude = 0;
            
            for (let i = 0; i < queryEmbedding.length; i++) {
              dotProduct += queryEmbedding[i] * entryEmbedding[i];
              queryMagnitude += queryEmbedding[i] * queryEmbedding[i];
              entryMagnitude += entryEmbedding[i] * entryEmbedding[i];
            }
            
            const similarity = dotProduct / (Math.sqrt(queryMagnitude) * Math.sqrt(entryMagnitude));
            
            return {
              id: entry.id,
              content: entry.content,
              date: entry.date,
              transcript: entry.transcript,
              similarity
            };
          })
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, limit);
        
        return similarEntries;
      }
    } catch (e) {
      console.log("Embeddings table may not exist yet, falling back to keyword search:", e);
    }
    
    // Fallback: Get recent entries and use OpenAI to find relevant ones
    // This approach doesn't require the embeddings table
    const userEntries = await db.select({
      id: journalEntries.id,
      content: journalEntries.content,
      date: journalEntries.date,
      transcript: journalEntries.transcript,
    })
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.userId, userId),
        eq(journalEntries.isAiResponse, false),
        eq(journalEntries.isJournal, true) // Only use saved journal entries, not temporary chats
      )
    )
    .orderBy(desc(journalEntries.date))
    .limit(10);
    
    if (userEntries.length === 0) {
      return [];
    }
    
    // If only a few entries, return them all with arbitrary similarity scores
    if (userEntries.length <= limit) {
      return userEntries.map((entry, index) => ({
        id: entry.id,
        content: entry.content,
        date: entry.date,
        transcript: entry.transcript,
        similarity: 1 - (index * 0.1) // Simple decreasing similarity 
      }));
    }
    
    // Use OpenAI to rank the relevance of entries to the query
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a retrieval system. Given a query and a set of journal entries, 
                     return the indices of the ${limit} most relevant entries to the query.
                     Return only a JSON array of numbers representing the indices, with no explanation.`
          },
          {
            role: "user",
            content: `Query: ${query}

                     Journal entries:
                     ${userEntries.map((entry, i) => `[${i}] ${entry.content.substring(0, 200)}...`).join('\n\n')}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });
      
      // Parse the response to get the indices
      const jsonResponse = JSON.parse(response.choices[0].message.content || '{"indices":[0,1,2]}');
      const relevantIndices = Array.isArray(jsonResponse.indices) ? jsonResponse.indices : 
                              Array.isArray(jsonResponse) ? jsonResponse : [0, 1, 2];
      
      // Map the indices to entries
      return relevantIndices
        .filter((index: number) => index >= 0 && index < userEntries.length)
        .map((index: number, rank: number) => ({
          id: userEntries[index].id,
          content: userEntries[index].content,
          date: userEntries[index].date,
          transcript: userEntries[index].transcript,
          similarity: 1 - (rank * 0.1) // Arbitrary similarity score based on rank
        }))
        .slice(0, limit);
      
    } catch (oaiError) {
      console.error("OpenAI ranking failed, returning most recent entries:", oaiError);
      
      // If OpenAI fails, just return the most recent entries
      return userEntries.slice(0, limit).map((entry, index) => ({
        id: entry.id,
        content: entry.content,
        date: entry.date,
        transcript: entry.transcript,
        similarity: 1 - (index * 0.1)
      }));
    }
    
  } catch (error) {
    console.error("Error retrieving similar entries:", error);
    return [];
  }
}

// Chat response generation with RAG
export async function generateAIResponse(
  userMessage: string,
  conversationHistory: { role: "user" | "ai" | string; content: string }[],
  username: string,
  userId?: number,
  isMultiPartPrompt: boolean = false
): Promise<string> {
  try {
    // Get relevant past entries using RAG if userId is provided
    let contextFromPastEntries = "";
    if (userId) {
      try {
        const similarEntries = await retrieveSimilarEntries(userMessage, userId);
        if (similarEntries.length > 0) {
          contextFromPastEntries = "Here are some relevant past journal entries that may provide context:\n\n" +
            similarEntries.map(entry => {
              // Use transcript field if available (from saved conversations) otherwise fall back to content
              const entryText = entry.transcript || entry.content;
              return `Past entry from ${new Date(entry.date).toDateString()}: "${entryText}"`;
            }).join("\n\n");
        }
      } catch (error) {
        console.log("Error retrieving similar entries, continuing without RAG context:", error);
      }
    }

    // Check if the conversation history already contains a system message
    const hasSystemMessage = conversationHistory.some(msg => msg.role === "system");
    
    let systemContent = '';
    
    // Use a different system prompt for multi-part prompts if no system message exists
    if (!hasSystemMessage) {
      if (isMultiPartPrompt) {
        systemContent = `You are Hope Log, guiding ${username} through a structured journaling exercise.
        Break down complex prompts into smaller steps and guide the user through them one by one.
        
        ${contextFromPastEntries ? `\n\n${contextFromPastEntries}\n\n` : ""}
        
        Guidelines for structured journaling:
        - Ask about ONE part of the prompt at a time
        - Wait for the user's response before moving to the next part
        - For prompts asking for multiple items (like "three things"), address each item separately
        - Ask follow-up questions about WHY or HOW to encourage deeper reflection
        - Be patient, warm and supportive throughout the process
        - After all parts are complete, provide a brief summary of the user's reflections
        - Never claim to be a therapist or provide medical advice`;
      } else {
        systemContent = `You are Hope Log, an empathetic AI journal assistant. 
        Your purpose is to help ${username} with mental wellness through supportive conversation.
        Be warm, thoughtful, and encouraging. 
        
        ${contextFromPastEntries ? `\n\n${contextFromPastEntries}\n\n` : ""}
        
        VERY IMPORTANT: When the user selects a suggested prompt (like "How am I feeling today?"), 
        do NOT treat this as if the user is asking YOU this question. Instead, recognize this is a 
        journaling prompt the user wants to explore. Respond by asking THEM about it.
        
        For example:
        - If prompt is "How am I feeling today?" → respond with "How are you feeling today? Would you like to share more about your emotions?"
        - If prompt is "What's something I'm grateful for?" → respond with "I'd love to hear about something you're grateful for today. What comes to mind?"
        
        Guidelines:
        - Keep responses concise (2-3 sentences)
        - Be empathetic and supportive
        - Ask questions directly to the user to encourage journaling
        - Remember details from the conversation
        - Never claim to be a therapist or provide medical advice
        - If the user expresses severe distress, suggest professional help`;
      }
    }
    
    // Build messages array
    let messages = [] as any[];
    
    if (hasSystemMessage) {
      // Use the existing system message from the history
      messages = [
        ...conversationHistory.map((entry) => ({
          role: entry.role === "user" ? "user" : entry.role === "system" ? "system" : "assistant",
          content: entry.content,
        })),
        { role: "user", content: userMessage },
      ];
    } else {
      // Use our newly created system message
      messages = [
        {
          role: "system",
          content: systemContent,
        },
        ...conversationHistory.map((entry) => ({
          role: entry.role === "user" ? "user" : "assistant",
          content: entry.content,
        })),
        { role: "user", content: userMessage },
      ];
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      max_tokens: isMultiPartPrompt ? 350 : 200,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "I'm not sure how to respond to that.";
  } catch (error) {
    console.error("Error generating AI response:", error);
    return "I'm having trouble processing your message right now. Please try again later.";
  }
}

// Sentiment analysis
export async function analyzeSentiment(text: string): Promise<{
  score: number;
  emotions: string[];
  themes: string[];
  goals?: {
    name: string;
    isNew: boolean;
    completion?: number;
  }[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a sentiment analysis expert with a special focus on goal identification. Analyze the journal entry and provide:
          
          1. A rating from 1 (negative) to 5 (positive)
          2. Key emotions present (top 3)
          3. Main themes discussed (up to 3)
          4. Any goals or tasks mentioned by the user
          
          For goals, determine:
          - If it's a new goal or an update to an existing one
          - For updates, include the estimated completion percentage (0-100)
          
          Format as JSON with keys:
          - 'score': number from 1-5
          - 'emotions': array of strings
          - 'themes': array of strings
          - 'goals': array of objects with { name: string, isNew: boolean, completion?: number }
          `,
        },
        {
          role: "user",
          content: text,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || '{"score":3,"emotions":[],"themes":[],"goals":[]}';
    const result = JSON.parse(content);

    return {
      score: Math.max(1, Math.min(5, Math.round(result.score))),
      emotions: result.emotions || [],
      themes: result.themes || [],
      goals: result.goals || [],
    };
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    return {
      score: 3, // Neutral fallback
      emotions: ["unknown"],
      themes: ["unknown"],
      goals: [],
    };
  }
}

// Weekly summary generation
export async function generateWeeklySummary(
  journalEntries: { content: string; sentiment?: { score: number; emotions: string[]; themes: string[] } }[]
): Promise<{
  topEmotions: string[];
  commonThemes: string[];
  insights: string;
}> {
  try {
    // Create a summary of the journal entries
    const entriesText = journalEntries
      .map((entry) => {
        const sentimentInfo = entry.sentiment
          ? `[Sentiment: ${entry.sentiment.score}/5, Emotions: ${entry.sentiment.emotions.join(", ")}]`
          : "";
        return `Entry: ${entry.content} ${sentimentInfo}`;
      })
      .join("\n\n");

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an AI wellness assistant. Based on the journal entries provided, create a weekly summary with the top 3 emotions expressed, top 3 common themes, and one meaningful insight that could help the user. Return only JSON.",
        },
        {
          role: "user",
          content: `Here are the journal entries for the past week:\n\n${entriesText}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || '{"topEmotions":["Calm","Reflective","Hopeful"],"commonThemes":["Self-care","Productivity","Relationships"],"insight":"Consider setting aside time each day for intentional relaxation."}';
    const result = JSON.parse(content);

    return {
      topEmotions: result.topEmotions || ["Calm", "Reflective", "Hopeful"],
      commonThemes: result.commonThemes || ["Self-care", "Productivity", "Relationships"],
      insights: result.insight || "Consider setting aside time each day for intentional relaxation.",
    };
  } catch (error) {
    console.error("Error generating weekly summary:", error);
    return {
      topEmotions: ["Calm", "Reflective", "Hopeful"],
      commonThemes: ["Self-care", "Productivity", "Relationships"],
      insights: "Consider setting aside time each day for intentional relaxation.",
    };
  }
}

// Generate prompts based on user's history
export async function generateCustomPrompts(
  recentEntries: string[],
  userMoods: number[]
): Promise<string[]> {
  try {
    const avgMood = userMoods.length > 0
      ? userMoods.reduce((sum, current) => sum + current, 0) / userMoods.length
      : 3;
    
    const moodDescription = avgMood < 2.5 
      ? "lower than average" 
      : avgMood > 3.5 
        ? "higher than average" 
        : "average";

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a journal prompt creator. Based on the user's recent entries and mood patterns, generate 3 thoughtful prompts that would be helpful for their mental wellness journey. Each prompt should be a single sentence question. Return as a JSON array of strings.",
        },
        {
          role: "user",
          content: `Recent journal entries: ${recentEntries.join("\n\n")}\n\nThe user's mood has been ${moodDescription} recently.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || '{"prompts":["What are three things that went well today, and why?","When did you feel most at peace this week?","What\'s one small step you can take tomorrow to feel better?"]}';
    const result = JSON.parse(content);
    return result.prompts || [
      "What are three things that went well today, and why?",
      "When did you feel most at peace this week?",
      "What's one small step you can take tomorrow to feel better?",
    ];
  } catch (error) {
    console.error("Error generating prompts:", error);
    return [
      "What are three things that went well today, and why?",
      "When did you feel most at peace this week?",
      "What's one small step you can take tomorrow to feel better?",
    ];
  }
}