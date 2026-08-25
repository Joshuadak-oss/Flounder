const authPage = document.getElementById("authPage");
const appShell = document.getElementById("appShell");
const authStatus = document.getElementById("authStatus");
const providerButtons = document.querySelectorAll("[data-provider]");

function signIn(provider) {
    localStorage.setItem("flounderAuthProvider", provider);
    authPage.hidden = true;
    appShell.hidden = false;
}

providerButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const provider = button.dataset.provider;
        authStatus.textContent = `Connecting with ${provider}...`;

        setTimeout(() => signIn(provider), 350);
    });
});

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

function renderAchievements() {
    const unlockedAchievements = JSON.parse(localStorage.getItem("flounderAchievements") || "[0]");
    achievementGrid.innerHTML = "";

    achievements.forEach(([name, description], index) => {
        const badge = document.createElement("article");
        const isUnlocked = unlockedAchievements.includes(index);
        badge.className = `achievement-badge${isUnlocked ? " is-unlocked" : " is-locked"}`;

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
}

function loadProfile() {
    nameInput.value = localStorage.getItem("flounderProfileName") || "Flounder User";
    bioInput.value = localStorage.getItem("flounderProfileBio") || "Welcome to your Flounder profile.";
    profileName.textContent = nameInput.value;
    profileBio.textContent = bioInput.value;
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



        

