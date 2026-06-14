const { getTopKCandidates } = require('../utils/MaxHeap');
const Application = require('../models/Application');
const Job = require('../models/Job')
const { scoreResume } = require('../services/aiScorer');
// ─── SUBMIT APPLICATION ──────────────────────────────
const submitApplication = async (req, res) => {
    try {
        // 1. Only candidates can apply
        if (req.user.role !== 'candidate') {
            return res.status(403).json({ message: 'Only candidates can apply to jobs' });
        }
        const { jobId, resumeText, coverLetter } = req.body;
        if (!jobId || !resumeText || resumeText.trim().length < 50) {
            return res.status(400).json({ message: 'Missing fields or resume too short' });
        }
        // 2. Check the job exists and is still open
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        if (job.status === 'closed') {
            return res.status(400).json({ message: 'This job is no longer accepting applications' });
        }
        // 3. Prevent duplicate applications
        const existing = await Application.findOne({
            job: jobId,
            candidate: req.user.id,
        });
        if (existing) {
            return res.status(400).json({ message: 'You have already applied to this job' });
        }

        // ── NEW: Run AI scoring before saving ──────────────
        const aiResult = await scoreResume(
            resumeText,
            job.title,
            job.description,
            job.requirements
        );
        // 4. Create the application
        const application = await Application.create({
            job: jobId,
            candidate: req.user.id,
            resumeText,
            coverLetter,
            aiScore: aiResult.fitScore,
            aiVerdict: aiResult.verdict,
            aiStrengths: aiResult.strengths,
            aiWeaknesses: aiResult.weaknesses,
        });
        res.status(201).json({ message: 'Application submitted successfully', application });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// ─── GET APPLICATIONS FOR A JOB (recruiter) ──────────
const getApplicationsForJob = async (req, res) => {
    try {
        // Only recruiters can see applications
        if (req.user.role !== 'recruiter') {
            return res.status(403).json({ message: 'Only recruiters can view applications' });
        }
        const { jobId } = req.query;
        const job = await Job.findById(jobId);
        if (!job) return res.status(404).json({ message: 'Job not found' });
        if (job.recruiter.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view these applications' });
        }

        // jobId comes from the URL query: /api/applications?jobId=xxx
        const applications = await Application.find({ job: jobId })
            .populate('candidate', 'name email')
            .populate('job', 'title')
            .sort({ aiScore: -1 });
        res.json({ count: applications.length, applications });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// ─── GET RANKED CANDIDATES (heap sort) ───────────────
const getRankedCandidates = async (req, res) => {
    try {
        if (req.user.role !== 'recruiter') {
            return res.status(403).json({ message: 'Only recruiters can view ranked candidates' });
        }
        const { jobId } = req.query;
        const k = parseInt(req.query.k) || 10;
        // k = how many top candidates to return, default 10
        if (!jobId) {
            return res.status(400).json({ message: 'jobId is required' });
        }
        // Fetch all applications for this job
        const applications = await Application.find({ job: jobId })
            .populate('candidate', 'name email')
            .populate('job', 'title');
        // Note: no .sort() here — heap handles the sorting
        if (applications.length === 0) {
            return res.json({ count: 0, topCandidates: [] });
        }
        // Use max-heap to get top K candidates
        const topCandidates = getTopKCandidates(applications, k);
        res.json({
            totalApplicants: applications.length,
            showing: topCandidates.length,
            rankedBy: 'aiScore (max-heap)',
            topCandidates,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── GET MY APPLICATIONS (candidate) ─────────────────
const getMyApplications = async (req, res) => {
    try {
        const applications = await Application.find({ candidate: req.user.id })
            .populate('job', 'title location salary status')
            .sort({ createdAt: -1 });
        res.json({ count: applications.length, applications });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
module.exports = { submitApplication, getApplicationsForJob, getMyApplications, getRankedCandidates, };