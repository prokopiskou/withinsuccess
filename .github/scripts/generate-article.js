const fs = require('fs');

const KEYWORDS = [
  "αλλαγή νοοτροπίας",
  "διαχείριση άγχους",
  "προσωπική ανάπτυξη",
  "αυτογνωσία",
  "ψυχική ανθεκτικότητα",
  "εσωτερική γαλήνη",
  "αυτοπειθαρχία",
  "αντιμετώπιση burnout",
  "συνειδητότητα",
  "καθοδήγηση ζωής"
];

const CATEGORIES = [
  "ΠΡΟΣΩΠΙΚΗ ΑΝΑΠΤΥΞΗ",
  "ΨΥΧΟΛΟΓΙΑ",
  "COACHING"
];

// ============================================================
// SANITIZATION - Strip invisible/problematic Unicode characters
// ============================================================
function sanitizeText(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, '')   // Zero-width chars + BOM
    .replace(/[\u201C\u201D]/g, '"')          // Smart double quotes
    .replace(/[\u2018\u2019]/g, "'")          // Smart single quotes
    .replace(/\u037E/g, ';')                  // Greek question mark
    .replace(/\u00A0/g, ' ')                  // Non-breaking space
    .replace(/^\uFEFF/, '');                  // BOM at start
}

function sanitizeArticle(article) {
  return {
    slug: sanitizeText(article.slug),
    title: sanitizeText(article.title),
    excerpt: sanitizeText(article.excerpt),
    metaDescription: sanitizeText(article.metaDescription),
    category: sanitizeText(article.category),
    date: article.date,
    readTime: article.readTime,
    keywords: article.keywords.map(sanitizeText),
    content: sanitizeText(article.content)
  };
}

