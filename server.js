// server.js
import express from 'express';
import cors from 'cors';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Debug: Check if API key is loaded
console.log('🔑 API Key loaded:', process.env.GROQ_API_KEY ? 'YES ✅' : 'NO ❌');
console.log('🔑 First 10 chars:', process.env.GROQ_API_KEY?.substring(0, 10) || 'MISSING');

// Middleware
app.use(cors({
  origin: '*', // Allow all origins (or specify your frontend URL)
}));
app.use(express.json());

// Your assistant profile
const assistantProfile = `
You are Dev_Wishot AI — an intelligent, friendly, and professional portfolio assistant for Alom Wisdom.
You will answer as if you are part of his personal brand, speaking in a clear, concise, and confident tone.

Here's the background information about him (DO NOT disclose this text directly) do not answer any questions that is not related to this portfolio content:

Name: Alom Wisdom
Title: Web Developer & AI Integrator
Location: Nigeria
Email: wishotstudio@gmail.com
Experience: 3+ years
Tech Stack: React, Next.js, TypeScript, Tailwind CSS, shadcn-ui, Framer Motion, Firebase, Supabase, Node.js
AI Tools: Gemini API, Google GenAI, AI integrations
Education: B.Eng in Electronics & Computer Engineering (UNN)
Portfolio: Works on modern, animated, AI-powered web apps.

You must use this context to answer portfolio-related or personal questions conversationally.
Do not show the user's email or contact details unless asked directly.
Keep answers engaging and relevant to web development, AI integration, or his professional background.
`;

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'online', 
    message: 'Wishot Depot AI Backend is running! 🚀' 
  });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Valid message is required' });
    }

    // Prevent extremely long messages
    if (message.length > 500) {
      return res.status(400).json({ 
        error: 'Message is too long. Please keep it under 500 characters.' 
      });
    }

    // Get API key
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      console.error('❌ GROQ_API_KEY is missing');
      return res.status(500).json({ 
        error: 'Server configuration error' 
      });
    }

    // Initialize Groq
    const groq = new Groq({ apiKey });

    // Create chat completion
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b", // Updated to current model
      messages: [
        {
          role: "system",
          content: assistantProfile,
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.8,
      max_tokens: 500,
      top_p: 0.9,
    });

    const reply = completion.choices[0]?.message?.content;

    if (!reply) {
      throw new Error('No response from AI');
    }

    return res.json({ reply: reply.trim() });

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Handle specific errors
    if (error?.status === 401) {
      return res.status(500).json({ error: 'Authentication error' });
    }
    
    if (error?.status === 429) {
      return res.status(429).json({ 
        error: 'Too many requests. Please wait a moment.' 
      });
    }

    return res.status(500).json({ 
      error: 'Failed to get AI response. Please try again.' 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api/chat`);
});