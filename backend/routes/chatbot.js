const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const axios = require('axios');

// Rate limiting for chatbot: 30 requests per minute per IP
const chatbotLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.'
  }
});

// Health-related keywords for content filtering
const healthKeywords = [
  'health', 'medical', 'doctor', 'medicine', 'hospital', 'clinic', 'treatment',
  'diagnosis', 'symptom', 'disease', 'condition', 'pain', 'fever', 'cough',
  'headache', 'blood pressure', 'bp', 'hypertension', 'hypotension', 'diabetes', 
  'diabetic', 'hypertensive', 'cancer', 'heart', 'lungs', 'prescription', 'drug', 
  'medication', 'therapy', 'surgery', 'test', 'lab', 'x-ray', 'mri', 'checkup', 
  'vaccination', 'immunity', 'allergy', 'nutrition', 'diet', 'exercise', 'fitness', 
  'mental health', 'stress', 'anxiety', 'depression', 'sleep', 'weight', 'obesity', 
  'cholesterol', 'first aid', 'emergency', 'ambulance', 'pharmacy', 'nurse', 
  'specialist', 'cardiologist', 'physician', 'dose', 'ointment', 'syrup', 'flu', 
  'covid', 'vaccine', 'infection', 'bone', 'muscle', 'joint', 'brain', 'vision', 
  'dental', 'stomach', 'digestion', 'heartbeat', 'sugar', 'glucose', 'insulin', 
  'patient', 'appointment', 'scanning', 'rehab', 'healing', 'wellness', 'hygiene', 
  'wound', 'injury', 'fracture', 'trauma', 'sore', 'nausea', 'vomit', 'dizziness', 
  'seizure', 'spasm', 'allergen', 'fatigue', 'skin', 'rash', 'itch', 'period', 
  'pregnancy', 'menstrual', 'cold', 'sinus', 'sneeze', 'abdominal', 'gastric', 
  'acidity', 'vitamin', 'supplement', 'physiotherapy', 'dentist', 'eye', 'ear', 
  'nose', 'throat', 'cardio', 'respiratory', 'orthopedic', 'pediatric',
  'weakness', 'tired', 'tiredness', 'exhaustion', 'breathing', 'breathless', 
  'swelling', 'inflammation', 'infection', 'bleeding', 'injury', 'wound',
  'burn', 'allergy', 'allergic', 'toxic', 'poison', 'emergency', 'hba1c'
];

// Check if query is health-related
const isHealthRelated = (query) => {
  if (!query || typeof query !== 'string') return false;
  const lowerQuery = query.toLowerCase();
  return healthKeywords.some(keyword => lowerQuery.includes(keyword));
};

