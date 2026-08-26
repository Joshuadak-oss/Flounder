const authPage = document.getElementById("authPage");
const appShell = document.getElementById("appShell");
const authStatus = document.getElementById("authStatus");
const providerButtons = document.querySelectorAll("[data-provider]");
const emailAuthForm = document.getElementById("emailAuthForm");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const emailSubmitBtn = document.getElementById("emailSubmitBtn");
const authModeBtn = document.getElementById("authModeBtn");
const logoutBtn = document.getElementById("logoutBtn");
const analyticsSection = document.getElementById("analyticsSection");
const analyticsStatus = document.getElementById("analyticsStatus");
const analyticsSessionKey = "flounderAnalyticsSession";
const analyticsSessionId = sessionStorage.getItem(analyticsSessionKey) || crypto.randomUUID();
sessionStorage.setItem(analyticsSessionKey, analyticsSessionId);
const hasSupabaseConfig = Boolean(
    window.supabase &&
    window.FLOUNDER_SUPABASE_URL &&
    window.FLOUNDER_SUPABASE_PUBLISHABLE_KEY &&
    !window.FLOUNDER_SUPABASE_URL.includes("YOUR_PROJECT_REF") &&
    !window.FLOUNDER_SUPABASE_PUBLISHABLE_KEY.includes("YOUR_PUBLISHABLE_KEY")
);
const supabaseClient = hasSupabaseConfig
    ? window.supabase.createClient(window.FLOUNDER_SUPABASE_URL, window.FLOUNDER_SUPABASE_PUBLISHABLE_KEY)
    : null;
let currentUser = null;
let isSignUpMode = false;
let analyticsRefreshTimer = null;

async function recordAnalytics(eventType, durationSeconds = 0) {
    if (!supabaseClient) {
        return;
    }
    const { error } = await supabaseClient.from("analytics_events").insert({
        event_type: eventType,
        user_id: currentUser?.id || null,
        session_id: analyticsSessionId,
        duration_seconds: durationSeconds
    });
    if (error && currentUser?.email?.toLowerCase() === window.FLOUNDER_ANALYTICS_OWNER_EMAIL?.toLowerCase()) {
        analyticsStatus.textContent = "Analytics events could not be recorded.";
        return;
    }
    if (eventType !== "visit") {
        scheduleAnalyticsRefresh(eventType === "study_time" ? 15000 : 500);
    }
}

function renderAnalytics(data) {
    document.getElementById("analyticsVisits").textContent = data.total_visits || 0;
    document.getElementById("analyticsVisitors").textContent = data.unique_visitors || 0;
    document.getElementById("analyticsUsers").textContent = data.active_users || 0;
    document.getElementById("analyticsStudyTime").textContent = formatStudyTime(data.study_seconds || 0);
    document.getElementById("analyticsNotes").textContent = data.notes_created || 0;
    document.getElementById("analyticsCards").textContent = data.cards_created || 0;
    document.getElementById("analyticsReviews").textContent = data.cards_reviewed || 0;
}

async function loadAnalytics() {
    analyticsSection.hidden = true;
    if (!currentUser || currentUser.email?.toLowerCase() !== window.FLOUNDER_ANALYTICS_OWNER_EMAIL?.toLowerCase()) {
        return;
    }
    analyticsSection.hidden = false;
    const { data, error } = await supabaseClient.rpc("get_site_analytics");
    if (error) {
        analyticsStatus.textContent = "Run the analytics SQL setup to view reports.";
        return;
    }
    renderAnalytics(data[0] || {});
}

function scheduleAnalyticsRefresh(delay) {
    if (!currentUser || currentUser.email?.toLowerCase() !== window.FLOUNDER_ANALYTICS_OWNER_EMAIL?.toLowerCase()) {
        return;
    }
    if (analyticsRefreshTimer) {
        return;
    }
    analyticsRefreshTimer = setTimeout(async () => {
        analyticsRefreshTimer = null;
        await loadAnalytics();
    }, delay);
}

function showApp() {
    authPage.hidden = true;
    appShell.hidden = false;
}

