import OpenAI from "openai";
import { db } from "./db";
import { journalEntries, journalEmbeddings } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { storage } from "./storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

/**
 * Generate a concise, meaningful title for a journal entry based on its content
 */
export async function generateJournalTitle(content: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a journal title generator. Your task is to create a short, descriptive, and meaningful title for a journal entry. The title should capture the essence of the entry in 3-7 words. Don't use quotes around the title. Focus on the main themes or emotions in the journal."
        },
        {
          role: "user",
          content: `Generate a concise, meaningful title for this journal entry: \n\n${content}`
        }
      ],
      max_tokens: 30,
      temperature: 0.7,
    });

    const title = response.choices[0].message.content?.trim() || "Journal Entry";
    return title;
  } catch (error) {
    console.error("Error generating journal title:", error);
    return "Journal Entry"; // Fallback title
  }
}
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
  goals: { name: string; isNew: boolean; completion?: number }[];
  tasks: { name: string; description: string }[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        {
          role: "system",
          content: `Analyze the journal entry for sentiment, emotions, and identify potential tasks and goals. 

Tasks are:
- Single actions that can be completed quickly (within a few hours)
- Concrete, immediate activities
- Examples: "write a blog post", "attend meeting", "call doctor"

Goals are:
- Longer-term achievements requiring multiple steps
- Complex objectives that need planning
- Examples: "learn to cook", "plan software architecture", "secure funding"

For each identified task/goal, determine if it's a task (quick, single action) or goal (multiple steps, longer-term).  Return results as JSON with keys: 'score', 'emotions', 'themes', 'goals' (array of {name:string, isNew:boolean, completion?:number}), and 'tasks' (array of {name:string, description:string}).`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || '{"score":3,"emotions":[],"themes":[],"goals":[],"tasks":[]}';
    const result = JSON.parse(content);

    return {
      score: Math.max(1, Math.min(5, Math.round(result.score))),
      emotions: result.emotions || [],
      themes: result.themes || [],
      goals: result.goals || [],
      tasks: result.tasks || [],
    };
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    return {
      score: 3, 
      emotions: ["unknown"],
      themes: ["unknown"],
      goals: [],
      tasks: [],
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

// Generate goal and habit suggestions based on journal entries
export async function generateGoalSuggestions(
  recentEntries: { content: string; date: string; id?: number }[],
  existingGoals: { name: string; targetDate?: string | null; progress: number }[] = []
): Promise<{ goals: { name: string; type: 'goal' | 'habit'; description: string }[] }> {
  try {
    // Extract the content of the journal entries
    const entriesText = recentEntries
      .map(entry => `Entry from ${new Date(entry.date).toDateString()}: ${entry.content}`)
      .join("\n\n");

    // Get relevant past entries using RAG if possible
    let similarEntries: Array<{id: number; content: string; date: string; transcript?: string | null; similarity: number}> = [];
    if (recentEntries.length > 0 && recentEntries[0].id) {
      try {
        // Get the user ID from the first entry (all entries should be from the same user)
        const firstEntry = await storage.getJournalEntryById(recentEntries[0].id);
        if (firstEntry && firstEntry.userId) {
          // Use the first entry text as a query for similarity search
          similarEntries = await retrieveSimilarEntries(recentEntries[0].content, firstEntry.userId, 5);
        }
      } catch (error) {
        console.log("Error retrieving similar entries, continuing without RAG context:", error);
      }
    }

    // Format the similar entries if any were found
    const similarEntriesText = similarEntries.length > 0
      ? `\n\nHere are additional relevant journal entries for context:\n${
          similarEntries
            .filter(entry => !recentEntries.some(recent => recent.id === entry.id)) // Avoid duplicates
            .map(entry => `Entry from ${new Date(entry.date).toDateString()}: "${entry.content}"`)
            .join("\n\n")
        }`
      : "";

    const existingGoalsText = existingGoals.length > 0
      ? `Current goals:\n${existingGoals.map(goal => 
          `- ${goal.name} (${goal.progress}% complete${goal.targetDate ? `, target: ${goal.targetDate}` : ''})`
        ).join('\n')}`
      : "The user currently has no active goals or habits.";

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI wellness assistant that helps identify potential goals and habits from journal entries.

          Based on the user's journal entries, suggest actionable goals or habits that would support their wellness journey.

          Guidelines:
          - Suggest 3-5 items in total
          - Classify each as either a 'goal' (one-time achievement) or 'habit' (recurring activity)
          - Goals should be specific, measurable, achievable, relevant, and time-bound
          - Habits should be concrete daily or weekly actions
          - Add a brief description of why this would be beneficial
          - Avoid suggesting goals/habits the user already has
          - Base suggestions on the user's actual journal content, not generic advice
          - Use the most relevant information from all provided entries

          Return a JSON object with a 'goals' array containing objects with:
          - 'name': short title (5-7 words max)
          - 'type': either 'goal' or 'habit'
          - 'description': 1-2 sentence explanation of the benefit`
        },
        {
          role: "user",
          content: `Here are my recent journal entries:\n\n${entriesText}${similarEntriesText}\n\n${existingGoalsText}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0].message.content || '{"goals":[]}';
    return JSON.parse(content);
  } catch (error) {
    console.error("Error generating goal suggestions:", error);
    return { goals: [] };
  }
}

// Generate task suggestions based on journal entries
export async function generateTaskSuggestions(
  recentEntries: { content: string; date: string }[],
  existingTasks: { title: string; completed: boolean }[] = [],
  existingGoals: { name: string; progress: number }[] = []
): Promise<{ tasks: { name: string; description: string }[]; goalSuggestions: { name: string; description: string; relatedTasks: string[] }[] }> {
  try {
    // Extract the content of the journal entries
    const entriesText = recentEntries
      .map(entry => `Entry from ${new Date(entry.date).toDateString()}: ${entry.content}`)
      .join("\n\n");

    const existingTasksText = existingTasks.length > 0
      ? `Current tasks:\n${existingTasks.map(task => 
          `- ${task.title} (${task.completed ? 'Completed' : 'Pending'})`
        ).join('\n')}`
      : "The user currently has no active tasks.";

    const existingGoalsText = existingGoals.length > 0
      ? `Current goals:\n${existingGoals.map(goal => 
          `- ${goal.name} (Progress: ${goal.progress}%)`
        ).join('\n')}`
      : "The user currently has no active goals.";

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI wellness assistant that helps identify actionable tasks and meaningful goals from journal entries.

          Based on the user's journal entries, suggest:
          1. Short-term, discrete tasks that would support their wellness journey
          2. Potential goals that could connect multiple tasks under a common purpose

          For TASKS - Guidelines:
          - Suggest 4-6 tasks in total
          - Tasks should be specific, immediate actions that can be completed in a single sitting
          - Each task should be concrete and achievable within 1-2 days
          - Add a brief description of why this would be beneficial
          - Avoid suggesting tasks the user already has
          - Base suggestions on the user's actual journal content, not generic advice
          - Tasks should be simpler and more immediate than goals

          For categorization, use these criteria:

    TASKS are:
    - Single actions that can be completed quickly (within a few hours)
    - Concrete, specific activities
    - Examples: writing a blog post, attending an event, booking an appointment
    
    GOALS are:
    - Larger achievements requiring multiple tasks/actions
    - Take longer to complete (days/weeks/months)
    - Usually need a series of steps to accomplish
    - Examples: learning a new skill, planning software architecture, securing funding
    
    Guidelines:
    - Suggest 2-3 meaningful goals based on journal context
    - For each goal, include 2-4 related tasks that would help accomplish it
    - Ensure suggestions align with the categorization criteria above
    - Avoid suggesting goals the user already has

          Return a JSON object with:
          1. 'tasks' array containing objects with:
             - 'name': short title (5-7 words max)
             - 'description': 1-2 sentence explanation of the benefit
          2. 'goalSuggestions' array containing objects with:
             - 'name': short goal title (3-7 words)
             - 'description': brief explanation of the goal's importance
             - 'relatedTasks': array of short task names that would contribute to this goal`
        },
        {
          role: "user",
          content: `Here are my recent journal entries:\n\n${entriesText}\n\n${existingTasksText}\n\n${existingGoalsText}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0].message.content || '{"tasks":[], "goalSuggestions":[]}';
    return JSON.parse(content);
  } catch (error) {
    console.error("Error generating task suggestions:", error);
    return { tasks: [], goalSuggestions: [] };
  }
}