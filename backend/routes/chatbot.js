const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting for chatbot
const chatbotLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests. Please try again later.'
  }
});

// Health-related and greeting keywords for content filtering
const allowedKeywords = [
  'hello', 'hi', 'hey', 'good morning', 'good evening', 'how are you', 'who are you', 'tell me about yourself',
  'health', 'medical', 'doctor', 'medicine', 'hospital', 'clinic', 'treatment',
  'diagnosis', 'symptom', 'disease', 'condition', 'pain', 'fever', 'cough',
  'headache', 'blood pressure', 'diabetes', 'cancer', 'heart', 'lungs',
  'prescription', 'drug', 'medication', 'therapy', 'surgery', 'test',
  'lab', 'x-ray', 'mri', 'checkup', 'vaccination', 'immunity', 'allergy',
  'nutrition', 'diet', 'exercise', 'fitness', 'mental health', 'stress',
  'anxiety', 'depression', 'sleep', 'weight', 'obesity', 'cholesterol',
  'first aid', 'emergency', 'ambulance', 'pharmacy', 'nurse', 'specialist',
  'cardiologist', 'physician', 'dose', 'ointment', 'syrup', 'flu', 'covid',
  'vaccine', 'infection', 'bone', 'muscle', 'joint', 'brain',
  'vision', 'dental', 'stomach', 'digestion', 'heartbeat', 'sugar', 'glucose',
  'insulin', 'patient', 'appointment', 'scanning', 'therapy', 'rehab', 'healing',
  'wellness', 'hygiene', 'wound', 'injury', 'fracture', 'trauma', 'sore',
  'nausea', 'vomit', 'dizziness', 'seizure', 'spasm', 'allergen', 'fatigue',
  'dengue', 'malaria', 'paracetamol', 'aspirin', 'ibuprofen', 'cold', 'sore throat'
];

// Check if query is allowed (health-related or greeting)
const isAllowedQuery = (query) => {
  const lowerQuery = query.toLowerCase();
  return allowedKeywords.some(keyword => lowerQuery.includes(keyword));
};

// Generate response using Groq API
const generateGroqResponse = async (query, apiKey) => {
  const Groq = require('groq-sdk');
  const groq = new Groq({ apiKey });

  const systemPrompt = `You are MediCore AI, a virtual assistant integrated into the MediCore Hospital Management System.

Your role is to help users ONLY with healthcare-related topics such as:
- hospitals and departments
- doctors and medical staff
- medicines
- diseases
- symptoms and signs of health problems
- basic health awareness

Response Rules:
1. All responses must be SHORT and written in BULLET POINTS (•).
2. Maximum 3–5 bullet points per answer.
3. Each bullet point must be one short sentence.
4. Always keep responses simple, clear, and easy to understand.
5. If the user greets you with "hello", "hi", "hey", "good morning", "good evening", "how are you", "who are you", or "tell me about yourself", respond with exactly these bullet points:
   • Hello! I am MediCore AI.
   • Your virtual hospital assistant.
   • I can help with diseases, symptoms, medicines, doctors, and hospital services.
6. If the user asks about diseases, answer in this format:
   Disease Name
   • Short description
   • Common symptom 1
   • Common symptom 2
   • Common symptom 3
   • Advice to consult a doctor
7. If the user asks about medicines, answer in this format:
   Medicine Name
   • What the medicine is used for
   • What condition it treats
   • Advice to consult a doctor before use
8. If the user asks something unrelated to healthcare (movies, coding, games, politics, jokes, etc.), respond with exactly these bullet points:
   • I can only assist with healthcare topics.
   • Please ask about hospitals, diseases, symptoms, medicines, or doctors.
9. Never give medical diagnosis or prescriptions.
10. Always maintain a polite and professional tone.

Always format responses using bullet points (•) and avoid long paragraphs.`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: query
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1, // Lower temperature for stricter adherence to rules
      max_tokens: 300
    });

    return chatCompletion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error('Groq API error:', error);
    throw error;
  }
};

// Chatbot endpoint
router.post('/chat', [
  body('message').notEmpty().trim().isLength({ max: 500 })
], chatbotLimiter, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { message } = req.body;

    // Check if message is allowed
    if (!isAllowedQuery(message)) {
      return res.json({
        success: true,
        data: {
          response: "• I can only assist with healthcare topics.\n• Please ask about hospitals, diseases, symptoms, medicines, or doctors.",
          isHealthRelated: false
        }
      });
    }

    let response;
    let usedBackupKey = false;

    // Try primary API key first
    try {
      response = await generateGroqResponse(message, process.env.GROQ_API_KEY_PRIMARY);
    } catch (primaryError) {
      console.error('Primary Groq API failed:', primaryError);

      // Try backup API key
      try {
        if (process.env.GROQ_API_KEY_BACKUP) {
          response = await generateGroqResponse(message, process.env.GROQ_API_KEY_BACKUP);
          usedBackupKey = true;
        } else {
          throw new Error('Backup API key not configured');
        }
      } catch (backupError) {
        console.error('Backup Groq API also failed:', backupError);
        return res.status(503).json({
          success: false,
          message: 'Chatbot service is temporarily unavailable. Please try again later.'
        });
      }
    }

    res.json({
      success: true,
      data: {
        response,
        isHealthRelated: true,
        usedBackupKey
      }
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing your request'
    });
  }
});

// Get chatbot status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const status = {
      isAvailable: !!(process.env.GROQ_API_KEY_PRIMARY || process.env.GROQ_API_KEY_BACKUP),
      hasPrimaryKey: !!process.env.GROQ_API_KEY_PRIMARY,
      hasBackupKey: !!process.env.GROQ_API_KEY_BACKUP,
      rateLimit: {
        windowMs: 60000, // 1 minute
        maxRequests: 10
      }
    };

    res.json({
      success: true,
      data: { status }
    });
  } catch (error) {
    console.error('Chatbot status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get health topics suggestions
router.get('/topics', authenticateToken, async (req, res) => {
  try {
    const topics = [
      "General health and wellness",
      "Common symptoms and when to see a doctor",
      "Preventive care and checkups",
      "Medication information",
      "Mental health awareness",
      "Nutrition and diet advice",
      "Exercise and fitness",
      "Chronic disease management",
      "First aid and emergency care",
      "Women's health",
      "Children's health",
      "Elderly care"
    ];

    res.json({
      success: true,
      data: { topics }
    });
  } catch (error) {
    console.error('Get topics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
