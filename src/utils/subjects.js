export const SUBJECTS = {
    biology: {
        name: 'Biology',
        aliases: ['Biology']
    },
    chemistry: {
        name: 'Chemistry',
        aliases: ['Chemistry']
    },
    physics: {
        name: 'Physics',
        aliases: ['Physics']
    },
    mathematics: {
        name: 'Mathematics',
        aliases: ['Mathematics', 'Maths']
    },
    english: {
        name: 'English',
        aliases: ['English Language', 'Use of English', 'English']
    },
    economics: {
        name: 'Economics',
        aliases: ['Economics']
    },
    government: {
        name: 'Government',
        aliases: ['Government']
    },
    literature: {
        name: 'Literature',
        aliases: ['Literature-in-English', 'Literature']
    },
    crs: {
        name: 'CRS',
        aliases: ['Christian Religious Studies', 'CRS']
    },
    geography: {
        name: 'Geography',
        aliases: ['Geography']
    },
    commerce: {
        name: 'Commerce',
        aliases: ['Commerce']
    },
    accounting: {
        name: 'Financial Accounting',
        aliases: ['Financial Accounting', 'Accounting']
    },
    agric: {
        name: 'Agricultural Science',
        aliases: ['Agricultural Science', 'Agric']
    }
};

/**
 * Helper to get normalized subject key from any string name
 */
export const getSubjectKey = (name) => {
    if (!name) return null;
    const lowerName = name.toLowerCase().trim();
    for (const [key, meta] of Object.entries(SUBJECTS)) {
        if (key === lowerName || meta.name.toLowerCase() === lowerName || meta.aliases?.some(a => a.toLowerCase() === lowerName)) {
            return key;
        }
    }
    return null;
};

/**
 * Helper to get normalized subject name
 */
export const getNormalizedSubjectName = (name) => {
    const key = getSubjectKey(name);
    return key ? SUBJECTS[key].name : name; // Fallback to original if unknown
};

/**
 * Helper to normalize multiple subjects (comma separated)
 */
export const normalizeSubjects = (subjectsString) => {
    if (!subjectsString) return '';
    return subjectsString.split(',')
        .map(s => {
            const key = getSubjectKey(s);
            return key ? SUBJECTS[key].name : s.trim();
        })
        .join(', ');
};