async function signIn(provider) {
    if (!supabaseClient) {
        authStatus.textContent = "Sign-in is not configured yet. Add your Supabase settings first.";
        return;
    }
    if (window.location.protocol === "file:") {
        authStatus.textContent = "Open Flounder through Live Server before signing in.";
        return;
    }

    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: provider.toLowerCase(),
        options: { redirectTo: window.location.href }
    });
    if (error) {
        authStatus.textContent = error.message.includes("provider is not enabled")
            ? `${provider} sign-in is not enabled in Supabase yet.`
            : error.message;
    }
}

async function submitEmailAuth(event) {
    event.preventDefault();
    if (!supabaseClient) {
        authStatus.textContent = "Sign-in is not configured yet. Add your Supabase settings first.";
        return;
    }
    if (window.location.protocol === "file:") {
        authStatus.textContent = "Open Flounder through Live Server before signing in.";
        return;
    }

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    emailSubmitBtn.disabled = true;
    authStatus.textContent = isSignUpMode ? "Creating your account..." : "Signing you in...";

    let result;
    try {
        result = isSignUpMode
            ? await supabaseClient.auth.signUp({
                email,
                password,
                options: { emailRedirectTo: window.location.href }
            })
            : await supabaseClient.auth.signInWithPassword({ email, password });
    } catch (error) {
        authStatus.textContent = error.message || "Authentication failed. Please try again.";
        return;
    } finally {
        emailSubmitBtn.disabled = false;
    }

    if (result.error) {
        const message = result.error.message.toLowerCase();
        authStatus.textContent = message.includes("email not confirmed")
            ? "Please confirm your email address before logging in."
            : message.includes("invalid login credentials")
                ? "Email or password is incorrect."
                : result.error.message;
        return;
    }
    if (isSignUpMode && !result.data.session) {
        authStatus.textContent = "Account created. Check your email to confirm your address, then log in.";
        emailAuthForm.reset();
        return;
    }
    authStatus.textContent = "Signed in successfully.";
    emailAuthForm.reset();
}

function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    emailSubmitBtn.textContent = isSignUpMode ? "Create Account" : "Log In";
    authModeBtn.textContent = isSignUpMode ? "Already have an account? Log in" : "Create an account instead";
    passwordInput.autocomplete = isSignUpMode ? "new-password" : "current-password";
    authStatus.textContent = "";
}

async function logOut() {
    if (!supabaseClient) {
        return;
    }
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        authStatus.textContent = error.message;
    }
}

providerButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const provider = button.dataset.provider;
        authStatus.textContent = `Connecting with ${provider}...`;

        setTimeout(() => signIn(provider), 350);
    });
});

emailAuthForm.addEventListener("submit", submitEmailAuth);
authModeBtn.addEventListener("click", toggleAuthMode);
logoutBtn.addEventListener("click", logOut);

const noteInput = document.getElementById("noteInput");
const addNoteBtn = document.getElementById("addNoteBtn");
const notesContainer = document.getElementById("notesContainer");
const savePadBtn = document.getElementById("savePadBtn");
const notesPad = document.querySelector(".tool-card textarea");
const flashcardForm = document.getElementById("flashcardForm");
const cardQuestionInput = document.getElementById("cardQuestionInput");
const cardAnswerInput = document.getElementById("cardAnswerInput");
const flashcardDeck = document.getElementById("flashcardDeck");
const profileForm = document.getElementById("profileForm");
const nameInput = document.getElementById("nameInput");
const bioInput = document.getElementById("bioInput");
const profileName = document.getElementById("profileName");
const profileBio = document.getElementById("profileBio");
const cancelProfileBtn = document.getElementById("cancelProfileBtn");
const profileSaveStatus = document.getElementById("profileSaveStatus");
const achievementGrid = document.getElementById("achievementGrid");
const achievementCount = document.getElementById("achievementCount");
const totalStudyTime = document.getElementById("totalStudyTime");
const profileStreak = document.getElementById("profileStreak");
const studyStreak = document.getElementById("studyStreak");
const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");
const subjectGrid = document.getElementById("subjectGrid");
const subjectTabs = document.querySelectorAll(".subject-tab");
const gradeSelect = document.getElementById("gradeSelect");

