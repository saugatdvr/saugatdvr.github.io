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

  // The 5 fanned cards at the top (centre one is at the front) and the phone in the contact card.
  // Use the names from workInfo below.
  heroVideos: ["yolo-v2-1", "ultima-cine-3", "e-sewa", "babal-host-v1", "ultima-cine-1"],
  phoneVideo: "ultima-cine-3",

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
      { label: "Short-form", value: "Reels", icon: "reel", video: "yolo-v6",
        text: "Instagram Reels, TikToks and Shorts cut for retention: tight pacing, hooks in the first second and clean story flow." },
      { label: "After Effects", value: "Motion", icon: "motion", video: "e-sewa",
        text: "Kinetic typography, animated UI cards, logo reveals and graphics that explain your product in seconds." },
      { label: "Brand & Ads", value: "Promos", icon: "spark", video: "notnorml-video2-main-1",
        text: "Product ads and launch videos for brands, with on-brand fonts, colours and a clear call to action." },
      { label: "Finishing", value: "Colour", icon: "wave", video: "insta-v2",
        text: "Colour grading, sound design, music sync and styled captions in English and Romanized Nepali." },
    ],
  },

  // "How I edit" timeline: one step per stretch of scrolling. tool = blade, select, fusion, color, audio, render
  editSteps: [
    { word: "Hook", rest: "them in a second.", tool: "select", text: "The first frame decides everything: a bold line, a pattern break, a reason to stay." },
    { word: "Cut", rest: "the dead air.", tool: "blade", text: "Every pause and retake goes, so the reel never drags." },
    { word: "Motion", rest: "that explains.", tool: "fusion", text: "Kinetic type, UI cards and graphics built in After Effects and Fusion." },
    { word: "Colour", rest: "that feels premium.", tool: "color", text: "Graded in DaVinci Resolve so every shot matches your brand." },
    { word: "Sound", rest: "you can feel.", tool: "audio", text: "Music cut on the beat, clean voice and subtle sound design." },
    { word: "Deliver", rest: "ready to post.", tool: "render", text: "Exported for Reels, TikTok and YouTube, on time, every time." },
  ],

  // Big statement near the end — words light up as you scroll. Put *stars* around words to make them lime + italic.
  manifesto: "Cutting stories, chasing *retention*, turning raw footage into *reels* people actually finish. *Four years*, 500+ reels, one obsession: the *perfect cut.*",

  // The two giant moving rows behind your photo, and the signature drawn over it
  signoff: {
    rowOne: "Edited in Nepal · Cut for the world ·",
    rowTwo: "500+ reels · 20+ brands · 4 years ·",
    signature: "Saugat",
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

  tools: ["After Effects", "DaVinci Resolve", "Photoshop", "Canva"],

  // Brands you've worked with (scrolling strip)   ✏️ confirm these
  clients: ["eSewa", "YOLO", "Kings Lounge Kathmandu", "Ultima Lifestyle", "Hotel Bhadgaon", "Babal Host", "Nest Nepal", "Siddhartha Capital", "Talent Sathi", "Nest SMS", "SMS Pasal"],

  // Names + order for the videos in "best work".  ✏️ titles are my guesses from the thumbnails — fix them
  // The key on the left is the file name in lowercase with dashes ("Yolo v6.mp4" → "yolo-v6",
  // "Babal host v2.1.mp4" → "babal-host-v2-1"). Lower "order" = shown first in the work carousel.
  workInfo: {
    "e-sewa":                 { order: 1,  client: "eSewa",              title: "Everyday Payments, Together" },
    "ultima-cine-3":          { order: 2,  client: "Ultima",             title: "Rose Gold, Cinematic" },
    "insta-edit":             { order: 3,  client: "Instagram Edit",     title: "Notice, Animated" },
    "yolo-v2-1":              { order: 4,  client: "YOLO",               title: "Become a Retail Partner" },
    "ultima-cine-1":          { order: 5,  client: "Ultima",             title: "Diva — Black Edition" },
    "babal-host-v1":          { order: 6,  client: "Babal Host",         title: "Hosting, Explained" },
    "notnorml-video2-main-1": { order: 7,  client: "NotNorml Media",     title: "Turn Clicks into Customers" },
    "nest-nepal-v2-1":        { order: 8,  client: "Nest Nepal",         title: "Free Zoom, 40 Minutes" },
    "insta-v2":               { order: 9,  client: "Colour Grade",       title: "Car Reel, Final Grade" },
    "ultima-sc-9":            { order: 10, client: "Ultima",             title: "Faster, Every Day" },
    "siddhartha-capital":     { order: 11, client: "Siddhartha Capital", title: "14 Years in Nepal's Capital Market" },
    "yolo-v6":                { order: 12, client: "YOLO",               title: "Ramro, Brand Story" },
    "babal-host-v2-1":        { order: 13, client: "Babal Host",         title: "Website, Email & Domain" },
    "talent-sathi":           { order: 14, client: "Talent Sathi",       title: "Hiring, Explained" },
    "nest-sms-v1":            { order: 15, client: "Nest SMS",           title: "Bulk SMS for Business" },
    "sms-pasal":              { order: 16, client: "SMS Pasal",          title: "Brand Promo" },
    "yolo-v1":                { order: 17, client: "YOLO",               title: "If You're Watching This" },
    "nest-v2-1":              { order: 18, client: "Nest Nepal",         title: "Grow Online" },
  },

  cta: {
    lineOne: "Got footage?",
    accent: "Let's make it",
    lineTwo: "unmissable.",
    text: "Tell me about your brand and what you want to post. I usually reply within a day.",
  },
};
