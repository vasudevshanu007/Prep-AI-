const CodingProblem = require('../models/CodingProblem');
const DSASheet      = require('../models/DSASheet');
const UserProgress  = require('../models/UserProgress');
const Contest       = require('../models/Contest');

// ── Static roadmap definitions ─────────────────────────────────────────────────
const ROADMAPS = [
  {
    id: 'beginner',
    name: 'Beginner Path',
    description: 'Build your DSA foundation from scratch',
    color: '#22c55e',
    estimatedWeeks: 8,
    topics: [
      { name: 'Arrays & Strings',          weeks: '1–2', difficulty: 'easy',   sheetTag: 'beginner' },
      { name: 'Recursion Basics',           weeks: '3',   difficulty: 'easy',   sheetTag: 'beginner' },
      { name: 'Linked Lists',               weeks: '4',   difficulty: 'easy',   sheetTag: 'beginner' },
      { name: 'Stack & Queue',              weeks: '5',   difficulty: 'easy',   sheetTag: 'beginner' },
      { name: 'Binary Search',              weeks: '6',   difficulty: 'easy',   sheetTag: 'beginner' },
      { name: 'Basic Trees',                weeks: '7',   difficulty: 'easy',   sheetTag: 'beginner' },
      { name: 'Intro to Dynamic Programming', weeks: '8', difficulty: 'easy',   sheetTag: 'beginner' },
    ],
  },
  {
    id: 'intermediate',
    name: 'Intermediate Path',
    description: 'Level up with advanced patterns',
    color: '#f59e0b',
    estimatedWeeks: 12,
    topics: [
      { name: 'Two Pointers & Sliding Window', weeks: '1–2', difficulty: 'medium' },
      { name: 'Heaps & Priority Queues',       weeks: '3',   difficulty: 'medium' },
      { name: 'Advanced Trees & BST',          weeks: '4–5', difficulty: 'medium' },
      { name: 'Graphs: BFS & DFS',             weeks: '6–7', difficulty: 'medium' },
      { name: 'DP Patterns',                   weeks: '8–9', difficulty: 'medium' },
      { name: 'Tries',                         weeks: '10',  difficulty: 'medium' },
      { name: 'Greedy Algorithms',             weeks: '11',  difficulty: 'medium' },
      { name: 'Bit Manipulation',              weeks: '12',  difficulty: 'medium' },
    ],
  },
  {
    id: 'faang',
    name: 'FAANG Track',
    description: 'Crack Google, Meta, Amazon, Apple, Netflix',
    color: '#6366f1',
    estimatedWeeks: 16,
    topics: [
      { name: 'Arrays, Hashing & Two Pointers', weeks: '1–2' },
      { name: 'Trees & Graphs',                 weeks: '3–5' },
      { name: 'Dynamic Programming',            weeks: '6–8' },
      { name: 'System Design Basics',           weeks: '9–10' },
      { name: 'Advanced Algorithms',            weeks: '11–12' },
      { name: 'Mock Interviews & Review',       weeks: '13–16' },
    ],
  },
  {
    id: 'service',
    name: 'Service Company Track',
    description: 'Target TCS, Infosys, Wipro, Cognizant',
    color: '#06b6d4',
    estimatedWeeks: 6,
    topics: [
      { name: 'Basic Data Structures', weeks: '1–2', difficulty: 'easy' },
      { name: 'Sorting & Searching',   weeks: '3',   difficulty: 'easy' },
      { name: 'Aptitude & Patterns',   weeks: '4',   difficulty: 'easy' },
      { name: 'OOP & OS Concepts',     weeks: '5',   difficulty: 'easy' },
      { name: 'HR & Behavioral Prep',  weeks: '6',   difficulty: 'easy' },
    ],
  },
  {
    id: 'startup',
    name: 'Startup Track',
    description: 'Target fast-growing startups and unicorns',
    color: '#ec4899',
    estimatedWeeks: 10,
    topics: [
      { name: 'Core DSA Problems',              weeks: '1–3' },
      { name: 'Problem Solving Speed',          weeks: '4–5' },
      { name: 'System Design Fundamentals',     weeks: '6–7' },
      { name: 'Real-world Problem Solving',     weeks: '8–9' },
      { name: 'Behavioral & Culture Fit',       weeks: '10' },
    ],
  },
];