const gradeCatalog = {
    primary: [
        ["Grade 1", "Build strong foundations through simple ideas and guided practice."],
        ["Grade 2", "Strengthen core skills through examples, reading, and everyday problems."],
        ["Grade 3", "Explain your thinking, compare ideas, and work more independently."],
        ["Grade 4", "Apply skills to longer tasks, investigations, and real-world situations."],
        ["Grade 5", "Connect concepts, justify answers, and prepare for advanced study."],
        ["Grade 6", "Review essential foundations and reason confidently across subjects."]
    ],
    secondary: [
        ["Grade 7", "Transition to subject-specialist learning and build dependable study habits."],
        ["Grade 8", "Develop deeper explanations, evidence-based answers, and problem-solving."],
        ["Grade 9", "Use subject vocabulary, analysis, and structured revision more independently."],
        ["Grade 10", "Apply knowledge to extended tasks, assessments, and practical examples."],
        ["Grade 11", "Evaluate complex ideas, manage revision, and prepare for senior exams."],
        ["Grade 12", "Synthesize knowledge, think critically, and prepare for university or work."]
    ]
};

const subjectCatalog = {
    primary: {
        "English Language": ["Alphabet and phonics", "Reading comprehension", "Spelling", "Grammar and punctuation", "Vocabulary", "Creative writing", "Speaking and listening"],
        "Mathematics": ["Numbers and place value", "Addition and subtraction", "Multiplication and division", "Fractions and decimals", "Measurement", "Geometry and shapes", "Data and graphs", "Problem solving"],
        "Science": ["Living things", "Plants", "Animals and habitats", "The human body", "Materials and matter", "Forces and motion", "Light and sound", "Earth and space"],
        "Social Studies": ["Family and community", "Maps and directions", "Local history", "National symbols", "Citizenship", "Culture and traditions", "Basic economics"],
        "Geography": ["Continents and oceans", "Landforms", "Weather and seasons", "Rivers and mountains", "Natural resources", "Environmental care"],
        "History": ["My family history", "Local community history", "Early civilizations", "Important people", "National history", "Timelines and sources"],
        "Computing": ["Computer parts", "Keyboard and mouse skills", "Digital safety", "Algorithms", "Block coding", "Files and folders", "Responsible technology use"],
        "Health and Physical Education": ["Healthy eating", "Personal hygiene", "Safety", "Feelings and relationships", "Movement skills", "Fitness", "Teamwork and fair play"],
        "Creative Arts": ["Drawing and painting", "Colour and pattern", "Music and rhythm", "Drama and storytelling", "Craft and design", "Dance and movement"],
        "Religious and Moral Education": ["Respect", "Kindness", "Honesty", "Community values", "Stories and traditions", "Caring for others"],
        "Languages": ["Greetings", "Everyday vocabulary", "Numbers and time", "Family and home", "Food", "Simple conversations", "Culture"],
        "Life Skills": ["Communication", "Decision making", "Teamwork", "Time management", "Money basics", "Goal setting"]
    },
    secondary: {
        "English Language": ["Reading analysis", "Grammar and syntax", "Academic vocabulary", "Essay writing", "Argument and persuasion", "Research skills", "Oral communication"],
        "English Literature": ["Poetry", "Drama", "Prose fiction", "Character and setting", "Themes and symbolism", "Historical context", "Comparative analysis"],
        "Mathematics": ["Number and algebra", "Equations and inequalities", "Sequences", "Geometry", "Trigonometry", "Statistics", "Probability", "Functions", "Financial mathematics"],
        "Biology": ["Cell biology", "Organisation", "Movement and transport", "Bioenergetics", "Homeostasis", "Inheritance", "Ecology", "Evolution", "Health and disease"],
        "Chemistry": ["Atomic structure", "The periodic table", "Bonding", "Quantitative chemistry", "Chemical changes", "Energy changes", "Rates and equilibrium", "Organic chemistry", "Chemical analysis"],
        "Physics": ["Forces and motion", "Energy", "Waves", "Electricity", "Magnetism", "Particle model", "Atomic physics", "Space physics"],
        "Geography": ["Geographical skills", "Physical landscapes", "Weather and climate", "Ecosystems", "Natural hazards", "Urban issues", "Economic development", "Resource management", "Fieldwork"],
        "History": ["Historical evidence", "Ancient civilizations", "Medieval societies", "Reformation and empire", "Revolutions", "Industrialisation", "World wars", "Independence and civil rights", "Cold War"],
        "Civics and Government": ["Rights and responsibilities", "Democracy", "Constitutions", "Elections", "Law and justice", "Public institutions", "Global citizenship", "Human rights"],
        "Economics and Business": ["Scarcity and choice", "Supply and demand", "Markets", "Production", "Money and banking", "Trade", "Business ownership", "Marketing", "Entrepreneurship"],
        "Computer Science": ["Data representation", "Algorithms", "Programming", "Data structures", "Computer systems", "Networks", "Cybersecurity", "Databases", "Ethical technology"],
        "Design and Technology": ["Design process", "Materials", "Structures", "Electronics", "Product development", "Technical drawing", "Manufacturing", "Sustainability"],
        "Health and Physical Education": ["Anatomy and physiology", "Training principles", "Nutrition", "Sports tactics", "Mental wellbeing", "Personal safety", "Healthy relationships"],
        "Art, Music and Drama": ["Art movements", "Visual analysis", "Composition", "Music theory", "Performance", "Theatre conventions", "Creative collaboration"],
        "Modern Languages": ["Conversation", "Grammar", "Reading", "Writing", "Listening", "Translation", "Culture and society"]
    }
};

