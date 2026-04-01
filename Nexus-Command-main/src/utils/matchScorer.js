const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
  'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
  'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how',
  'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
  'such', 'no', 'not', 'only', 'own', 'same', 'than', 'too', 'very', 'just',
  'our', 'your', 'their', 'its', 'as', 'also', 'well', 'any', 'if', 'so'
])

export function extractKeywords(text) {
  if (!text) return []
  return text
    .toLowerCase()
    .replace(/[^\w\s+#]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))
    .filter((v, i, a) => a.indexOf(v) === i) // unique
}

function compareKeywords(jobKeywords, profileText) {
  if (!profileText || jobKeywords.length === 0) return 0
  const profileKeywords = new Set(extractKeywords(profileText))
  const matched = jobKeywords.filter(k => profileKeywords.has(k))
  return jobKeywords.length > 0 ? matched.length / jobKeywords.length : 0
}

function getMatchedKeywords(jobKeywords, profileText) {
  if (!profileText) return []
  const profileKeywords = new Set(extractKeywords(profileText))
  return jobKeywords.filter(k => profileKeywords.has(k))
}

function getGapKeywords(jobKeywords, cvData) {
  const allProfileText = [
    cvData.skills || '',
    cvData.experience || '',
    cvData.portfolio || '',
    cvData.education || ''
  ].join(' ')
  const profileKeywords = new Set(extractKeywords(allProfileText))
  return jobKeywords.filter(k => !profileKeywords.has(k))
}

export function scoreMatch(jobDescription, cvData) {
  if (!jobDescription || !cvData) {
    return {
      overall: 0,
      breakdown: { skills: 0, experience: 0, portfolio: 0, education: 0 },
      matched: [],
      gaps: [],
      summary: 'No data provided for scoring.'
    }
  }

  const jobKeywords = extractKeywords(jobDescription)

  const rawSkills = compareKeywords(jobKeywords, cvData.skills || '')
  const rawExp = compareKeywords(jobKeywords, cvData.experience || '')
  const rawPortfolio = compareKeywords(jobKeywords, cvData.portfolio || '')
  const rawEducation = compareKeywords(jobKeywords, cvData.education || '')

  // Weighted scores (percentages)
  const skillsScore = Math.round(rawSkills * 100)
  const expScore = Math.round(rawExp * 100)
  const portfolioScore = Math.round(rawPortfolio * 100)
  const educationScore = Math.round(rawEducation * 100)

  // Overall weighted score
  const overall = Math.round(
    rawSkills * 40 +
    rawExp * 30 +
    rawPortfolio * 20 +
    rawEducation * 10
  )

  const matched = [...new Set([
    ...getMatchedKeywords(jobKeywords, cvData.skills || ''),
    ...getMatchedKeywords(jobKeywords, cvData.experience || ''),
    ...getMatchedKeywords(jobKeywords, cvData.portfolio || ''),
    ...getMatchedKeywords(jobKeywords, cvData.education || '')
  ])]

  const gaps = getGapKeywords(jobKeywords, cvData).slice(0, 20)

  let summary = ''
  if (overall >= 80) {
    summary = `Excellent match! Your profile aligns very well with this role. You match ${matched.length} of the key requirements.`
  } else if (overall >= 60) {
    summary = `Good match. You cover most of the requirements with ${matched.length} matching keywords. Focus on bridging the gaps in: ${gaps.slice(0, 3).join(', ')}.`
  } else if (overall >= 40) {
    summary = `Moderate match with ${matched.length} matching keywords. Consider highlighting transferable skills and addressing gaps like: ${gaps.slice(0, 3).join(', ')}.`
  } else {
    summary = `Lower match score. You have ${matched.length} matching keywords but significant gaps. Key missing areas: ${gaps.slice(0, 5).join(', ')}.`
  }

  return {
    overall,
    breakdown: {
      skills: skillsScore,
      experience: expScore,
      portfolio: portfolioScore,
      education: educationScore
    },
    matched,
    gaps,
    summary,
    jobKeywords
  }
}

export function generateInterviewQuestions(jobDescription, cvData) {
  const jobKeywords = extractKeywords(jobDescription)
  const questions = []

  // Technical questions from job description keywords
  const techTerms = jobKeywords.filter(k =>
    ['javascript', 'python', 'react', 'node', 'sql', 'aws', 'docker', 'kubernetes',
     'java', 'typescript', 'api', 'rest', 'graphql', 'css', 'html', 'git',
     'agile', 'scrum', 'ci', 'cd', 'devops', 'machine', 'learning', 'data',
     'analytics', 'cloud', 'azure', 'gcp', 'microservices', 'testing'].includes(k)
  )

  techTerms.slice(0, 5).forEach(term => {
    questions.push({
      category: 'Technical',
      question: `Can you walk me through your experience with ${term}?`,
      confidence: 0.9,
      why: `"${term}" appears in the job description as a key requirement.`
    })
  })

  // Gap questions - things in the JD but not in CV
  const gaps = getGapKeywords(jobKeywords, cvData).slice(0, 3)
  gaps.forEach(gap => {
    questions.push({
      category: 'Gap-Probing',
      question: `This role requires ${gap}. How would you approach learning or applying this?`,
      confidence: 0.85,
      why: `"${gap}" is mentioned in the job description but wasn't found prominently in your CV.`
    })
  })

  // Standard behavioural questions
  const behaviouralQuestions = [
    { q: 'Tell me about a time you faced a significant challenge at work and how you overcame it.', w: 'Standard STAR question to assess problem-solving.' },
    { q: 'Describe a situation where you had to work with a difficult team member. How did you handle it?', w: 'Assesses interpersonal skills and conflict resolution.' },
    { q: 'Give an example of a time you had to meet a tight deadline. What was your approach?', w: 'Tests time management and prioritisation.' },
    { q: 'Tell me about your biggest professional achievement and how you accomplished it.', w: 'Allows you to showcase your best work.' },
    { q: 'Describe a time you received critical feedback. How did you respond?', w: 'Tests self-awareness and growth mindset.' }
  ]

  behaviouralQuestions.forEach(({ q, w }) => {
    questions.push({
      category: 'Behavioural',
      question: q,
      confidence: 0.95,
      why: w
    })
  })

  // Portfolio deep-dive questions
  const portfolioKeywords = extractKeywords(cvData.portfolio || '')
  portfolioKeywords.slice(0, 3).forEach(term => {
    questions.push({
      category: 'Portfolio Deep-Dives',
      question: `I see you have experience with ${term}. Can you show me an example from your portfolio and talk through the decisions you made?`,
      confidence: 0.8,
      why: `Based on portfolio entries matching "${term}".`
    })
  })

  // Culture fit questions
  const cultureKeywords = ['team', 'collaborate', 'innovative', 'startup', 'fast-paced', 'remote', 'agile']
  const jobText = jobDescription.toLowerCase()
  const cultureFit = [
    { trigger: 'team', q: 'How do you prefer to collaborate with team members on complex projects?' },
    { trigger: 'innovat', q: 'Can you give an example of an innovative solution you proposed or implemented?' },
    { trigger: 'startup', q: 'How comfortable are you with ambiguity and rapidly changing priorities?' },
    { trigger: 'remote', q: 'How do you stay productive and connected when working remotely?' },
    { trigger: 'agile', q: 'How have you contributed to agile ceremonies like standups and retrospectives?' }
  ]

  cultureFit.forEach(({ trigger, q }) => {
    if (jobText.includes(trigger)) {
      questions.push({
        category: 'Culture Fit',
        question: q,
        confidence: 0.75,
        why: `The job description mentions "${trigger}" which suggests culture fit is important.`
      })
    }
  })

  // Always add a couple of standard culture questions
  if (questions.filter(q => q.category === 'Culture Fit').length < 2) {
    questions.push({
      category: 'Culture Fit',
      question: 'What type of work environment brings out your best performance?',
      confidence: 0.7,
      why: 'Standard culture fit question to assess alignment.'
    })
  }

  return questions
}
