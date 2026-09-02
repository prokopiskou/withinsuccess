export default function CoachingCTA() {
  return (
    <div
      className="mt-16 p-8 rounded-2xl text-center border"
      style={{ borderColor: "#EFE9DD", backgroundColor: "#FBF6EC" }}
    >
      <p
        className="text-sm font-medium tracking-widest uppercase mb-3"
        style={{ color: "#C9A96E" }}
      >
        1-1 Συνεδρίες
      </p>
      <h3
        className="text-2xl font-semibold mb-4"
        style={{ fontFamily: "Georgia, serif" }}
      >
        Ήρθε η ώρα για την αλλαγή που αναβάλλεις;
      </h3>
      <p className="text-gray-600 mb-6 text-sm max-w-md mx-auto">
        Το πρόγραμμα 1-1 συνεδριών με τον Προκόπη Κούκη είναι για σένα.
      </p>
      <a
        href="https://calendly.com/withinsuccess1/withinsuccess?a1=%CE%91%CF%84%CE%BF%CE%BC%CE%B9%CE%BA%CE%AD%CF%82%20%CF%83%CF%85%CE%BD%CE%B5%CE%B4%CF%81%CE%AF%CE%B5%CF%82"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block px-8 py-3 rounded-full text-sm font-medium transition-opacity hover:opacity-90"
        style={{ backgroundColor: "#C9A96E", color: "#0D0D0D" }}
      >
        Κλείσε μία δωρεάν συνεδρία ενημέρωσης →
      </a>
    </div>
  );
}
