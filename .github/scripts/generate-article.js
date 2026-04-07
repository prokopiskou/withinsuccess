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
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `Είσαι ο content assistant του Προκόπη Κούκη, founder του WithinSuccess.

TRENDING CONTEXT: ${trendingContext}
ΣΗΜΕΡΙΝΗ ΗΜΕΡΟΜΗΝΙΑ: ${dateStr}

Γράψε ένα άρθρο για το blog withinsuccess.gr με primary keyword: "${keyword}"

BRAND VOICE:
- Target: Γυναίκες 25-35 που νιώθουν stuck
- Tone: Direct, minimal, χωρίς motivational clichés
- Ποτέ "πειθαρχία" ή "συνέπεια" - πάντα "ταυτότητα" και "εσωτερική ιστορία"
- Χρησιμοποίησε παύλες - όχι em dashes
- Μικρές προτάσεις. Καθαρές.

ΔΟΜΗ:
1. H1 με primary keyword
2. Εισαγωγή (mirror - αναγνωρίζει ο αναγνώστης)
3. H2: Τι είναι [keyword]
4. H2: Γιατί [πρόβλημα]
5. H2: Πρακτικά βήματα (3-5 concrete)
6. H2: Συμπέρασμα
7. H2: Συχνές ερωτήσεις (3 ερωτήσεις - ΚΡΙΣΙΜΟ για AI visibility)

HTML RULES:
- Χρησιμοποίησε: <p>, <h2>, <strong>, <ul>, <li>
- ΜΗΝ χρησιμοποιείς: <h1>, <h3>, inline styles
- Παύλες: - όχι —

ΕΠΕΣΤΡΕΨΕ ΜΟΝΟ ένα valid JSON object (χωρίς markdown backticks):
{
  "slug": "lowercase-me-paules",
  "title": "Τίτλος άρθρου",
  "excerpt": "1-2 προτάσεις excerpt.",
  "category": "UPPERCASE ΧΩΡΙΣ ΤΟΝΟΥΣ",
  "date": "${dateStr}",
  "readTime": 5,
  "keywords": ["primary keyword", "secondary1", "secondary2"],
  "content": "<p>HTML content...</p>"
}`
      }]
    })
  });

  const data = await response.json();
  const text = data.content[0].text.trim();
  const article = JSON.parse(text);
  return article;
}

async function main() {
  const dateStr = getDateString();
  const keyword = KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];

  console.log('Date:', dateStr);
  console.log('Keyword:', keyword);

  console.log('Getting trending topics...');
  const trending = await getTrendingTopic();
  console.log('Trending:', trending);

  console.log('Generating article...');
  const newArticle = await generateArticle(trending, keyword, dateStr);
  console.log('Article generated:', newArticle.title);
  console.log('Slug:', newArticle.slug);

  const currentFile = fs.readFileSync('src/app/insights/articles.ts', 'utf8');

  const articleEntry = `  {
    slug: "${newArticle.slug}",
    title: "${newArticle.title}",
    excerpt: "${newArticle.excerpt}",
    category: "${newArticle.category}",
    date: "${newArticle.date}",
    readTime: ${newArticle.readTime},
    keywords: ${JSON.stringify(newArticle.keywords)},
    content: \`${newArticle.content}\`
  }`;

  const updatedFile = currentFile.replace(
    /\];\s*$/,
    `,\n${articleEntry}\n];`
  );

  fs.writeFileSync('src/app/insights/articles.ts', updatedFile);
  console.log('articles.ts updated successfully!');
}

main().catch(console.error);