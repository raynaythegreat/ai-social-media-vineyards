import OpenAI from 'openai';
import fs from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function analyzeImage(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a social media expert for vineyards and wineries. Analyze the image and create engaging social media content.
        
Return JSON in this exact format:
{
  "description": "Brief description of what's in the image",
  "instagram_caption": "Instagram caption with emojis, engaging tone, 150-200 chars",
  "facebook_caption": "Facebook post, longer format, storytelling style, 200-300 chars",
  "twitter_caption": "Twitter post, concise and punchy, under 280 chars",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"],
  "story_ideas": ["Story idea 1", "Story idea 2", "Story idea 3"]
}

Make the content engaging, authentic to wine culture, and suitable for a Santa Maria Valley vineyard.`
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`
            }
          },
          {
            type: "text",
            text: "Create social media content for this vineyard photo."
          }
        ]
      }
    ],
    max_tokens: 1000,
    response_format: { type: "json_object" }
  });

  return JSON.parse(response.choices[0].message.content);
}

export async function generateStoryIdeas(eventType) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a creative social media strategist for vineyards."
      },
      {
        role: "user",
        content: `Generate 5 creative Instagram story ideas for a vineyard event type: "${eventType}". 
        
Return as a JSON array of strings, each 1-2 sentences describing a story concept.

Example for "Harvest":
[
  "Time-lapse of grapes being picked from sunrise to sunset",
  "Interview with our winemaker about this year's harvest",
  "Behind-the-scenes of crush and destemming process",
  "Tasting notes from freshly pressed grape juice",
  "Meet our harvest crew and their favorite wine pairings"
]`
      }
    ],
    max_tokens: 500,
    response_format: { type: "json_object" }
  });

  const result = JSON.parse(response.choices[0].message.content);
  return result.story_ideas || result;
}