// Built-in Medical Knowledge Base for Zero-Downtime Fallback
const generateHealthcareFallback = (query) => {
  const q = query.toLowerCase();

  // 1. Emergency / Severe Cardiac / Breathing
  if (q.includes('chest pain') || q.includes('heart attack') || q.includes('stroke') || 
      (q.includes('breath') && (q.includes('short') || q.includes('hard') || q.includes('cannot')))) {
    return `Emergency Guidance:
- If experiencing severe chest pressure, radiating pain, sudden numbness, or extreme breathing difficulty, treat this as a medical emergency.
- Call emergency medical services (e.g. 911/112) immediately or proceed to the nearest MediCore emergency department.
- Keep the patient calm, seated upright, and do not attempt strenuous movements.
- Do not drive yourself to the hospital; await an ambulance or designated transport.

Note: I am an AI assistant. Please seek immediate emergency medical care.`;
  }

  // 2. Diabetes & Blood Sugar
  if (q.includes('sugar') || q.includes('glucose') || q.includes('diabetes') || q.includes('diabetic') || q.includes('insulin') || q.includes('hba1c')) {
    return `Guidance on Blood Sugar Management:
- Eat balanced meals with high-fiber foods, green leafy vegetables, and whole grains while avoiding refined carbohydrates.
- Avoid sugary beverages, processed sweets, and excessive fruit juices.
- Engage in at least 30 minutes of moderate exercise, such as brisk walking, on most days.
- Check your blood glucose levels regularly as advised by your healthcare provider and maintain consistent meal timings.
- Take prescribed medications or insulin strictly on schedule and stay well hydrated with water.

Note: I am an AI assistant. Please consult a qualified doctor for proper medical advice.`;
  }

  // 3. Blood Pressure & Hypertension
  if (q.includes('blood pressure') || q.includes('bp') || q.includes('hypertension') || q.includes('hypotension')) {
    return `Guidance on Blood Pressure:
- Limit dietary sodium by reducing table salt and processed or canned foods.
- Adopt the DASH dietary pattern rich in fruits, vegetables, whole grains, and lean proteins.
- Maintain regular cardiovascular activity such as walking or cycling for 30 minutes daily.
- Manage stress with daily deep breathing, meditation, and adequate restful sleep.
- Monitor your blood pressure at consistent times of day and keep a record for your physician.

Note: I am an AI assistant. Please consult a qualified doctor for proper medical advice.`;
  }

  // 4. Fever, Cold, Flu, Cough & Infections
  if (q.includes('fever') || q.includes('cold') || q.includes('cough') || q.includes('flu') || q.includes('sinus') || q.includes('sore throat') || q.includes('covid')) {
    return `Guidance for Fever and Respiratory Symptoms:
- Get adequate rest and drink plenty of warm fluids including water, soups, and herbal teas.
- Use warm saline gargles for throat irritation and steam inhalation for nasal congestion.
- Monitor body temperature with a digital thermometer and keep a record of readings.
- Use a lukewarm sponge bath to help reduce high fever safely.
- Seek immediate medical evaluation if the fever exceeds 102°F (39°C), lasts over 3 days, or is accompanied by chest pain or shortness of breath.

Note: I am an AI assistant. Please consult a qualified doctor for proper medical advice.`;
  }

  // 5. Headache & Migraine
  if (q.includes('headache') || q.includes('migraine') || q.includes('head pain')) {
    return `Guidance for Headaches:
- Rest in a quiet, dark, and well-ventilated room to reduce sensory triggers.
- Stay hydrated, as dehydration is one of the most common causes of headaches.
- Apply a cold or warm compress to the forehead or the back of your neck.
- Avoid prolonged screen time and practice gentle neck and shoulder stretches.
- Consult a doctor urgently if the headache is sudden, unusually severe ("thunderclap"), or accompanied by vision loss, weakness, or fever.

Note: I am an AI assistant. Please consult a qualified doctor for proper medical advice.`;
  }

  // 6. Stomach, Digestion, Acidity, Nausea & Vomiting
  if (q.includes('stomach') || q.includes('acidity') || q.includes('gastric') || q.includes('gas') || 
      q.includes('nausea') || q.includes('vomit') || q.includes('diarrhea') || q.includes('constipation') || q.includes('digestion')) {
    return `Guidance for Digestive Health:
- Consume smaller, lighter meals and avoid lying down immediately after eating.
- Avoid spicy, oily, acidic, and fried foods that irritate the stomach lining.
- Stay well hydrated with water, oral rehydration solutions (ORS), or clear broths.
- Incorporate probiotics such as plain yogurt to support gut microbiome health.
- Seek medical attention if pain is severe, persistent, or accompanied by high fever or repeated vomiting.

Note: I am an AI assistant. Please consult a qualified doctor for proper medical advice.`;
  }

  // 7. Diet, Nutrition & Weight Management
  if (q.includes('diet') || q.includes('nutrition') || q.includes('weight') || q.includes('obesity') || q.includes('cholesterol') || q.includes('vitamin')) {
    return `Guidance for Diet and Nutrition:
- Focus on whole, unprocessed foods including vegetables, fruits, legumes, and lean proteins.
- Practice mindful portion control and replace sugary snacks with fresh fruits or nuts.
- Drink at least 2 to 3 liters of clean water daily to support metabolic function.
- Aim for at least 150 minutes of moderate exercise per week combined with strength training.
- Consult a certified dietitian or doctor for a tailored nutrition plan suited to your health profile.

Note: I am an AI assistant. Please consult a qualified doctor for proper medical advice.`;
  }

  // 8. Mental Health, Stress, Anxiety & Sleep
  if (q.includes('stress') || q.includes('anxiety') || q.includes('depress') || q.includes('sleep') || q.includes('insomnia') || q.includes('mental')) {
    return `Guidance for Mental Wellbeing and Sleep:
- Practice deep breathing exercises, mindfulness, or progressive muscle relaxation daily.
- Maintain a regular sleep schedule with 7 to 8 hours of sleep in a cool, quiet room.
- Limit screen time, caffeine, and heavy meals for at least one to two hours before bedtime.
- Stay physically active and stay connected with family, friends, or support networks.
- Reach out to a qualified counselor or mental health specialist for personalized guidance.

Note: I am an AI assistant. Please consult a qualified doctor for proper medical advice.`;
  }

  // 9. First Aid, Wounds, Burns & Injuries
  if (q.includes('wound') || q.includes('cut') || q.includes('burn') || q.includes('injury') || q.includes('bleed') || q.includes('sprain') || q.includes('fracture')) {
    return `First Aid Guidance:
- For minor cuts, rinse gently with clean water, apply mild antiseptic, and cover with a sterile bandage.
- For minor burns, hold the area under cool running tap water for 10 to 15 minutes; do not apply ice.
- For sprains or strains, follow the RICE method: Rest, Ice, Compression, and Elevation.
- Apply direct, steady pressure with a clean cloth to control bleeding.
- Seek immediate emergency medical care for deep lacerations, uncontrolled bleeding, suspected fractures, or severe burns.

Note: I am an AI assistant. Please consult a qualified doctor for proper medical advice.`;
  }

  // 10. Hospital Services & Appointments
  if (q.includes('appointment') || q.includes('doctor') || q.includes('hospital') || q.includes('service') || q.includes('test') || q.includes('lab')) {
    return `MediCore Hospital Services Information:
- You can book an appointment with our specialist physicians through the MediCore portal or reception.
- MediCore offers comprehensive clinical departments including General Medicine, Cardiology, Orthopedics, and Pediatrics.
- Diagnostic lab tests, imaging, and routine health checkups are available through our central diagnostic center.
- Our 24/7 Emergency and Trauma unit is always open for urgent medical assistance.
- Please carry your existing medical reports and ID when visiting the hospital.

Note: I am an AI assistant. Please consult a qualified doctor for proper medical advice.`;
  }

  // 11. General Healthcare Guidance
  return `General Healthcare Guidance:
- Maintain daily hydration by drinking adequate water throughout the day.
- Follow a balanced, nutrient-rich diet and aim for 7 to 8 hours of restorative sleep.
- Stay physically active with daily moderate exercise to support immune and cardiovascular health.
- Keep track of any recurring symptoms, their triggers, and changes over time.
- Schedule a consultation with a MediCore physician for a comprehensive health evaluation.

Note: I am an AI assistant. Please consult a qualified doctor for proper medical advice.`;
};