let selectedLevel = "primary";

function populateGrades(level, selectedGrade) {
    gradeSelect.innerHTML = "";
    gradeCatalog[level].forEach(([grade]) => {
        const option = document.createElement("option");
        option.value = grade;
        option.textContent = grade;
        gradeSelect.appendChild(option);
    });
    gradeSelect.value = selectedGrade || gradeCatalog[level][0][0];
}

function createTopicInformation(subject, topic, grade, level) {
    const gradeDescription = gradeCatalog[level].find(([name]) => name === grade)?.[1] || "Build knowledge through focused practice.";
    const action = level === "primary"
        ? "Learn the key idea, practise with an example, and explain it in your own words."
        : "Study the key idea, apply it to an example, and support your answer with clear reasoning.";

    return {
        overview: `${topic} in ${subject} helps you develop the knowledge and skills expected in ${grade}.`,
        learningGoal: gradeDescription,
        studyTip: action
    };
}

function renderSubjects(level, grade) {
    selectedLevel = level;
    const activeGrade = grade || gradeSelect.value || gradeCatalog[level][0][0];
    subjectGrid.innerHTML = "";

    Object.entries(subjectCatalog[level]).forEach(([subject, topics]) => {
        const details = document.createElement("details");
        details.className = "subject-card";

        const summary = document.createElement("summary");
        summary.innerHTML = `<span>${subject}</span><span class="topic-count">${topics.length} topics</span>`;
        details.appendChild(summary);

        const topicList = document.createElement("ul");
        topics.forEach((topic) => {
            const topicItem = document.createElement("li");
            const topicTitle = document.createElement("strong");
            topicTitle.textContent = topic;

            const information = createTopicInformation(subject, topic, activeGrade, level);
            const topicOverview = document.createElement("p");
            topicOverview.textContent = information.overview;
            const topicGoal = document.createElement("p");
            topicGoal.innerHTML = `<strong>Grade focus:</strong> ${information.learningGoal}`;
            const topicTip = document.createElement("p");
            topicTip.innerHTML = `<strong>Study move:</strong> ${information.studyTip}`;

            topicItem.append(topicTitle, topicOverview, topicGoal, topicTip);
            topicList.appendChild(topicItem);
        });
        details.appendChild(topicList);
        subjectGrid.appendChild(details);
    });
}

gradeSelect.addEventListener("change", () => {
    renderSubjects(selectedLevel, gradeSelect.value);
});

subjectTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        subjectTabs.forEach((subjectTab) => {
            const isActive = subjectTab === tab;
            subjectTab.classList.toggle("is-active", isActive);
            subjectTab.setAttribute("aria-selected", isActive.toString());
        });
        populateGrades(tab.dataset.level);
        renderSubjects(tab.dataset.level, gradeSelect.value);
    });
});

