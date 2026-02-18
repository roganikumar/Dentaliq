// src/services/aiService.js
// Calls the Python FastAPI AI microservice.
// Falls back to a deterministic mock if AI_SERVICE_URL is not set.

const MOCK_RESPONSES = [
  "That's a great question! For optimal dental health, make sure to brush twice daily with fluoride toothpaste, floss at least once a day, and visit your dentist every six months for professional cleanings. A balanced diet low in sugary and acidic foods also plays a significant role.",
  "Based on the patient's history, I recommend maintaining the current oral hygiene regimen. Continue monitoring for any changes in sensitivity or discomfort, and ensure follow-up appointments are kept as scheduled.",
  "For this concern, it's important to stay well-hydrated and avoid foods that trigger sensitivity. Using a desensitizing toothpaste can help, and your dentist may recommend a fluoride varnish treatment at your next visit.",
  "Prevention is always the best approach in dental care. Regular check-ups allow us to catch issues early before they become more complex. Please ensure any prescribed medications are taken as directed and don't hesitate to call the clinic if symptoms worsen.",
];

let mockIndex = 0;

/**
 * Build the prompt for the AI service
 */
const buildPatientContext = (patientContext, history) => {
  const lines = [];
  if (patientContext?.name) lines.push(`Patient name: ${patientContext.name}`);
  if (patientContext?.dob) lines.push(`Date of birth: ${patientContext.dob}`);
  if (patientContext?.medical_notes) lines.push(`Medical notes: ${patientContext.medical_notes}`);
  return lines.join('\n');
};

/**
 * Call AI microservice or return mock
 * @param {{ message: string, patientContext: object, history: Array }} opts
 * @returns {Promise<string>} AI response text
 */
const generate = async ({ message, patientContext = {}, history = [] }) => {
  const aiUrl = process.env.AI_SERVICE_URL;

  if (!aiUrl) {
    // Mock mode — deterministic rotation
    const reply = MOCK_RESPONSES[mockIndex % MOCK_RESPONSES.length];
    mockIndex++;
    return reply;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const response = await fetch(`${aiUrl}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        patient_context: buildPatientContext(patientContext, history),
        history: history.map(h => ({ role: h.role, content: h.content })),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`AI service returned ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    return data.reply || data.response || data.text || 'No response from AI service.';
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = { generate };
