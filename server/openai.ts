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
): Promise<{ id: number; content: string; similarity: number }[]> {
  try {
    // First, try the optimized version with embeddings if that table exists
    try {
      // Generate embedding for the query
      const queryEmbedding = await generateEmbedding(query);
      
      // Get all embeddings for the user's journal entries
      const userEntries = await db.select({
        id: journalEntries.id,
        content: journalEntries.content,
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
          eq(journalEntries.isAiResponse, false)
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
    })
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.userId, userId),
        eq(journalEntries.isAiResponse, false)
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
          similarity: 1 - (rank * 0.1) // Arbitrary similarity score based on rank
        }))
        .slice(0, limit);
      
    } catch (oaiError) {
      console.error("OpenAI ranking failed, returning most recent entries:", oaiError);
      
      // If OpenAI fails, just return the most recent entries
      return userEntries.slice(0, limit).map((entry, index) => ({
        id: entry.id,
        content: entry.content,
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
  userId?: number
): Promise<string> {
  try {
    // Get relevant past entries using RAG if userId is provided
    let contextFromPastEntries = "";
    if (userId) {
      try {
        const similarEntries = await retrieveSimilarEntries(userMessage, userId);
        if (similarEntries.length > 0) {
          contextFromPastEntries = "Here are some relevant past journal entries that may provide context:\n\n" +
            similarEntries.map(entry => `"${entry.content}"`).join("\n\n");
        }
      } catch (error) {
        console.log("Error retrieving similar entries, continuing without RAG context:", error);
      }
    }

    const messages = [
      {
        role: "system",
        content: `You are Hope Log, an empathetic AI journal assistant. 
        Your purpose is to help ${username} with mental wellness through supportive conversation.
        Be warm, thoughtful, and encouraging. Ask insightful follow-up questions that promote self-reflection.
        Respond in a conversational, yet helpful manner. Sound like a caring friend.
        
        ${contextFromPastEntries ? `\n\n${contextFromPastEntries}\n\n` : ""}
        
        Guidelines:
        - Keep responses concise (2-3 sentences)
        - Be empathetic and supportive
        - Ask thoughtful follow-up questions to encourage journaling
        - Remember details from the conversation
        - Never claim to be a therapist or provide medical advice
        - If the user expresses severe distress, suggest professional help`,
      },
      // Convert conversation history to OpenAI format
      ...conversationHistory.map((entry) => ({
        role: entry.role === "user" ? "user" : "assistant",
        content: entry.content,
      })),
      // Add the current message
      { role: "user", content: userMessage },
    ] as any[];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      max_tokens: 200,
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