const achievements = [
    ["First Spark", "Begin with one brave step."],
    ["Curiosity Ignited", "Ask a question and let learning lead."],
    ["Page Turner", "Read one page with purpose."],
    ["Chapter Chaser", "Keep moving through a challenging chapter."],
    ["Note of Intent", "Capture an idea before it fades."],
    ["Thought Collector", "Build a useful collection of notes."],
    ["Question Architect", "Create a question that makes you think."],
    ["Answer Seeker", "Find clarity one answer at a time."],
    ["Flash Point", "Create your first study card."],
    ["Card Crafter", "Build a deck designed for your goals."],
    ["Memory Builder", "Return to a card and strengthen recall."],
    ["Recall Runner", "Practice until the answer feels familiar."],
    ["Focus Found", "Choose your task and give it your attention."],
    ["Deep Work Diver", "Stay with a difficult idea a little longer."],
    ["Distraction Dodger", "Protect your study time from interruptions."],
    ["Quiet Momentum", "Make progress without needing an audience."],
    ["Ten-Minute Triumph", "Turn a short session into real progress."],
    ["Study Sprinter", "Complete a focused burst of learning."],
    ["Steady Flame", "Return to your studies on another day."],
    ["Seven-Day Climb", "Build a full week of consistent effort."],
    ["Fortnight Focus", "Keep your learning rhythm for two weeks."],
    ["Monthly Mindset", "Show up for your goals across a whole month."],
    ["Early Bird Scholar", "Make time for learning before the day gets loud."],
    ["Evening Scholar", "End the day by investing in tomorrow."],
    ["Routine Designer", "Shape a study habit that fits your life."],
    ["Deadline Navigator", "Move forward before pressure takes over."],
    ["Plan in Motion", "Turn an intention into a practical next step."],
    ["Task Tamer", "Bring order to a busy study list."],
    ["Clear Desk, Clear Mind", "Create space for better thinking."],
    ["Priority Pilot", "Know what matters most today."],
    ["Small Win Stacker", "Collect several little victories."],
    ["Progress Tracker", "Look back and recognize how far you have come."],
    ["Goal Mapper", "Give your ambition a direction."],
    ["Milestone Maker", "Reach a meaningful point on your learning path."],
    ["Challenge Accepted", "Meet a difficult topic with courage."],
    ["Mistake Miner", "Turn an error into a valuable lesson."],
    ["Bounce Back Scholar", "Resume after a study setback."],
    ["Patience Practice", "Give understanding the time it needs."],
    ["Courage to Ask", "Seek help when the path is unclear."],
    ["Growth Mindset", "Choose progress over perfection."],
    ["Concept Connector", "Link a new idea to something you know."],
    ["Pattern Finder", "Notice the structure beneath the details."],
    ["Explain It Clearly", "Make knowledge stronger by teaching it back."],
    ["Big Picture Builder", "Connect individual lessons into a wider view."],
    ["Creative Scholar", "Find an original route to understanding."],
    ["Independent Thinker", "Develop an answer in your own words."],
    ["Knowledge Gardener", "Nurture learning with regular attention."],
    ["Future You Helper", "Do something today that tomorrow will thank you for."],
    ["Bright Horizon", "Keep your long-term purpose in sight."],
    ["Flounder Finisher", "Celebrate the commitment to keep learning."]
];

const activityStorageKey = "flounderActivity";
const defaultActivity = { totalSeconds: 0, activeDays: [], notes: 0, cards: 0, reviews: 0 };
let activity = { ...defaultActivity, ...JSON.parse(localStorage.getItem(activityStorageKey) || "{}") };
let lastActivityAt = Date.now();
let newlyUnlockedAchievements = new Set();

