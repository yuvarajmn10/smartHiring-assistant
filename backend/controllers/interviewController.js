const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const { generateInterviewQuestions } = require('../services/aiScorer');
const getInterviewQuestions = async (req, res) => {
    try {
        // Only recruiters can generate interview questions
        if (req.user.role !== 'recruiter') {
            return res.status(403).json({ message: 'Only recruiters can generate interview questions' });
        }
        const { applicationId } = req.params;
        // applicationId comes from the URL: /api/interview/:applicationId
        // 1. Fetch the application with job and candidate details
        const application = await Application.findById(applicationId)
            .populate('job', 'title requirements')
            .populate('candidate', 'name');
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }
        // 2. Check AI weaknesses exist — need them for targeted questions
        const weaknesses = application.aiWeaknesses.length > 0
            ? application.aiWeaknesses
            : ['General technical skills', 'Communication skills'];
        // Fallback if AI scoring didn't run — still generate generic questions
        // 3. Call Gemini to generate questions
        const questions = await generateInterviewQuestions(
            application.job.title,
            application.job.requirements,
            weaknesses,
            application.candidate.name
        );
        // 4. Return questions with candidate context
        res.json({
            candidate: application.candidate.name,
            jobTitle: application.job.title,
            aiScore: application.aiScore,
            aiVerdict: application.aiVerdict,
            weaknesses,
            questions,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
module.exports = { getInterviewQuestions };