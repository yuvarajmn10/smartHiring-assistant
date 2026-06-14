const model = require('../config/ai');

// Retry wrapper for transient Gemini errors (503, 429, overloaded)
const withRetry = async (fn, retries = 3, delayMs = 2000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            const isTransient = err.message?.includes('503') || err.message?.includes('429') || err.message?.includes('overloaded');
            if (isTransient && attempt < retries) {
                console.warn(`Gemini transient error (attempt ${attempt}/${retries}), retrying in ${delayMs}ms...`);
                await new Promise(res => setTimeout(res, delayMs));
            } else {
                throw err;
            }
        }
    }
};
const scoreResume = async (resumeText, jobTitle, jobDescription, jobRequirements) => {
    const prompt = `
You are an expert technical recruiter with 10 years of experience.
Evaluate the candidate's resume against the job posting below.
JOB TITLE: ${jobTitle}
JOB DESCRIPTION: ${jobDescription}
JOB REQUIREMENTS: ${jobRequirements.join(', ')}
CANDIDATE RESUME:
${resumeText}
Evaluate the candidate and respond with ONLY a valid JSON object.
No explanation. No markdown. No code blocks. Raw JSON only.
Use exactly this format:
{
"fitScore": 78,
// number 0-100. 80+ = strong match, 50-79 = partial, below 50 = weak
"verdict": "shortlist",
// exactly one of: "shortlist", "maybe", "reject"
"strengths": ["Strong React experience", "Good project portfolio"],
// array of 2-4 specific strengths from the resume
"weaknesses": ["No backend experience", "Missing system design skills"]
// array of 2-4 specific gaps vs the job requirements
}
`;
    try {
        const result = await withRetry(() => model.generateContent(prompt));
        const reply = result.response.text();
        // Strip markdown code blocks Gemini sometimes adds
        const cleaned = reply.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        // Validate the response has all required fields
        if (
            typeof parsed.fitScore !== 'number' ||
            !['shortlist', 'maybe', 'reject'].includes(parsed.verdict) ||
            !Array.isArray(parsed.strengths) ||
            !Array.isArray(parsed.weaknesses)
        ) {
            throw new Error('Invalid AI response format');
        }
        return parsed;
    } catch (error) {
        console.error('AI scoring failed:', error.message);
        // Return a safe fallback so the application still saves
        return {
            fitScore: null,
            verdict: null,
            strengths: [],
            weaknesses: [],
        };
    }
};

const generateInterviewQuestions = async (
    jobTitle,
    jobRequirements,
    candidateWeaknesses,
    candidateName
) => {
    const prompt = `
You are an expert technical interviewer.
Generate 5 targeted interview questions for a candidate applying for the role below.
Focus on probing their specific weak areas while also testing job requirements.
JOB TITLE: ${jobTitle}
JOB REQUIREMENTS: ${jobRequirements.join(', ')}
CANDIDATE NAME: ${candidateName}
CANDIDATE WEAK AREAS: ${candidateWeaknesses.join(', ')}
Rules:
- Each question must directly relate to a weak area or job requirement
- Questions should be specific, not generic
- Mix technical and situational questions
- Respond with ONLY a valid JSON array. No explanation. No markdown.
Format exactly like this:
[
{
"question": "How would you manage state across 10+ components without prop drilling?",
"targetedAt": "State management weakness",
"type": "technical"
},
{
"question": "Describe a time you had to learn a new backend technology quickly.",
"targetedAt": "Limited backend experience",
"type": "situational"
}
]
`;
    try {
        const result = await withRetry(() => model.generateContent(prompt));
        const reply = result.response.text();
        const cleaned = reply.replace(/```json|```/g, '').trim();
        const questions = JSON.parse(cleaned);
        // Make sure we got an array back
        if (!Array.isArray(questions)) {
            throw new Error('Expected an array of questions');
        }
        return questions;
    } catch (error) {
        console.error('Interview question generation failed:', error.message);
        return [];
        // Return empty array on failure — never crash the route
    }
};
module.exports = { scoreResume, generateInterviewQuestions };