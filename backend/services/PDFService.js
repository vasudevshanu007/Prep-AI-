const PDFDocument = require('pdfkit');

// Color palette
const C = {
  bg:        '#0f172a',
  primary:   '#6366f1',
  success:   '#22c55e',
  warning:   '#eab308',
  danger:    '#ef4444',
  white:     '#ffffff',
  light:     '#e2e8f0',
  muted:     '#94a3b8',
  dark:      '#1e293b',
  border:    '#334155',
};

const scoreColor = (score) => {
  if (score >= 8) return C.success;
  if (score >= 6) return C.warning;
  return C.danger;
};

const scoreLabel = (score) => {
  if (score >= 9) return 'Excellent';
  if (score >= 8) return 'Great';
  if (score >= 7) return 'Good';
  if (score >= 6) return 'Average';
  if (score >= 5) return 'Below Average';
  return 'Needs Work';
};

// Generate a complete interview report PDF and return as Buffer
const generateInterviewReport = (interview, user) =>
  new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end',  () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const W = doc.page.width - 100; // usable width

      // ── Header ──────────────────────────────────────────────────────────────
      doc.rect(0, 0, doc.page.width, 100).fill(C.primary);
      doc.fillColor(C.white).font('Helvetica-Bold').fontSize(26).text('PrepAI', 50, 30);
      doc.font('Helvetica').fontSize(12).fillColor('#c7d2fe').text('AI-Powered Interview Report', 50, 60);
      doc.fillColor(C.white).text(new Date().toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' }), 0, 60, { align: 'right', width: doc.page.width - 50 });

      doc.moveDown(3);

      // ── Candidate info ───────────────────────────────────────────────────────
      doc.fillColor(C.light).font('Helvetica-Bold').fontSize(14).text(user.name || 'Candidate', 50, 120);
      doc.font('Helvetica').fontSize(10).fillColor(C.muted).text(`${user.email}  |  Role: ${interview.role}  |  Type: ${interview.interviewType.toUpperCase()}`, 50, 138);
      doc.moveTo(50, 158).lineTo(50 + W, 158).strokeColor(C.border).stroke();

      doc.y = 170;

      // ── Scores ───────────────────────────────────────────────────────────────
      doc.font('Helvetica-Bold').fontSize(13).fillColor(C.light).text('PERFORMANCE SCORES', 50);
      doc.moveDown(0.5);

      const scores = [
        { label: 'Overall Score',       value: interview.overallScore       || 0 },
        { label: 'Technical Score',     value: interview.technicalScore     || 0 },
        { label: 'Communication Score', value: interview.communicationScore || 0 },
        { label: 'Confidence Score',    value: interview.confidenceScore    || 0 },
      ];

      const boxW = (W - 30) / 4;
      scores.forEach((s, i) => {
        const x = 50 + i * (boxW + 10);
        const y = doc.y;
        doc.rect(x, y, boxW, 70).fill(C.dark);
        doc.fillColor(scoreColor(s.value)).font('Helvetica-Bold').fontSize(28)
           .text(`${s.value}`, x, y + 10, { width: boxW, align: 'center' });
        doc.fillColor(C.muted).font('Helvetica').fontSize(7)
           .text(s.label, x, y + 44, { width: boxW, align: 'center' });
        doc.fillColor(scoreColor(s.value)).font('Helvetica-Bold').fontSize(8)
           .text(scoreLabel(s.value), x, y + 56, { width: boxW, align: 'center' });
      });
      doc.y += 80;

      // ── Summary ──────────────────────────────────────────────────────────────
      if (interview.aiFeedback?.summary) {
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').fontSize(13).fillColor(C.light).text('AI ASSESSMENT');
        doc.moveDown(0.3);
        doc.rect(50, doc.y, W, 60).fill(C.dark);
        doc.font('Helvetica').fontSize(10).fillColor(C.muted)
           .text(interview.aiFeedback.summary, 60, doc.y - 55, { width: W - 20, height: 55 });
        doc.y += 15;
      }

      // ── Strengths & Improvements ─────────────────────────────────────────────
      doc.moveDown(0.8);
      const halfW = (W - 10) / 2;
      const colY  = doc.y;

      // Strengths column
      doc.font('Helvetica-Bold').fontSize(11).fillColor(C.success).text('✓ STRENGTHS', 50, colY);
      const strengths = interview.aiFeedback?.strengths || [];
      strengths.slice(0, 5).forEach((s, i) => {
        doc.font('Helvetica').fontSize(9).fillColor(C.light)
           .text(`• ${s}`, 50, colY + 20 + i * 18, { width: halfW });
      });

      // Improvements column
      doc.font('Helvetica-Bold').fontSize(11).fillColor(C.danger).text('✗ IMPROVEMENTS', 50 + halfW + 10, colY);
      const improvements = interview.aiFeedback?.improvements || [];
      improvements.slice(0, 5).forEach((s, i) => {
        doc.font('Helvetica').fontSize(9).fillColor(C.light)
           .text(`• ${s}`, 50 + halfW + 10, colY + 20 + i * 18, { width: halfW });
      });

      const maxRows = Math.max(strengths.length, improvements.length, 1);
      doc.y = colY + 20 + maxRows * 18 + 10;

      // ── Recommended Topics ───────────────────────────────────────────────────
      const topics = interview.aiFeedback?.recommendedTopics || [];
      if (topics.length) {
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').fontSize(11).fillColor(C.warning).text('RECOMMENDED STUDY TOPICS');
        doc.moveDown(0.3);
        doc.font('Helvetica').fontSize(9).fillColor(C.light)
           .text(topics.map((t) => `▸ ${t}`).join('   '), 50, doc.y, { width: W });
        doc.moveDown(0.8);
      }

      // ── Question Breakdown ───────────────────────────────────────────────────
      doc.addPage();
      doc.font('Helvetica-Bold').fontSize(16).fillColor(C.light).text('QUESTION-BY-QUESTION BREAKDOWN', 50, 50);
      doc.moveTo(50, 75).lineTo(50 + W, 75).strokeColor(C.border).stroke();
      doc.y = 85;

      const answered = interview.questions.filter((q) => q.userAnswer);
      answered.forEach((q, idx) => {
        if (doc.y > 700) doc.addPage();

        const evalScore = q.aiEvaluation?.score ?? 0;
        doc.rect(50, doc.y, W, 16).fill(C.dark);
        doc.font('Helvetica-Bold').fontSize(9).fillColor(C.primary)
           .text(`Q${idx + 1}`, 55, doc.y - 13);
        doc.fillColor(scoreColor(evalScore)).text(`${evalScore}/10  ${scoreLabel(evalScore)}`, 0, doc.y - 13, { align: 'right', width: doc.page.width - 50 });
        doc.y += 6;

        doc.font('Helvetica-Bold').fontSize(9).fillColor(C.light).text(q.question, 50, doc.y, { width: W });
        doc.moveDown(0.3);

        if (q.userAnswer) {
          doc.font('Helvetica').fontSize(8).fillColor(C.muted)
             .text(`Answer: ${q.userAnswer.substring(0, 200)}${q.userAnswer.length > 200 ? '...' : ''}`, 50, doc.y, { width: W });
          doc.moveDown(0.3);
        }
        if (q.aiEvaluation?.feedback) {
          doc.font('Helvetica').fontSize(8).fillColor('#818cf8')
             .text(`AI: ${q.aiEvaluation.feedback}`, 50, doc.y, { width: W });
          doc.moveDown(0.3);
        }
        doc.moveTo(50, doc.y).lineTo(50 + W, doc.y).strokeColor(C.border).stroke();
        doc.moveDown(0.5);
      });

      // ── Footer ───────────────────────────────────────────────────────────────
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.font('Helvetica').fontSize(8).fillColor(C.muted)
           .text(`PrepAI Interview Report  |  Page ${i + 1} of ${pageCount}  |  Confidential`, 50, doc.page.height - 40, { align: 'center', width: W });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });

module.exports = { generateInterviewReport };