// System prompt enforcing MediCore medical persona and formatting
const SYSTEM_PROMPT = `You are a dedicated Healthcare and Medical Assistant for the MediCore Hospital Management System. 
  
CRITICAL RULE: You MUST ONLY answer questions regarding healthcare, medicine, health advice, hospital operations, or wellness. 

Response Style:
1. Keep responses SHORT and CONCISE — maximum 3 to 5 sentences per point.
2. Use brief bullet points or numbered lists when listing things, but keep each point to one short sentence.
3. Do NOT write long paragraphs or essays. Be direct and to the point.
4. Do NOT use markdown bold (** **) or any special formatting. Write in plain, clean text.

Strict Limitations:
1. DO NOT answer questions about general knowledge, history, politics, sports, entertainment, technology (unrelated to health), or any other non-healthcare topics.
2. If the user asks a non-healthcare question, politely decline and state: "I am specialized only in healthcare-related topics. Please ask me questions about health, medical conditions, doctors, medicines, or MediCore hospital services."
3. Always end with a short disclaimer: "Note: I am an AI assistant. Please consult a qualified doctor for proper medical advice."
4. Never provide specific prescriptions or dosages.
5. For emergencies, tell the user to contact emergency services immediately.

Remember: If it's not about health, medicine, or the hospital, DO NOT answer it. Keep it brief.`;