function todayKey() {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

function saveActivity() {
    localStorage.setItem(activityStorageKey, JSON.stringify(activity));
    if (currentUser && supabaseClient) {
        clearTimeout(saveActivity.cloudTimer);
        saveActivity.cloudTimer = setTimeout(async () => {
            await supabaseClient.from("user_progress").upsert({
                user_id: currentUser.id,
                display_name: nameInput.value.trim() || "Flounder User",
                bio: bioInput.value.trim() || "Welcome to your Flounder profile.",
                total_seconds: activity.totalSeconds,
                active_days: activity.activeDays,
                notes: activity.notes,
                cards: activity.cards,
                reviews: activity.reviews,
                achievements: JSON.parse(localStorage.getItem("flounderAchievements") || "[]"),
                updated_at: new Date().toISOString()
            });
        }, 500);
    }
}

function recordAction(action) {
    activity[action] += 1;
    saveActivity();
    renderActivity();
}

function getStreak() {
    const days = new Set(activity.activeDays);
    let streak = 0;
    const date = new Date();

    while (days.has(`${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`)) {
        streak += 1;
        date.setDate(date.getDate() - 1);
    }

    return streak;
}

function formatStudyTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes}m`;
    }
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function updateAchievements() {
    const totalMinutes = Math.floor(activity.totalSeconds / 60);
    const streak = getStreak();
    const unlocked = new Set(JSON.parse(localStorage.getItem("flounderAchievements") || "[]"));
    const requirements = [
        () => totalMinutes >= 1, () => activity.notes >= 1, () => totalMinutes >= 5, () => totalMinutes >= 10,
        () => activity.notes >= 1, () => activity.notes >= 3, () => activity.cards >= 1, () => activity.reviews >= 1,
        () => activity.cards >= 1, () => activity.cards >= 3, () => activity.reviews >= 3, () => activity.reviews >= 10,
        () => totalMinutes >= 15, () => totalMinutes >= 30, () => totalMinutes >= 45, () => totalMinutes >= 60,
        () => totalMinutes >= 10, () => totalMinutes >= 20, () => streak >= 2, () => streak >= 7,
        () => streak >= 14, () => streak >= 30, () => new Date().getHours() < 9, () => new Date().getHours() >= 18,
        () => streak >= 3, () => totalMinutes >= 120, () => activity.notes >= 5, () => activity.cards >= 5,
        () => activity.notes >= 10, () => activity.cards >= 10, () => totalMinutes >= 180, () => totalMinutes >= 240,
        () => totalMinutes >= 300, () => totalMinutes >= 360, () => totalMinutes >= 420, () => totalMinutes >= 480,
        () => totalMinutes >= 540, () => streak >= 5, () => totalMinutes >= 600, () => activity.reviews >= 20,
        () => totalMinutes >= 720, () => totalMinutes >= 840, () => totalMinutes >= 960, () => totalMinutes >= 1080,
        () => totalMinutes >= 1200, () => totalMinutes >= 1440, () => totalMinutes >= 1680, () => totalMinutes >= 2160,
        () => totalMinutes >= 2880, () => totalMinutes >= 4320, () => totalMinutes >= 10080
    ];

    requirements.forEach((isMet, index) => {
        if (isMet()) {
            if (!unlocked.has(index)) {
                newlyUnlockedAchievements.add(index);
            }
            unlocked.add(index);
        }
    });
    localStorage.setItem("flounderAchievements", JSON.stringify([...unlocked]));
}

function renderActivity() {
    const streak = getStreak();
    totalStudyTime.textContent = formatStudyTime(activity.totalSeconds);
    profileStreak.textContent = streak;
    studyStreak.textContent = `${streak} day${streak === 1 ? "" : "s"}`;
    const progress = Math.min(100, Math.floor((activity.totalSeconds / (10 * 60 * 60)) * 100));
    progressText.textContent = `${progress}% Complete`;
    progressFill.style.width = `${progress}%`;
    updateAchievements();
    renderAchievements();
}

function recordActivity() {
    if (document.hidden || appShell.hidden) {
        lastActivityAt = Date.now();
        return;
    }

    const now = Date.now();
    const elapsedSeconds = Math.min(60, Math.floor((now - lastActivityAt) / 1000));
    if (elapsedSeconds > 0) {
        activity.totalSeconds += elapsedSeconds;
        recordAnalytics("study_time", elapsedSeconds);
        if (!activity.activeDays.includes(todayKey())) {
            activity.activeDays.push(todayKey());
        }
        saveActivity();
        renderActivity();
    }
    lastActivityAt = now;
}

setInterval(recordActivity, 1000);
document.addEventListener("visibilitychange", () => {
    recordActivity();
    lastActivityAt = Date.now();
});
window.addEventListener("beforeunload", recordActivity);

function renderAchievements() {
    const unlockedAchievements = JSON.parse(localStorage.getItem("flounderAchievements") || "[]");
    achievementGrid.innerHTML = "";

    achievements.forEach(([name, description], index) => {
        const badge = document.createElement("article");
        const isUnlocked = unlockedAchievements.includes(index);
        const hasJustUnlocked = newlyUnlockedAchievements.has(index);
        badge.className = `achievement-badge${isUnlocked ? " is-unlocked" : " is-locked"}${hasJustUnlocked ? " is-new-unlock" : ""}`;

        const icon = document.createElement("span");
        icon.className = "achievement-icon";
        icon.textContent = isUnlocked ? "★" : "✦";
        icon.setAttribute("aria-hidden", "true");

        const title = document.createElement("h3");
        title.textContent = name;

        const text = document.createElement("p");
        text.textContent = description;

        const status = document.createElement("span");
        status.className = "achievement-status";
        status.textContent = isUnlocked ? "Unlocked" : "Locked";

        badge.append(icon, title, text, status);
        achievementGrid.appendChild(badge);
    });

    achievementCount.textContent = `${unlockedAchievements.length} / ${achievements.length}`;
    newlyUnlockedAchievements.clear();
}

function loadProfile() {
    nameInput.value = localStorage.getItem("flounderProfileName") || "Flounder User";
    bioInput.value = localStorage.getItem("flounderProfileBio") || "Welcome to your Flounder profile.";
    profileName.textContent = nameInput.value;
    profileBio.textContent = bioInput.value;
}

async function loadCloudProgress(user) {
    const { data, error } = await supabaseClient
        .from("user_progress")
        .select("display_name, bio, total_seconds, active_days, notes, cards, reviews, achievements")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {
        authStatus.textContent = "Signed in, but cloud progress could not be loaded.";
        return;
    }
    if (!data) {
        activity = { ...defaultActivity };
        localStorage.setItem(activityStorageKey, JSON.stringify(activity));
        localStorage.setItem("flounderAchievements", "[]");
        localStorage.setItem("flounderProfileName", "Flounder User");
        localStorage.setItem("flounderProfileBio", "Welcome to your Flounder profile.");
        loadProfile();
        renderActivity();
        saveActivity();
        return;
    }

    activity = {
        totalSeconds: data.total_seconds || 0,
        activeDays: Array.isArray(data.active_days) ? data.active_days : [],
        notes: data.notes || 0,
        cards: data.cards || 0,
        reviews: data.reviews || 0
    };
    localStorage.setItem(activityStorageKey, JSON.stringify(activity));
    localStorage.setItem("flounderAchievements", JSON.stringify(data.achievements || []));
    localStorage.setItem("flounderProfileName", data.display_name || "Flounder User");
    localStorage.setItem("flounderProfileBio", data.bio || "Welcome to your Flounder profile.");
    loadProfile();
    renderActivity();
}

function saveProfile(event) {
    event.preventDefault();
    const name = nameInput.value.trim();
    const bio = bioInput.value.trim();

    if (!name) {
        nameInput.focus();
        return;
    }

    localStorage.setItem("flounderProfileName", name);
    localStorage.setItem("flounderProfileBio", bio || "Welcome to your Flounder profile.");
    profileName.textContent = name;
    profileBio.textContent = bio || "Welcome to your Flounder profile.";
    profileSaveStatus.textContent = "Profile saved";
    saveActivity();
}

function cancelProfileEdit() {
    loadProfile();
    profileSaveStatus.textContent = "Changes canceled";
}

let flashcards = JSON.parse(localStorage.getItem("flounderFlashcards") || "[]");

function addNote() {
    const text = noteInput.value.trim();

    if (!text) {
        noteInput.focus();
        return;
    }

    document.getElementById("emptyMessage")?.remove();

    const note = document.createElement("div");
    note.className = "note";

    const noteText = document.createElement("p");
    noteText.textContent = text;

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => {
        note.remove();
        if (notesContainer.children.length === 0) {
            notesContainer.innerHTML = "<p id=\"emptyMessage\">Your notes will appear here...</p>";
        }
    });

    note.append(noteText, deleteButton);
    notesContainer.appendChild(note);
    noteInput.value = "";
    recordAction("notes");
    recordAnalytics("note_created");
}

function saveNotesPad() {
    localStorage.setItem("flounderNotesPad", notesPad.value);
    savePadBtn.textContent = "Saved";
    setTimeout(() => {
        savePadBtn.textContent = "Save Note";
    }, 1200);
}

function renderFlashcards() {
    flashcardDeck.innerHTML = "";

    if (flashcards.length === 0) {
        flashcardDeck.innerHTML = "<p class=\"empty-deck\">Your created cards will appear here.</p>";
        return;
    }

    flashcards.forEach((card) => {
        const cardElement = document.createElement("article");
        cardElement.className = "created-flashcard";
        cardElement.dataset.cardId = card.id;

        const cardFace = document.createElement("p");
        cardFace.className = "created-flashcard-face";
        cardFace.textContent = card.question;

        const flipButton = document.createElement("button");
        flipButton.className = "flip-created-card";
        flipButton.type = "button";
        flipButton.textContent = "Show Answer";
        flipButton.addEventListener("click", () => {
            const showingAnswer = cardElement.classList.toggle("is-flipped");
            cardFace.textContent = showingAnswer ? card.answer : card.question;
            flipButton.textContent = showingAnswer ? "Show Question" : "Show Answer";
            if (showingAnswer) {
                recordAction("reviews");
                recordAnalytics("card_reviewed");
            }
        });

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-card";
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => {
            flashcards = flashcards.filter((savedCard) => savedCard.id !== card.id);
            localStorage.setItem("flounderFlashcards", JSON.stringify(flashcards));
            renderFlashcards();
        });

        const cardActions = document.createElement("div");
        cardActions.className = "created-flashcard-actions";
        cardActions.append(flipButton, deleteButton);
        cardElement.append(cardFace, cardActions);
        flashcardDeck.appendChild(cardElement);
    });
}

function createFlashcard(event) {
    event.preventDefault();

    const question = cardQuestionInput.value.trim();
    const answer = cardAnswerInput.value.trim();

    if (!question || !answer) {
        return;
    }

    flashcards.unshift({
        id: Date.now().toString(),
        question,
        answer
    });
    localStorage.setItem("flounderFlashcards", JSON.stringify(flashcards));
    flashcardForm.reset();
    cardQuestionInput.focus();
    renderFlashcards();
    recordAction("cards");
    recordAnalytics("card_created");
}

addNoteBtn.addEventListener("click", addNote);
noteInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        addNote();
    }
});
savePadBtn.addEventListener("click", saveNotesPad);
flashcardForm.addEventListener("submit", createFlashcard);
notesPad.value = localStorage.getItem("flounderNotesPad") || "";
profileForm.addEventListener("submit", saveProfile);
cancelProfileBtn.addEventListener("click", cancelProfileEdit);
loadProfile();
renderFlashcards();
renderAchievements();
populateGrades("primary");
renderSubjects("primary", gradeSelect.value);

async function initializeAuth() {
    if (!supabaseClient) {
        authPage.hidden = false;
        appShell.hidden = true;
        authStatus.textContent = "Connect Supabase to sign in with Apple or Google.";
        renderActivity();
        return;
    }

    const applySession = async (session, signedOutMessage = "") => {
        currentUser = session?.user || null;
        if (!currentUser) {
            authPage.hidden = false;
            appShell.hidden = true;
            analyticsSection.hidden = true;
            authStatus.textContent = signedOutMessage;
            return;
        }
        showApp();
        await loadCloudProgress(currentUser);
        await loadAnalytics();
    };

    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error) {
        authStatus.textContent = "Could not restore your session. Please log in again.";
    }
    recordAnalytics("visit");
    await applySession(session);

    supabaseClient.auth.onAuthStateChange((event, changedSession) => {
        setTimeout(() => applySession(changedSession, event === "SIGNED_OUT" ? "You have been logged out." : ""), 0);
    });
    renderActivity();
}

initializeAuth();



        