// ── Sheets ────────────────────────────────────────────────────────────────────
const getSheets = async (req, res, next) => {
  try {
    const sheets = await DSASheet.find({ isActive: true })
      .select('-categories')
      .sort({ totalProblems: -1 })
      .lean();
    res.json({ success: true, sheets });
  } catch (err) { next(err); }
};

const getSheetBySlug = async (req, res, next) => {
  try {
    const sheet = await DSASheet.findOne({ slug: req.params.slug, isActive: true }).lean();
    if (!sheet) return res.status(404).json({ success: false, message: 'Sheet not found.' });

    const allSlugs = sheet.categories.flatMap(c => c.problemSlugs);
    const problems = await CodingProblem.find({ slug: { $in: allSlugs }, isActive: true })
      .select('slug title difficulty topic topics companies sheetTags source externalUrl frequencyScore solveCount attemptCount')
      .lean();

    const problemMap = Object.fromEntries(problems.map(p => [p.slug, p]));

    let progressMap = {};
    if (req.user?._id) {
      const ids = problems.map(p => p._id);
      const progresses = await UserProgress.find({ userId: req.user._id, problemId: { $in: ids } })
        .select('problemId status bookmarked bestScore').lean();
      progresses.forEach(pr => { progressMap[pr.problemId.toString()] = pr; });
    }

    const categoriesEnriched = sheet.categories.map((cat, ci) => ({
      _id:  cat._id,
      name: cat.name,
      description: cat.description,
      order: cat.order ?? ci,
      problems: cat.problemSlugs.map((slug, i) => {
        const p = problemMap[slug];
        if (!p) return null;
        const pr = progressMap[p._id.toString()];
        return { ...p, order: i + 1, status: pr?.status || 'unsolved', bookmarked: pr?.bookmarked || false };
      }).filter(Boolean),
    }));

    const solved   = categoriesEnriched.flatMap(c => c.problems).filter(p => p.status === 'solved').length;
    const total    = categoriesEnriched.flatMap(c => c.problems).length;

    res.json({ success: true, sheet: { ...sheet, categories: categoriesEnriched, solvedCount: solved, accessibleCount: total } });
  } catch (err) { next(err); }
};

// ── Progress ─────────────────────────────────────────────────────────────────
const getUserProgress = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const [allProblems, progressList] = await Promise.all([
      CodingProblem.find({ isActive: true }).select('difficulty topic companies sheetTags').lean(),
      UserProgress.find({ userId }).select('problemId status bookmarked').lean(),
    ]);

    const progressMap = Object.fromEntries(progressList.map(p => [p.problemId.toString(), p]));

    let solved = 0, attempted = 0;
    let easySolved = 0, mediumSolved = 0, hardSolved = 0;
    const topicMap = {}, companyMap = {}, sheetMap = {};

    for (const p of allProblems) {
      const st = progressMap[p._id.toString()]?.status || 'unsolved';
      if (st === 'solved')   { solved++;   }
      if (st === 'attempted') attempted++;
      if (st === 'solved') {
        if (p.difficulty === 'easy')   easySolved++;
        else if (p.difficulty === 'medium') mediumSolved++;
        else                           hardSolved++;
      }
      const t = p.topic;
      if (!topicMap[t]) topicMap[t] = { total: 0, solved: 0, attempted: 0 };
      topicMap[t].total++;
      if (st === 'solved')    topicMap[t].solved++;
      if (st === 'attempted') topicMap[t].attempted++;

      (p.companies || []).forEach(c => {
        if (!companyMap[c]) companyMap[c] = { total: 0, solved: 0 };
        companyMap[c].total++;
        if (st === 'solved') companyMap[c].solved++;
      });
      (p.sheetTags || []).forEach(s => {
        if (!sheetMap[s]) sheetMap[s] = { total: 0, solved: 0 };
        sheetMap[s].total++;
        if (st === 'solved') sheetMap[s].solved++;
      });
    }

    const total = allProblems.length;

    res.json({
      success: true,
      progress: {
        overview: {
          total, solved, attempted, unsolved: total - solved - attempted,
          solvedPct: total ? Math.round((solved / total) * 100) : 0,
          easySolved, mediumSolved, hardSolved,
          bookmarked: progressList.filter(p => p.bookmarked).length,
        },
        topicBreakdown: Object.entries(topicMap).map(([name, d]) => ({
          name, ...d, mastery: d.total ? Math.round((d.solved / d.total) * 100) : 0,
        })).sort((a, b) => b.mastery - a.mastery),
        companyReadiness: Object.entries(companyMap).map(([name, d]) => ({
          name, ...d, readiness: d.total ? Math.round((d.solved / d.total) * 100) : 0,
        })).sort((a, b) => b.readiness - a.readiness),
        sheetProgress: Object.entries(sheetMap).map(([name, d]) => ({
          name, ...d, completion: d.total ? Math.round((d.solved / d.total) * 100) : 0,
        })),
      },
    });
  } catch (err) { next(err); }
};

