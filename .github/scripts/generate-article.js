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

async function generateArticle(trendingContext, keyword, dateStr) {
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

Γράψε ένα άρθρο για το blog withinsuccess.gr με primary keyword: "${keyword}"

BRAND VOICE:
- Γράφεις σε απλά ελληνικά, αρσενικό γένος
- Τόνος: άμεσος, καθαρός, χωρίς κλισέ αυτοβελτίωσης
- Ποτέ "πειθαρχία" ή "συνέπεια" - πάντα "ταυτότητα" και "εσωτερική ιστορία"
- Μικρές προτάσεις. Καθαρές. Παύλες - όχι em dashes.

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
<CATEGORY>UPPERCASE ΧΩΡΙΣ ΤΟΝΟΥΣ</CATEGORY>
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

async function main() {
  const dateStr = getDateString();

  // Διάβασε το υπάρχον articles.ts πρώτα
  const currentFile = fs.readFileSync('src/app/insights/articles.ts', 'utf8');

  // Βρες keywords που έχουν ήδη χρησιμοποιηθεί
  const usedKeywords = [];
  const matches = currentFile.match(/"keywords":\s*\[([^\]]+)\]/g) || [];
  matches.forEach(m => {
    const kws = m.match(/"([^"]+)"/g) || [];
    kws.forEach(k => usedKeywords.push(k.replace(/"/g, '')));
  });
  console.log('Used keywords:', usedKeywords);

  // Επέλεξε keyword που δεν έχει χρησιμοποιηθεί
  const availableKeywords = KEYWORDS.filter(k => !usedKeywords.includes(k));
  const keyword = availableKeywords.length > 0
    ? availableKeywords[Math.floor(Math.random() * availableKeywords.length)]
    : KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];

  console.log('Date:', dateStr);
  console.log('Keyword:', keyword);

  console.log('Getting trending topics...');
  const trending = await getTrendingTopic();
  console.log('Trending:', trending);

  console.log('Generating article...');
  const newArticle = await generateArticle(trending, keyword, dateStr);
  console.log('Article generated:', newArticle.title);
  console.log('Slug:', newArticle.slug);

  const articleEntry = `  {
    slug: "${newArticle.slug}",
    title: "${newArticle.title}",
    excerpt: "${newArticle.excerpt}",
    metaDescription: "${newArticle.metaDescription}",
    category: "${newArticle.category}",
    date: "${newArticle.date}",
    readTime: ${newArticle.readTime},
    keywords: ${JSON.stringify(newArticle.keywords)},
    content: \`${newArticle.content.replace(/`/g, "'").replace(/\\/g, '\\\\')}\`
  }`;

  if (!currentFile.match(/\];\s*$/)) {
    throw new Error('Could not find end of articles array in articles.ts');
  }

  const marker = '];\n';
  const lastIndex = currentFile.lastIndexOf(marker);
  if (lastIndex === -1) throw new Error('Cannot find end of articles array');
  const updatedFile = currentFile.slice(0, lastIndex) + `,\n${articleEntry}\n` + marker;

  fs.writeFileSync('src/app/insights/articles.ts', updatedFile);
  console.log('articles.ts updated successfully!');
}

main().catch(console.error);