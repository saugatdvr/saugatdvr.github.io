// ─────────────────────────────────────────────────────────────
//  EDIT YOUR WEBSITE TEXT HERE
//  Change anything between the quotes "like this", save, refresh.
//  Lines marked  ✏️  are placeholders I made up — please replace them.
// ─────────────────────────────────────────────────────────────
window.SITE = {
  name: "Saugat",
  fullName: "Saugat Sharma",
  role: "Video Editor & Motion Designer",
  location: "Nepal",
  available: "Open for new projects",

  // Contact
  email: "saugatsharmaaa@gmail.com",
  whatsapp: "9779869335992",                  // country code + number, no + or spaces
  instagram: "https://www.instagram.com/saugatsharmaaa/",
  linkedin: "https://www.linkedin.com/in/saugat-sharma-8534763a0/",

  // Optional: put a photo of you in assets/img/ and write its name here, e.g. "assets/img/me.jpg"
  photo: "assets/img/me.jpg",

  hero: {
    lineOne: "Edits that",
    accent: "move",
    lineTwo: "people.",
    text: "I cut short-form reels, brand ads and motion graphics that stop the scroll and keep people watching to the very last frame.",
  },

  // The animated tiles under the hero
  skillsTitle: ["What", "I do"],
  skills: ["Cut", "Rise", "Captions", "Glow", "Kinetic", "Colour", "Sound", "Story", "Shine", "Motion"],

  stats: [
    { value: "500", plus: true, label: "reels edited" },
    { value: "20", plus: true, label: "brands" },
    { value: "4", plus: true, label: "years editing" },
  ],

  services: {
    title: "One editor for\neverything you post",
    text: "From raw footage to a finished, scroll-stopping post: editing, motion graphics, captions, colour and sound, all handled in one place.",
    items: [
      { label: "Short-form", value: "Reels", icon: "reel",
        text: "Instagram Reels, TikToks and Shorts cut for retention: tight pacing, hooks in the first second and clean story flow." },
      { label: "After Effects", value: "Motion", icon: "motion",
        text: "Kinetic typography, animated UI cards, logo reveals and graphics that explain your product in seconds." },
      { label: "Brand & Ads", value: "Promos", icon: "spark",
        text: "Product ads and launch videos for brands, with on-brand fonts, colours and a clear call to action." },
      { label: "Finishing", value: "Colour", icon: "wave",
        text: "Colour grading, sound design, music sync and styled captions in English and Romanized Nepali." },
    ],
  },

  about: {
    title: ["About", "me"],
    // The big paragraph that lights up word by word as you scroll
    text: "I'm Saugat, a passionate video editor from Nepal with skills that range from motion graphics to cinematic edits, and everything in between. In four years I've cut 500+ reels for 20+ brands, turning raw footage into videos people actually finish.",
  },

  // From LinkedIn, newest first
  experience: [
    { period: "Sep 2026 — Now", role: "Video Editor", company: "NotNorml Media",
      text: "Full-time, on-site in Lalitpur. Editing reels, brand ads and motion graphics for the agency's clients." },
    { period: "Jan — Sep 2026", role: "Video Editor", company: "Danfe Solutions",
      text: "Full-time in Kathmandu. Edited videos for clients across restaurants, clubs, clothing and more, and widened my editing range." },
    { period: "Dec 2025", role: "Freelance Video Editor", company: "First Camp Treks",
      text: "Freelance edits for a trekking company, made in DaVinci Resolve and Canva." },
    { period: "2022 — 2025", role: "Video Editor Intern", company: "Nepali Football Community",
      text: "Football edits and highlights, cut in DaVinci Resolve." },
    { period: "2022 — 2024", role: "Video Editor", company: "Karma Kreatives",
      text: "Editing, colour grading and reel cover design for clients and for the company itself." },
    { period: "Mar — Jun 2022", role: "Video Editor", company: "Biratnagar City FC",
      text: "Match clips for the club, plus coverage of the Purbanchal University Futsal Cup and Jamboree Futsal League." },
  ],

  tools: ["After Effects", "DaVinci Resolve", "Premiere Pro", "Photoshop", "Canva", "Blender"],   // ✏️ remove any you don't use

  // Brands you've worked with (scrolling strip)   ✏️ confirm these
  clients: ["YOLO", "Ultima Lifestyle", "Babal Host", "Nest Nepal", "Siddhartha Capital", "Nest SMS", "SMS Pasal"],

  // Names + order for the videos in "best work".  ✏️ titles are my guesses from the thumbnails — fix them
  // The key on the left is the file name in lowercase with dashes (version numbers like "v2.1" are dropped,
  // and a second file with the same name gets "-2"). Lower "order" = shown first. The first 5 go in the hero.
  workInfo: {
    "yolo":               { order: 1,  client: "YOLO",               title: "Become a Retail Partner" },
    "ultima-cine-1":      { order: 2,  client: "Ultima",             title: "Diva — Black Edition" },
    "babal-host":         { order: 3,  client: "Babal Host",         title: "Hosting, Explained" },
    "nest-nepal":         { order: 4,  client: "Nest Nepal",         title: "Free Zoom, 40 Minutes" },
    "ultima-sc-9":        { order: 5,  client: "Ultima",             title: "Faster, Every Day" },
    "siddhartha-capital": { order: 6,  client: "Siddhartha Capital", title: "14 Years in Nepal's Capital Market" },
    "babal-host-2":       { order: 7,  client: "Babal Host",         title: "Website, Email & Domain" },
    "nest-sms":           { order: 8,  client: "Nest SMS",           title: "Bulk SMS for Business" },
    "ultima-cine-3":      { order: 9,  client: "Ultima",             title: "Rose Gold, Cinematic" },
    "sms-pasal":          { order: 10, client: "SMS Pasal",          title: "Brand Promo" },
    "nest":               { order: 11, client: "Nest Nepal",         title: "Grow Online" },
    "yolo-2":             { order: 12, client: "YOLO",               title: "Brand Story" },
  },

  cta: {
    lineOne: "Got footage?",
    accent: "Let's make it",
    lineTwo: "unmissable.",
    text: "Tell me about your brand and what you want to post. I usually reply within a day.",
  },
};