// ── Search / list problems ────────────────────────────────────────────────────
const searchProblems = async (req, res, next) => {
  try {
    const { q = '', difficulty, topic, company, sheet, source, page = 1, limit = 50 } = req.query;

    const filter = { isActive: true };
    if (difficulty) filter.difficulty = difficulty;
    if (topic)   filter.topic = { $regex: topic, $options: 'i' };
    if (company) filter.companies = company;
    if (sheet)   filter.sheetTags = sheet;
    if (source)  filter.source = source;
    if (q) filter.$or = [
      { title:       { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { topic:       { $regex: q, $options: 'i' } },
    ];

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [problems, total] = await Promise.all([
      CodingProblem.find(filter)
        .sort({ order: 1, frequencyScore: -1 })
        .skip(skip).limit(parseInt(limit))
        .select('slug title difficulty topic topics companies sheetTags source externalUrl frequencyScore solveCount attemptCount')
        .lean(),
      CodingProblem.countDocuments(filter),
    ]);

    let progressMap = {};
    if (req.user?._id) {
      const ids = problems.map(p => p._id);
      const prs = await UserProgress.find({ userId: req.user._id, problemId: { $in: ids } })
        .select('problemId status bookmarked').lean();
      prs.forEach(pr => { progressMap[pr.problemId.toString()] = pr; });
    }

    const results = problems.map(p => ({
      ...p,
      status:     progressMap[p._id.toString()]?.status     || 'unsolved',
      bookmarked: progressMap[p._id.toString()]?.bookmarked || false,
    }));

    res.json({
      success: true,
      problems: results,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) { next(err); }
};

// ── Topics & companies (dropdowns) ────────────────────────────────────────────
const getTopics = async (req, res, next) => {
  try {
    const topics = await CodingProblem.distinct('topic', { isActive: true });
    res.json({ success: true, topics: topics.sort() });
  } catch (err) { next(err); }
};

const getCompanies = async (req, res, next) => {
  try {
    const companies = await CodingProblem.distinct('companies', { isActive: true });
    res.json({ success: true, companies: companies.sort() });
  } catch (err) { next(err); }
};

// ── Bookmarks ─────────────────────────────────────────────────────────────────
const toggleBookmark = async (req, res, next) => {
  try {
    const { problemId } = req.params;
    const exists = await CodingProblem.exists({ _id: problemId });
    if (!exists) return res.status(404).json({ success: false, message: 'Problem not found.' });

    const current = await UserProgress.findOne({ userId: req.user._id, problemId }).select('bookmarked');
    const newVal = !(current?.bookmarked ?? false);

    await UserProgress.findOneAndUpdate(
      { userId: req.user._id, problemId },
      { $set: { bookmarked: newVal } },
      { upsert: true }
    );
    res.json({ success: true, bookmarked: newVal });
  } catch (err) { next(err); }
};

const getBookmarks = async (req, res, next) => {
  try {
    const bms = await UserProgress.find({ userId: req.user._id, bookmarked: true })
      .populate('problemId', 'slug title difficulty topic companies source externalUrl')
      .select('problemId')
      .lean();
    res.json({ success: true, bookmarks: bms.map(b => b.problemId).filter(Boolean) });
  } catch (err) { next(err); }
};

// ── Roadmaps (static) ─────────────────────────────────────────────────────────
const getRoadmaps = (_req, res) => res.json({ success: true, roadmaps: ROADMAPS });

// ── Contests ──────────────────────────────────────────────────────────────────
const getContests = async (req, res, next) => {
  try {
    const now = new Date();
    const { type = 'all' } = req.query;
    const filter = { isPublished: true };
    if (type === 'upcoming') filter.startTime = { $gt: now };
    else if (type === 'active') { filter.startTime = { $lte: now }; filter.endTime = { $gt: now }; }
    else if (type === 'past')   filter.endTime = { $lte: now };

    const contests = await Contest.find(filter)
      .select('-participants -leaderboard')
      .populate('problems', 'title difficulty')
      .sort({ startTime: type === 'past' ? -1 : 1 })
      .limit(20).lean();

    res.json({ success: true, contests });
  } catch (err) { next(err); }
};

const getContestDetail = async (req, res, next) => {
  try {
    const contest = await Contest.findOne({ slug: req.params.slug, isPublished: true })
      .populate('problems', 'slug title difficulty topic')
      .select('-participants')
      .lean();
    if (!contest) return res.status(404).json({ success: false, message: 'Contest not found.' });

    const isRegistered = !!(await UserProgress.exists({
      userId: req.user._id,
      // just check if user has any progress — contest registration not tracked in UserProgress
    }));

    res.json({ success: true, contest });
  } catch (err) { next(err); }
};

const getContestLeaderboard = async (req, res, next) => {
  try {
    const contest = await Contest.findOne({ slug: req.params.slug })
      .select('leaderboard title slug')
      .populate('leaderboard.userId', 'name avatar')
      .lean();
    if (!contest) return res.status(404).json({ success: false, message: 'Contest not found.' });
    res.json({ success: true, leaderboard: contest.leaderboard || [] });
  } catch (err) { next(err); }
};

// ── Recommendations ───────────────────────────────────────────────────────────
const getRecommendations = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { targetCompany } = req.query;

    const progressList = await UserProgress.find({ userId }).select('problemId status').lean();
    const solvedIds   = progressList.filter(p => p.status === 'solved').map(p => p.problemId.toString());
    const doneIds     = progressList.map(p => p.problemId);

    // Find weak topics
    const allProblems = await CodingProblem.find({ isActive: true }).select('topic difficulty').lean();
    const topicTotal = {}, topicSolved = {};
    allProblems.forEach(p => { topicTotal[p.topic] = (topicTotal[p.topic] || 0) + 1; });
    const solvedProblems = await CodingProblem.find({ _id: { $in: solvedIds }, isActive: true }).select('topic').lean();
    solvedProblems.forEach(p => { topicSolved[p.topic] = (topicSolved[p.topic] || 0) + 1; });

    const weakTopics = Object.keys(topicTotal)
      .filter(t => ((topicSolved[t] || 0) / topicTotal[t]) < 0.3)
      .sort((a, b) => (topicSolved[a] || 0) / topicTotal[a] - (topicSolved[b] || 0) / topicTotal[b])
      .slice(0, 3);

    const baseFilter = { isActive: true, _id: { $nin: doneIds } };

    const [nextEasy, nextMedium, weakProblems, companyProblems] = await Promise.all([
      CodingProblem.find({ ...baseFilter, difficulty: 'easy' })
        .sort({ frequencyScore: -1 }).limit(5)
        .select('slug title difficulty topic companies sheetTags source externalUrl').lean(),
      CodingProblem.find({ ...baseFilter, difficulty: 'medium' })
        .sort({ frequencyScore: -1 }).limit(5)
        .select('slug title difficulty topic companies sheetTags source externalUrl').lean(),
      weakTopics.length
        ? CodingProblem.find({ ...baseFilter, topic: { $in: weakTopics } })
            .sort({ difficulty: 1, frequencyScore: -1 }).limit(6)
            .select('slug title difficulty topic companies sheetTags source externalUrl').lean()
        : Promise.resolve([]),
      targetCompany
        ? CodingProblem.find({ ...baseFilter, companies: targetCompany })
            .sort({ frequencyScore: -1 }).limit(6)
            .select('slug title difficulty topic companies sheetTags source externalUrl').lean()
        : Promise.resolve([]),
    ]);

    res.json({
      success: true,
      recommendations: {
        easyPickups:     nextEasy,
        nextChallenges:  nextMedium,
        weakTopics:      { topics: weakTopics, problems: weakProblems },
        companySpecific: { company: targetCompany || null, problems: companyProblems },
      },
    });
  } catch (err) { next(err); }
};

module.exports = {
  getSheets, getSheetBySlug,
  getUserProgress, searchProblems,
  getTopics, getCompanies,
  toggleBookmark, getBookmarks,
  getRoadmaps,
  getContests, getContestDetail, getContestLeaderboard,
  getRecommendations,
};
