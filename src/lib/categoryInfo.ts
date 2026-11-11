// How some names are SHOWN on the site. The catalogue spreadsheet is not changed;
// web addresses stay the same. (Spelling "Ahlul-Bayt" chosen by the library.)
export const DISPLAY_NAMES: Record<string, string> = {
  "Hadith & Ahlal Bayt Teachings": "Hadith & Ahlul-Bayt Teachings",
  "Ahl al-Bayt & Imams": "Ahlul-Bayt & Imams",
};

// One plain sentence per category, shown on the category cards and pages.
// The key must match the category name as shown (after DISPLAY_NAMES above).
export const categoryDescriptions: Record<string, string> = {
  Theology: "The core beliefs of Islam: the oneness of God, His justice, prophethood, the Imams and the life after death.",
  Philosophy: "Islamic thought on the big questions: reason and faith, the soul, right and wrong, and the purpose of life.",
  Fiqh: "Islamic law in everyday life: prayer and fasting, cleanliness, and personal, family and social conduct.",
  "Governance, Politics & Society":
    "How Islam sees leadership, government and public life, including Wilayat al-Faqih (the guardianship of the jurist).",
  "Comparative Religion": "Islam alongside Christianity and other world religions, and books on dialogue between faiths.",
  "Islamic Schools of Thought": "The beliefs and histories of Shia and Sunni Islam, and the dialogue between them.",
  "Quranic Studies": "Books about the Quran: commentary (tafsir), its main themes, and how it speaks to questions of today.",
  "Hadith & Ahlul-Bayt Teachings":
    "Sayings, sermons and teachings of the Prophet Muhammad and his family, the Ahlul-Bayt.",
  History: "Islamic history, from the time of the Prophet and the Imams to major events of the modern era.",
  "Stories & Reflections": "Moral stories, short reflective reads, and introductory books for young readers.",
  Biography: "Life stories of the prophets, the Ahlul-Bayt and Imams, the Prophet's companions, scholars and martyrs.",
  Miscellaneous: "Books on other subjects, such as travel, language learning, politics and cooking.",
  "Literature & Poetry": "Poetry, from Saadi and Hafez to nohas and marsiyas (poems of mourning), plus plays and novels.",
  "Duas, Ziyarat & Amaal":
    "Supplications (duas), prayers recited when visiting the shrines (ziyarat), and devotional acts (amaal) for special nights and months.",
  Ethics: "Islamic ethics and the meaning behind acts of worship. This group has no shelf number yet.",
  French: "Books written in French.",
  Italian: "Books written in Italian.",
  Uncategorized: "Books that have not been given a category yet. Please ask at the library desk.",
};

// Home page: the six featured categories, in this order.
export const FEATURED_CATEGORIES = [
  "Biography",
  "Philosophy",
  "Fiqh",
  "Theology",
  "History",
  "Governance, Politics & Society",
];

// Home page: "More to explore", in exactly this order.
export const MORE_TO_EXPLORE = [
  "Duas, Ziyarat & Amaal",
  "Quranic Studies",
  "Hadith & Ahlul-Bayt Teachings",
  "Stories & Reflections",
  "Comparative Religion",
  "Islamic Schools of Thought",
  "Ethics",
  "Literature & Poetry",
  "Miscellaneous",
  "French",
  "Italian",
  "Uncategorized",
];
