import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Chat response generation
export async function generateAIResponse(
  userMessage: string,
  conversationHistory: { role: "user" | "ai"; content: string }[],
  username: string
): Promise<string> {
  try {
    const messages = [
      {
        role: "system",
        content: `You are an empathetic AI journal assistant for an app called HopeLog AI. 
        Your purpose is to help ${username} with mental wellness through supportive conversation.
        Be warm, thoughtful, and encouraging. Ask insightful questions that promote self-reflection.
        Respond in a conversational, yet helpful manner. Keep responses concise (1-3 sentences).
        Never claim to be a therapist or provide medical advice - suggest professional help if necessary.`,
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
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a sentiment analysis expert. Analyze the text and provide a sentiment score from 1 to 5 (1 being very negative, 5 being very positive), a list of the top 3 emotions expressed, and a list of up to 3 key themes. Respond with JSON only.",
        },
        {
          role: "user",
          content: text,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || '{"score":3,"emotions":[],"themes":[]}';
    const result = JSON.parse(content);

    return {
      score: Math.max(1, Math.min(5, Math.round(result.score))),
      emotions: result.emotions || [],
      themes: result.themes || [],
    };
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    return {
      score: 3, // Neutral fallback
      emotions: ["unknown"],
      themes: ["unknown"],
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