// Single model call with tight timeout
const callOpenRouterModel = async (query, apiKey, model, timeoutMs = 3500) => {
  const baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

  const response = await axios.post(
    `${baseURL}/chat/completions`,
    {
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: query }
      ],
      temperature: 0.3,
      max_tokens: 300
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.SITE_URL || 'http://localhost:5000',
        'X-Title': 'MediCore HMS',
        'Content-Type': 'application/json'
      },
      timeout: timeoutMs
    }
  );

  const content = response.data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    throw new Error(`Empty response from model ${model}`);
  }
  return content.trim();
};

// Fast Multi-Model AI Cascade with Zero-Downtime Fallback
const generateAIResponse = async (query) => {
  const primaryKey = process.env.OPENROUTER_API_KEY_PRIMARY || process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY_PRIMARY;
  const backupKey = process.env.OPENROUTER_API_KEY_BACKUP || process.env.GROQ_API_KEY_BACKUP;

  // Candidate models in order of priority (fastest, most responsive free models)
  const candidateModels = [
    process.env.OPENROUTER_MODEL,
    'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
    'nex-agi/nex-n2.5-mini:free',
    'nex-agi/nex-n2.5-pro:free',
    'liquid/lfm-2.5-2.6b:free'
  ].filter((m, i, arr) => m && arr.indexOf(m) === i);

  const keysToTry = [primaryKey, backupKey].filter(Boolean);

  if (keysToTry.length > 0) {
    for (const key of keysToTry) {
      for (const model of candidateModels) {
        try {
          const content = await callOpenRouterModel(query, key, model, 3500);
          return { response: content, source: 'ai', model };
        } catch (err) {
          console.warn(`[Chatbot] Model ${model} failed (${err.message || 'error'}). Trying next fallback...`);
        }
      }
    }
  }

  // If all external AI models fail, time out, or keys are missing:
  // Use our built-in medical intelligence engine to guarantee 100% uptime with 0 downtime
  console.log('[Chatbot] All external AI models timed out or failed. Serving verified Medical Fallback Engine.');
  const fallbackResponse = generateHealthcareFallback(query);
  return { response: fallbackResponse, source: 'fallback', model: 'medicore-expert-engine' };
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

    // Check if message is health-related
    if (!isHealthRelated(message)) {
      return res.json({
        success: true,
        data: {
          response: "I am restricted to healthcare-related topics only. Please ask me questions about health, medical conditions, doctors, medicines, or MediCore hospital services.",
          isHealthRelated: false,
          source: 'guardrail'
        }
      });
    }

    // Generate response with zero downtime guarantee
    const result = await generateAIResponse(message);

    res.json({
      success: true,
      data: {
        response: result.response,
        isHealthRelated: true,
        source: result.source,
        model: result.model
      }
    });
  } catch (error) {
    console.error('Chatbot unexpected error:', error);
    // Even in case of unexpected exception, guarantee response
    const safeFallback = generateHealthcareFallback(req.body?.message || '');
    res.json({
      success: true,
      data: {
        response: safeFallback,
        isHealthRelated: true,
        source: 'emergency-fallback'
      }
    });
  }
});

// Get chatbot status
router.get('/status', async (req, res) => {
  try {
    const primaryKey = process.env.OPENROUTER_API_KEY_PRIMARY || process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY_PRIMARY;
    const backupKey = process.env.OPENROUTER_API_KEY_BACKUP || process.env.GROQ_API_KEY_BACKUP;

    const status = {
      isAvailable: true,
      hasPrimaryKey: !!primaryKey,
      hasBackupKey: !!backupKey,
      hasMedicalFallbackEngine: true,
      model: process.env.OPENROUTER_MODEL || 'nex-agi/nex-n2.5-mini:free',
      rateLimit: {
        windowMs: 60000,
        maxRequests: 30
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
router.get('/topics', async (req, res) => {
  try {
    const topics = [
      "Blood sugar and diabetes control",
      "Blood pressure and hypertension tips",
      "Common symptoms and when to see a doctor",
      "Fever, cough, and cold care",
      "Preventive care and regular checkups",
      "Nutrition and balanced diet advice",
      "Digestive health and acidity relief",
      "Mental health, stress, and sleep",
      "First aid and emergency care",
      "Hospital appointments and doctors"
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