// ============================================================
// DUPLICATE DETECTION
// ============================================================
function extractExistingArticles(fileContent) {
  const slugs = [];
  const titles = [];
  const keywords = [];

  const slugMatches = fileContent.matchAll(/slug:\s*["']([^"']+)["']/g);
  for (const m of slugMatches) slugs.push(m[1]);

  const titleMatches = fileContent.matchAll(/title:\s*["']([^"']+)["']/g);
  for (const m of titleMatches) titles.push(m[1]);

  const kwMatches = fileContent.matchAll(/keywords:\s*\[([^\]]+)\]/g);
  for (const m of kwMatches) {
    const kws = m[1].match(/["']([^"']+)["']/g) || [];
    kws.forEach(k => keywords.push(k.replace(/["']/g, '')));
  }

  return { slugs, titles, keywords };
}

function similarity(s1, s2) {
  const set1 = new Set(s1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const set2 = new Set(s2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  if (set1.size === 0 || set2.size === 0) return 0;
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

function checkDuplicate(existing, newArticle) {
  if (existing.slugs.includes(newArticle.slug)) {
    return `Slug "${newArticle.slug}" already exists`;
  }
  for (const t of existing.titles) {
    const sim = similarity(t, newArticle.title);
    if (sim > 0.6) {
      return `Title too similar: "${t}" (${Math.round(sim * 100)}% match)`;
    }
  }
  for (const s of existing.slugs) {
    const sim = similarity(s.replace(/-/g, ' '), newArticle.slug.replace(/-/g, ' '));
    if (sim > 0.7) {
      return `Slug too similar: "${s}"`;
    }
  }
  return null;
}

// ============================================================
// UTILITIES
// ============================================================
function getDateString() {
  const today = new Date();
  const months = ["Ιανουαρίου","Φεβρουαρίου","Μαρτίου","Απριλίου","Μαΐου","Ιουνίου","Ιουλίου","Αυγούστου","Σεπτεμβρίου","Οκτωβρίου","Νοεμβρίου","Δεκεμβρίου"];
  return `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
}

async function getTrendingTopic() {
  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: "αυτοβελτίωση ψυχολογία τάσεις 2026 Ελλάδα",
        gl: "gr",
        hl: "el",
        num: 5
      })
    });
    const data = await response.json();
    const results = data.organic?.map(r => r.title).join(', ') || '';
    return results;
  } catch (e) {
    return "αυτοβελτίωση, ψυχολογία, εσωτερική αλλαγή";
  }
}

async function generateArticle(trendingContext, keyword, dateStr, existingTitles) {
  const avoidTopics = existingTitles.length > 0
    ? `\n\nΣΗΜΑΝΤΙΚΟ - ΥΠΑΡΧΟΥΝ ΗΔΗ ΤΑ ΕΞΗΣ ΑΡΘΡΑ:\n${existingTitles.map(t => `- ${t}`).join('\n')}\n\nΤο νέο άρθρο πρέπει να έχει ΔΙΑΦΟΡΕΤΙΚΗ γωνία/προσέγγιση από τα παραπάνω. Όχι ίδιο topic.`
    : '';

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{
        role: 'user',
        content: `Είσαι ο content assistant του Προκόπη Κούκη, founder του WithinSuccess.

TRENDING CONTEXT: ${trendingContext}
ΣΗΜΕΡΙΝΗ ΗΜΕΡΟΜΗΝΙΑ: ${dateStr}

Γράψε ένα άρθρο για το blog withinsuccess.gr με primary keyword: "${keyword}"${avoidTopics}

BRAND VOICE:
- Γράφεις σε απλά ελληνικά, αρσενικό γένος
- Τόνος: άμεσος, καθαρός, χωρίς κλισέ αυτοβελτίωσης
- Ποτέ "πειθαρχία" ή "συνέπεια" - πάντα "ταυτότητα" και "εσωτερική ιστορία"
- Μικρές προτάσεις. Καθαρές. Παύλες - όχι em dashes.

CRITICAL - ΧΑΡΑΚΤΗΡΕΣ:
- ΧΡΗΣΙΜΟΠΟΙΗΣΕ ΜΟΝΟ regular ASCII quotes (") και (')
- ΟΧΙ smart quotes
- ΟΧΙ em-dashes, χρησιμοποίησε regular dash (-)
- ΟΧΙ zero-width spaces ή invisible Unicode
- Χρησιμοποίησε regular semicolon (;) όχι ελληνικό ερωτηματικό

ΜΗΚΟΣ: τουλάχιστον 1000 λέξεις στο content.

ΔΟΜΗ:
1. Εισαγωγή
2. H2: Τι είναι ${keyword}
3. H2: Γιατί το πρόβλημα υπάρχει
4. H2: Πρακτικά βήματα (3-5)
5. H2: Συμπέρασμα
6. H2: Συχνές ερωτήσεις (5+ ερωτήσεις)

HTML RULES:
- Χρησιμοποίησε: <p>, <h2>, <strong>, <ul>, <li>
- ΜΗΝ χρησιμοποιείς: <h1>, <h3>, backticks, double quotes μέσα στο HTML

ΕΠΕΣΤΡΕΨΕ ΤΗΝ ΑΠΑΝΤΗΣΗ ΣΟΥ ΣΕ ΑΥΤΗ ΤΗ ΜΟΡΦΗ (XML tags):

<SLUG>lowercase-me-paules</SLUG>
<TITLE>Τίτλος άρθρου</TITLE>
<EXCERPT>1-2 προτάσεις excerpt.</EXCERPT>
<META>120-160 chars meta description με το keyword</META>
<CATEGORY>Διάλεξε ΑΚΡΙΒΩΣ ΜΙΑ από αυτές τις 3 κατηγορίες - όχι κάτι άλλο: ΠΡΟΣΩΠΙΚΗ ΑΝΑΠΤΥΞΗ, ΨΥΧΟΛΟΓΙΑ, COACHING. Επέστρεψε ΜΟΝΟ τη μία λέξη/φράση χωρίς εισαγωγικά.</CATEGORY>
<KEYWORDS>keyword1,keyword2,keyword3</KEYWORDS>
<CONTENT>
HTML content εδώ...
</CONTENT>`
      }]
    })
  });

  const data = await response.json();
  const text = data.content[0].text.trim();

  const get = (tag) => {
    const match = text.match(new RegExp(`<${tag}>[\\s\\S]*?<\\/${tag}>`));
    if (!match) throw new Error(`Missing <${tag}> tag`);
    return match[0].replace(new RegExp(`^<${tag}>\\s*`), '').replace(new RegExp(`\\s*<\\/${tag}>$`), '').trim();
  };

  return {
    slug: get('SLUG'),
    title: get('TITLE'),
    excerpt: get('EXCERPT'),
    metaDescription: get('META'),
    category: get('CATEGORY'),
    date: dateStr,
    readTime: 5,
    keywords: get('KEYWORDS').split(',').map(k => k.trim()),
    content: get('CONTENT')
  };
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  const dateStr = getDateString();

  const currentFile = fs.readFileSync('src/app/insights/articles.ts', 'utf8');
  const existing = extractExistingArticles(currentFile);

  console.log(`Existing: ${existing.slugs.length} slugs, ${existing.titles.length} titles`);
  console.log('Used keywords:', existing.keywords);

  // Skip if all keywords used (no random fallback that creates duplicates)
  const availableKeywords = KEYWORDS.filter(k => !existing.keywords.includes(k));

  if (availableKeywords.length === 0) {
    console.log('All keywords used. Skipping generation. Add more topics to KEYWORDS array.');
    process.exit(0);
  }

  const keyword = availableKeywords[Math.floor(Math.random() * availableKeywords.length)];

  console.log('Date:', dateStr);
  console.log('Keyword:', keyword);

  console.log('Getting trending topics...');
  const trending = await getTrendingTopic();
  console.log('Trending:', trending);

  console.log('Generating article...');
  let newArticle = await generateArticle(trending, keyword, dateStr, existing.titles);

  // SANITIZE - Remove invisible Unicode chars
  newArticle = sanitizeArticle(newArticle);

  console.log('Article generated:', newArticle.title);
  console.log('Slug:', newArticle.slug);

  // DUPLICATE CHECK
  const duplicate = checkDuplicate(existing, newArticle);
  if (duplicate) {
    console.log(`DUPLICATE DETECTED: ${duplicate}`);
    console.log('Skipping. Will retry next Monday.');
    process.exit(0);
  }

  console.log('No duplicates. Adding article...');

  // Safe content escaping for template literal
  const safeContent = newArticle.content
    .replace(/\\/g, '\\\\')
    .replace(/`/g, "'")
    .replace(/\$\{/g, '\\${');

  // Use JSON.stringify for safe string fields
  const articleEntry = `  {
    slug: ${JSON.stringify(newArticle.slug)},
    title: ${JSON.stringify(newArticle.title)},
    excerpt: ${JSON.stringify(newArticle.excerpt)},
    metaDescription: ${JSON.stringify(newArticle.metaDescription)},
    category: ${JSON.stringify(newArticle.category)},
    date: ${JSON.stringify(newArticle.date)},
    readTime: ${newArticle.readTime},
    keywords: ${JSON.stringify(newArticle.keywords)},
    content: \`${safeContent}\`
  }`;

  if (!currentFile.match(/\];\s*$/)) {
    throw new Error('Could not find end of articles array');
  }

  // Find last `];` and insert before it
  const marker = '];';
  const lastIndex = currentFile.lastIndexOf(marker);
  if (lastIndex === -1) throw new Error('Cannot find end of articles array');

  const beforeMarker = currentFile.slice(0, lastIndex).trimEnd();
  const needsComma = beforeMarker.endsWith('}');

  let updatedFile = beforeMarker
    + (needsComma ? ',' : '')
    + '\n' + articleEntry + '\n'
    + marker + '\n';

  // Final sanity sanitization on whole file
  updatedFile = sanitizeText(updatedFile);

  fs.writeFileSync('src/app/insights/articles.ts', updatedFile);
  console.log('articles.ts updated successfully!');
  console.log(`Added: "${newArticle.title}"`);
}

main().catch(err => {
  console.error('FAILED:', err.message);
  process.exit(1);
});