// backend/app.js (Note: This should be in the frontend, e.g., project_root/app.js)

// --- DOM Elements ---
// Authentication related
const authSection = document.getElementById('authSection');
const userStatus = document.getElementById('userStatus');
const loggedInUsername = document.getElementById('loggedInUsername');
const logoutBtn = document.getElementById('logoutBtn');
const loginRegisterForms = document.getElementById('loginRegisterForms');
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const authMessages = document.getElementById('authMessages');
// Course Modal related
const courseModal = document.getElementById('courseModal');
const addCourseBtn = document.getElementById('addCourseBtn'); // Main "Add Course" button
const closeCourseModalBtn = document.getElementById('closeCourseModalBtn');
const cancelCourseBtn = document.getElementById('cancelCourseBtn');
const courseForm = document.getElementById('courseForm');
const modalTitle = document.getElementById('modalTitle');
const deleteCourseBtn = document.getElementById('deleteCourseBtn');
// Schedule and main UI
const scheduleView = document.getElementById('schedule-view');
const notificationsArea = document.getElementById('notifications-area'); // General notifications
const controlsDiv = document.getElementById('controls'); // Container for main controls
// Week Navigation
const prevWeekBtn = document.getElementById('prevWeekBtn');
const todayBtn = document.getElementById('todayBtn');
const nextWeekBtn = document.getElementById('nextWeekBtn');
const currentWeekDisplay = document.getElementById('currentWeekDisplay');
const weekNavDiv = document.getElementById('weekNav');
// Month View specific DOM elements
const monthViewContainer = document.getElementById('monthViewContainer');
const monthGridDays = document.getElementById('monthGridDays');
const monthNavPrevBtn = document.getElementById('prevMonthBtn'); // ID in monthHeader
const monthNavNextBtn = document.getElementById('nextMonthBtn'); // ID in monthHeader
const currentMonthYearDisplay = document.getElementById('currentMonthYearDisplay'); // For month header
// View Switcher Buttons
const weekViewBtn = document.getElementById('weekViewBtn');
const monthViewBtn = document.getElementById('monthViewBtn');
// Reminders
const enableRemindersBtn = document.getElementById('enableRemindersBtn');


// --- Configuration & State ---
const API_BASE_URL = 'http://localhost:3000/api'; // Assuming backend runs on port 3000

// Day Configuration for Timeline View
const DAY_START_HOUR = 7; // 7:00 AM
const DAY_END_HOUR = 22;  // 10:00 PM
const DAY_TOTAL_HOURS = DAY_END_HOUR - DAY_START_HOUR; 

// Week Navigation State
let currentWeekOffset = 0; 

// --- Month View State ---
let currentDisplayMonth = new Date().getMonth(); // 0-indexed (0 for Jan, 11 for Dec)
let currentDisplayYear = new Date().getFullYear();

// --- Active View State ---
let activeView = 'week'; // 'week' or 'month'

// Course Data Store
let courses = []; 


// --- Utility Functions ---
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9); // Longer random part
}

function timeStringToMinutes(timeStr) {
    if (!timeStr || !timeStr.includes(':')) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

function timeToPercentage(timeStr, dayStartHour, dayTotalHours) {
    if (dayTotalHours <= 0) return 0; // Avoid division by zero
    const courseTimeInMinutes = timeStringToMinutes(timeStr);
    const dayStartTimeInMinutes = dayStartHour * 60;
    const dayTotalMinutes = dayTotalHours * 60;
    const minutesFromDayStart = courseTimeInMinutes - dayStartTimeInMinutes;
    if (minutesFromDayStart < 0) return 0;
    if (minutesFromDayStart > dayTotalMinutes) return 100; // Should ideally not happen if course is within day
    return (minutesFromDayStart / dayTotalMinutes) * 100;
}

function durationToPercentage(startTimeStr, endTimeStr, dayTotalHours) {
    if (dayTotalHours <= 0) return 0;
    const startMinutes = timeStringToMinutes(startTimeStr);
    const endMinutes = timeStringToMinutes(endTimeStr);
    const dayTotalMinutes = dayTotalHours * 60;
    let durationInMinutes = endMinutes - startMinutes;
    if (durationInMinutes <= 0) durationInMinutes = 15; // Min visual duration
    return (durationInMinutes / dayTotalMinutes) * 100;
}

// --- Calendar Utility Functions (New or add to existing // --- Utility Functions ---) ---

/**
 * Gets the number of days in a specific month and year.
 * @param {number} year The full year (e.g., 2024).
 * @param {number} month The month (0-indexed, 0 for January).
 * @returns {number} The number of days in the month.
 */
function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

/**
 * Gets the day of the week for the first day of a specific month.
 * @param {number} year The full year (e.g., 2024).
 * @param {number} month The month (0-indexed, 0 for January).
 * @returns {number} The day of the week (0 for Sunday, 1 for Monday, ..., 6 for Saturday).
 */
function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
}

/**
 * Updates the month display header (e.g., "November 2024").
 * This function assumes an HTML element with ID 'currentMonthYearDisplay' will be created later
 * as part of the month view's HTML structure.
 */
function updateMonthDisplayHeader() {
    const monthYearDisplay = document.getElementById('currentMonthYearDisplay');
    if (monthYearDisplay) {
        const date = new Date(currentDisplayYear, currentDisplayMonth);
        const options = { year: 'numeric', month: 'long' };
        monthYearDisplay.textContent = date.toLocaleDateString(undefined, options);
    } else {
        // This element will be part of monthViewContainer, so might not exist when app.js first loads.
        // console.warn("#currentMonthYearDisplay element not found yet for header update.");
    }
}

// --- Authentication Functions ---
function getAuthToken() {
    return localStorage.getItem('authToken');
}

function storeAuthToken(token) {
    localStorage.setItem('authToken', token);
}

function removeAuthToken() {
    localStorage.removeItem('authToken');
}

function updateAuthUI() {
    const token = getAuthToken();
    const appContainer = document.getElementById('app-container'); // Week view's main container

    if (token) { // User is logged IN
        if (loginRegisterForms) loginRegisterForms.style.display = 'none';
        if (userStatus) userStatus.style.display = 'block';
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1])); 
            if (loggedInUsername && payload.user && payload.user.username) {
                 loggedInUsername.textContent = payload.user.username;
            }
        } catch (e) {
            console.error("Error decoding token for username:", e);
            if (loggedInUsername) loggedInUsername.textContent = "User";
        }

        if (controlsDiv) controlsDiv.style.display = 'block'; // Show main controls area
        if (addCourseBtn) addCourseBtn.style.display = 'inline-block'; 
        if (enableRemindersBtn) enableRemindersBtn.style.display = 'inline-block';
        // Visibility of appContainer vs monthViewContainer is handled by switchToView

    } else { // User is logged OUT
        if (loginRegisterForms) loginRegisterForms.style.display = 'block';
        if (userStatus) userStatus.style.display = 'none';
        if (loggedInUsername) loggedInUsername.textContent = '';
        
        if (controlsDiv) controlsDiv.style.display = 'none'; // Hide main controls
        if (appContainer) appContainer.style.display = 'none'; // Hide week view container
        if (monthViewContainer) monthViewContainer.style.display = 'none'; // Hide month view container
        
        // Display login prompt directly in scheduleView's usual spot if it's within app-container
        // Or, if scheduleView is separate, manage its content.
        // For now, assuming scheduleView is within app-container which is hidden.
        // A general message could be placed in notificationsArea or authMessages.
        if (notificationsArea) notificationsArea.textContent = 'Please log in or register.';


        courses = []; // Clear courses data
        if (scheduleView) scheduleView.innerHTML = ''; // Clear any residual schedule
        if (monthGridDays) monthGridDays.innerHTML = ''; // Clear any residual month grid

        if (authMessages) { 
            authMessages.textContent = '';
            authMessages.className = '';
        }
    }
}

function handleLogout() {
    console.log("Handling logout...");
    removeAuthToken();
    courses = []; // Clear courses
    updateAuthUI(); // Update UI to logged-out state
    // renderSchedule(); // updateAuthUI now clears schedule view if needed
    if (authMessages) {
        authMessages.textContent = 'You have been successfully logged out.';
        authMessages.className = 'success';
        setTimeout(() => {
            if (authMessages) {
                authMessages.textContent = '';
                authMessages.className = '';
            }
        }, 3000);
    }
}

async function authenticatedFetch(url, options = {}) {
    const token = getAuthToken();
    const defaultHeaders = { 'Content-Type': 'application/json' };
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    options.headers = { ...defaultHeaders, ...options.headers };

    try {
        const response = await fetch(url, options);
        if (response.status === 401) {
            console.log('Authentication failed (401). Logging out.');
            handleLogout();
            if (authMessages) {
                 authMessages.textContent = "Your session has expired or is invalid. Please log in again.";
                 authMessages.className = 'error';
            }
            throw new Error('Unauthorized: Session expired or token invalid.');
        }
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `HTTP error! Status: ${response.status}` }));
            console.error('API Error:', errorData);
            throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
        }
        if (response.status === 204) return null; // No content
        return await response.json();
    } catch (error) {
        console.error('authenticatedFetch error:', error.message);
        if (authMessages && !authMessages.textContent.includes("session has expired")) {
             authMessages.textContent = error.message || 'An API error occurred.';
             authMessages.className = 'error';
        }
        throw error;
    }
}

// --- Event Listeners for Auth Forms ---
if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const username = document.getElementById('regUsername').value.trim();
        const password = document.getElementById('regPassword').value;

        if (!username || !password) {
            if (authMessages) { authMessages.textContent = 'Username and password are required.'; authMessages.className = 'error';}
            return;
        }
        if (password.length < 6) {
             if (authMessages) { authMessages.textContent = 'Password must be at least 6 characters.'; authMessages.className = 'error';}
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || `Registration failed. Status: ${response.status}`);
            }
            if (authMessages) {
                authMessages.textContent = 'Registration successful! Please log in.';
                authMessages.className = 'success';
            }
            registerForm.reset();
        } catch (error) {
            console.error('Registration error:', error);
            if (authMessages) {
                authMessages.textContent = error.message;
                authMessages.className = 'error';
            }
        }
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!username || !password) {
            if (authMessages) {authMessages.textContent = 'Username and password are required.'; authMessages.className = 'error';}
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || `Login failed. Status: ${response.status}`);
            }
            storeAuthToken(data.token);
            updateAuthUI(); // Update UI to logged-in state
            await loadCoursesFromServer(); // Load user-specific courses
            if (authMessages) { authMessages.textContent = 'Login successful!'; authMessages.className = 'success';}
            loginForm.reset();
             setTimeout(() => { if (authMessages) {authMessages.textContent = ''; authMessages.className = '';}}, 3000);
        } catch (error) {
            console.error('Login error:', error);
            if (authMessages) {
                authMessages.textContent = error.message;
                authMessages.className = 'error';
            }
            removeAuthToken(); // Ensure no partial login state
            updateAuthUI();
        }
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        handleLogout();
    });
}

// --- Course Data Loading from Server ---
async function loadCoursesFromServer() {
    if (!getAuthToken()) { // Don't attempt to load if not logged in
        console.log("Not logged in. Skipping course load.");
        courses = [];
        renderSchedule(); // Ensure schedule is cleared or shows login prompt
        return;
    }
    try {
        const result = await authenticatedFetch(`${API_BASE_URL}/courses`);
        if (result && result.data && Array.isArray(result.data)) {
            courses = result.data;
        } else {
            courses = [];
        }
        console.log("Courses loaded from server:", courses);
    } catch (error) {
        console.error("Error in loadCoursesFromServer (after auth handling):", error.message);
        courses = []; // Clear courses on error
        // Message already handled by authenticatedFetch for 401, or set there for other errors.
    }
    renderSchedule();
}

// --- Course Modal Handling ---
function openCourseModal(course = null) {
    // ... (Keep existing openCourseModal logic as previously defined)
    // Ensure it resets form, sets title, populates for edit, handles delete button visibility
    if (!courseModal || !courseForm || !modalTitle || !deleteCourseBtn) {
        console.error("Modal elements not found for openCourseModal!");
        return;
    }
    courseForm.reset();
    document.getElementById('courseId').value = '';

    if (course) {
        modalTitle.textContent = 'Edit Course';
        document.getElementById('courseId').value = course.id;
        document.getElementById('courseName').value = course.name;
        document.getElementById('startTime').value = course.startTime;
        document.getElementById('endTime').value = course.endTime;
        document.getElementById('dayOfWeek').value = course.dayOfWeek;
        document.getElementById('courseColor').value = course.color;
        document.getElementById('instructor').value = course.instructor || '';
        document.getElementById('location').value = course.location || '';
        deleteCourseBtn.style.display = 'inline-block';
    } else {
        modalTitle.textContent = 'Add New Course';
        deleteCourseBtn.style.display = 'none';
        document.getElementById('courseColor').value = '#4A90E2';
    }
    courseModal.style.display = 'block';
}

function closeCourseModal() {
    if (!courseModal) return;
    courseModal.style.display = 'none';
}

if (addCourseBtn) { // Main "Add Course" button
    addCourseBtn.addEventListener('click', () => openCourseModal());
}
if (closeCourseModalBtn) {
    closeCourseModalBtn.addEventListener('click', closeCourseModal);
}
if (cancelCourseBtn) {
    cancelCourseBtn.addEventListener('click', closeCourseModal);
}
window.addEventListener('click', (event) => {
    if (event.target === courseModal) {
        closeCourseModal();
    }
});

// --- Course Form Submission (Add/Edit) ---
if (courseForm) {
    courseForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const courseId = document.getElementById('courseId').value;
        // ... (retrieve all other form fields: courseName, startTime, etc.)
        const courseName = document.getElementById('courseName').value.trim();
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        const dayOfWeek = parseInt(document.getElementById('dayOfWeek').value, 10);
        const courseColor = document.getElementById('courseColor').value;
        const instructor = document.getElementById('instructor').value.trim();
        const location = document.getElementById('location').value.trim();

        if (!courseName || !startTime || !endTime) {
            if (notificationsArea) notificationsArea.textContent = "Required fields: Name, Start Time, End Time.";
            return;
        }
        if (endTime <= startTime) {
            if (notificationsArea) notificationsArea.textContent = "End time must be after start time.";
            return;
        }

        const courseData = { name: courseName, startTime, endTime, dayOfWeek, color: courseColor, instructor, location };
        let message = "";
        let success = false;

        try {
            if (courseId) { // Editing
                const result = await authenticatedFetch(`${API_BASE_URL}/courses/${courseId}`, {
                    method: 'PUT',
                    body: JSON.stringify(courseData),
                });
                message = `Course "${result.data.name || courseName}" updated!`; // Use returned name if available
                success = true;
            } else { // Adding
                const courseWithClientId = { ...courseData, id: generateUniqueId() };
                const result = await authenticatedFetch(`${API_BASE_URL}/courses`, {
                    method: 'POST',
                    body: JSON.stringify(courseWithClientId),
                });
                message = `Course "${result.data.name}" added!`;
                success = true;
            }

            if (success) {
                if (notificationsArea) notificationsArea.textContent = message;
                await loadCoursesFromServer();
                closeCourseModal();
            }
        } catch (error) {
            console.error("Error saving course:", error.message);
            if (notificationsArea) notificationsArea.textContent = error.message || "Error saving course.";
        } finally {
            if (success && notificationsArea) {
                setTimeout(() => { if (notificationsArea) notificationsArea.textContent = ''; }, 3000);
            }
        }
    });
}

// --- Delete Course Logic ---
if (deleteCourseBtn) {
    deleteCourseBtn.addEventListener('click', async function() {
        const courseId = document.getElementById('courseId').value;
        if (!courseId) {
            if (notificationsArea) notificationsArea.textContent = "Cannot delete: Course ID missing.";
            return;
        }
        if (window.confirm("Are you sure you want to delete this course?")) {
            try {
                await authenticatedFetch(`${API_BASE_URL}/courses/${courseId}`, { method: 'DELETE' });
                if (notificationsArea) notificationsArea.textContent = "Course deleted successfully.";
                await loadCoursesFromServer();
                closeCourseModal();
            } catch (error) {
                console.error("Error deleting course:", error.message);
                if (notificationsArea) notificationsArea.textContent = error.message || "Error deleting course.";
            } finally {
                 if (notificationsArea && notificationsArea.textContent.includes("deleted")) { // Simple check
                    setTimeout(() => { if (notificationsArea) notificationsArea.textContent = ''; }, 3000);
                }
            }
        }
    });
}

// --- Schedule Rendering ---
function renderSchedule() {
    // ... (Keep existing renderSchedule logic as defined in "Timeline View" and "Overlap Handling" steps)
    // It should use DAY_START_HOUR, DAY_TOTAL_HOURS, timeToPercentage, durationToPercentage,
    // handle day headers, current day highlighting, course item creation with click for edit,
    // and z-index for overlaps.
    if (!scheduleView) { console.error("Schedule view element not found!"); return; }
    scheduleView.innerHTML = ''; 
    if (!getAuthToken() && loginRegisterForms && loginRegisterForms.style.display !== 'none') {
        // If not logged in and login forms are visible, show login prompt in schedule area.
        // updateAuthUI already handles this, so renderSchedule might not need to repeat it if called after updateAuthUI.
        // However, direct calls to renderSchedule might occur.
        scheduleView.innerHTML = '<p style="text-align:center; padding: 20px;">Please log in or register to manage your schedule.</p>';
        return;
    }


    scheduleView.style.display = 'grid';
    scheduleView.style.gridTemplateColumns = 'repeat(7, 1fr)';
    scheduleView.style.gap = '5px';
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    days.forEach((day, index) => {
        const dayHeader = document.createElement('div');
        dayHeader.classList.add('day-header');
        dayHeader.textContent = day;
        if (currentWeekOffset === 0) {
            const today = new Date();
            const currentActualDayOfWeek = today.getDay();
            if (index === currentActualDayOfWeek) {
                dayHeader.style.backgroundColor = '#007bff'; dayHeader.style.color = 'white'; dayHeader.style.fontWeight = 'bold';
            } else {
                dayHeader.style.backgroundColor = '#e9ecef'; dayHeader.style.color = '#333'; dayHeader.style.fontWeight = 'normal';
            }
        } else {
            dayHeader.style.backgroundColor = '#e9ecef'; dayHeader.style.color = '#333'; dayHeader.style.fontWeight = 'normal';
        }
        dayHeader.style.gridColumn = (index + 1); dayHeader.style.gridRow = 1;
        scheduleView.appendChild(dayHeader);
    });

    const courseSlotsContainer = document.createElement('div');
    courseSlotsContainer.style.gridColumn = '1 / span 7'; courseSlotsContainer.style.gridRow = 2;
    courseSlotsContainer.style.display = 'grid'; courseSlotsContainer.style.gridTemplateColumns = 'repeat(7, 1fr)';
    courseSlotsContainer.style.minHeight = '900px'; // From .day-column CSS
    scheduleView.appendChild(courseSlotsContainer);

    const dayColumnElements = {};
    for (let i = 0; i < 7; i++) {
        const dayColumn = document.createElement('div');
        dayColumn.classList.add('day-column'); dayColumn.classList.add(`day-column-${i}`);
        dayColumn.style.gridColumn = (i + 1);
        courseSlotsContainer.appendChild(dayColumn);
        dayColumnElements[i] = dayColumn;
    }

    if (courses && courses.length > 0) {
        courses.forEach(course => {
            const courseElement = document.createElement('div');
            courseElement.classList.add('course-item');
            const topPercent = timeToPercentage(course.startTime, DAY_START_HOUR, DAY_TOTAL_HOURS);
            const heightPercent = durationToPercentage(course.startTime, course.endTime, DAY_TOTAL_HOURS);
            courseElement.style.top = `${topPercent}%`; courseElement.style.height = `${heightPercent}%`;
            courseElement.style.backgroundColor = course.color || '#4A90E2';
            const startTimeInMinutes = timeStringToMinutes(course.startTime);
            courseElement.style.zIndex = Math.floor(startTimeInMinutes / 10) + 1;

            const nameElement = document.createElement('strong'); nameElement.textContent = course.name;
            const timeElement = document.createElement('p'); timeElement.textContent = `${course.startTime} - ${course.endTime}`;
            courseElement.appendChild(nameElement); courseElement.appendChild(timeElement);
            courseElement.addEventListener('click', () => openCourseModal(course));
            if (dayColumnElements[course.dayOfWeek]) {
                dayColumnElements[course.dayOfWeek].appendChild(courseElement);
            }
        });
    } else if (getAuthToken()) { // Only show "no courses" if logged in but no courses
        const noCoursesMessage = document.createElement('p');
        noCoursesMessage.textContent = 'No courses scheduled yet. Add a course!';
        noCoursesMessage.style.textAlign = 'center'; noCoursesMessage.style.gridColumn = '1 / span 7';
        noCoursesMessage.style.padding = '20px';
        courseSlotsContainer.appendChild(noCoursesMessage);
    } else {
        // If not logged in, updateAuthUI handles the message in scheduleView.
        // This part of renderSchedule might not even be reached if updateAuthUI clears scheduleView.
    }
}

// --- Month View Rendering Logic ---

function renderMonthView() {
    if (!monthViewContainer || !monthGridDays) {
        console.error("Month view container or day grid not found!");
        return;
    }
    if (monthViewContainer.style.display === 'none') {
        // Don't render if the view is hidden; it will be rendered when shown.
        return;
    }

    updateMonthDisplayHeader(); // Update "Month Year" display

    monthGridDays.innerHTML = ''; // Clear previous month's cells

    const year = currentDisplayYear;
    const month = currentDisplayMonth; // 0-indexed

    const firstDay = getFirstDayOfMonth(year, month); // 0 (Sun) - 6 (Sat)
    const daysInCurrentMonth = getDaysInMonth(year, month);

    // Calculate days from previous month
    const prevMonth = (month === 0) ? 11 : month - 1;
    const prevMonthYear = (month === 0) ? year - 1 : year;
    const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth);

    let dayCellCount = 0;

    // Render days from previous month
    for (let i = 0; i < firstDay; i++) {
        const day = daysInPrevMonth - firstDay + 1 + i;
        const cell = createDayCell(day, prevMonthYear, prevMonth, false);
        monthGridDays.appendChild(cell);
        dayCellCount++;
    }

    // Render days for current month
    for (let day = 1; day <= daysInCurrentMonth; day++) {
        const cell = createDayCell(day, year, month, true);
        monthGridDays.appendChild(cell);
        dayCellCount++;
    }

    // Render days from next month to fill up the grid (usually to 35 or 42 cells for 5 or 6 weeks)
    const nextMonth = (month === 11) ? 0 : month + 1;
    const nextMonthYear = (month === 11) ? year + 1 : year;
    let day = 1;
    // Ensure grid has at least 5 weeks (35 cells), or 6 weeks (42 cells) if needed.
    // Most common is 6 weeks to handle all month layouts.
    while (dayCellCount < 42) { 
        const cell = createDayCell(day, nextMonthYear, nextMonth, false);
        monthGridDays.appendChild(cell);
        day++;
        dayCellCount++;
    }
}

/**
 * Helper function to create a single day cell for the month view.
 * @param {number} dayNumber - The number of the day.
 * @param {number} year - The year of this day.
 * @param {number} month - The month (0-indexed) of this day.
 * @param {boolean} isCurrentMonth - True if the day belongs to the currently displayed month.
 * @returns {HTMLElement} The created day cell element.
 */
function createDayCell(dayNumber, year, month, isCurrentMonth) {
    const cell = document.createElement('div');
    cell.classList.add('month-day-cell');
    if (!isCurrentMonth) {
        cell.classList.add('not-current-month');
    }

    const dayNumDiv = document.createElement('div');
    dayNumDiv.classList.add('day-number');
    dayNumDiv.textContent = dayNumber;
    cell.appendChild(dayNumDiv);

    // Highlight today
    const today = new Date();
    if (isCurrentMonth && 
        dayNumber === today.getDate() && 
        month === today.getMonth() && 
        year === today.getFullYear()) {
        cell.classList.add('current-day');
    }

    // Add course indicators (simplified: based on dayOfWeek)
    if (isCurrentMonth && courses && courses.length > 0) {
        const courseIndicatorsDiv = document.createElement('div');
        courseIndicatorsDiv.classList.add('course-indicators');
        
        const cellDate = new Date(year, month, dayNumber);
        const dayOfWeekOfCell = cellDate.getDay(); // 0 for Sunday, 6 for Saturday

        const coursesOnThisDayOfWeek = courses.filter(course => course.dayOfWeek === dayOfWeekOfCell);
        
        // Limit number of dots for visual clarity
        const maxDots = 3; 
        coursesOnThisDayOfWeek.slice(0, maxDots).forEach(course => {
            const dot = document.createElement('span');
            dot.classList.add('course-dot');
            dot.style.backgroundColor = course.color || '#4A90E2'; // Use course color
            dot.title = course.name; // Show course name on hover
            courseIndicatorsDiv.appendChild(dot);
        });
        if(coursesOnThisDayOfWeek.length > maxDots){
            const moreIndicator = document.createElement('span');
            moreIndicator.textContent = `+${coursesOnThisDayOfWeek.length - maxDots}`;
            moreIndicator.style.fontSize = '0.7em';
            moreIndicator.style.marginLeft = '3px';
            courseIndicatorsDiv.appendChild(moreIndicator);
        }

        if (coursesOnThisDayOfWeek.length > 0) {
             cell.appendChild(courseIndicatorsDiv);
        }
    }
    
    // Add click listener to day cell (optional for future: show day view or courses for this day)
    // cell.addEventListener('click', () => console.log(`Clicked on ${month + 1}/${dayNumber}/${year}`));

    return cell;
}

// --- View Switching Logic ---

function switchToView(viewName) {
    const appContainer = document.getElementById('app-container'); // Contains week view's scheduleView

    if (viewName === 'month') {
        activeView = 'month';
        if (appContainer) appContainer.style.display = 'none'; // Hide week view's main container
        if (weekNavDiv) weekNavDiv.style.display = 'none'; // Hide week navigation
        if (monthViewContainer) monthViewContainer.style.display = 'block'; // Show month view

        if (monthViewBtn) monthViewBtn.classList.add('active-view');
        if (weekViewBtn) weekViewBtn.classList.remove('active-view');
        
        // Initialize month view to current actual month/year when switching
        const today = new Date();
        currentDisplayMonth = today.getMonth();
        currentDisplayYear = today.getFullYear();
        renderMonthView();

    } else { // Default to 'week' view
        activeView = 'week';
        if (monthViewContainer) monthViewContainer.style.display = 'none'; // Hide month view
        if (appContainer) appContainer.style.display = 'block'; // Show week view's main container
        if (weekNavDiv) weekNavDiv.style.display = 'flex'; // Assuming weekNav is flex for layout

        if (weekViewBtn) weekViewBtn.classList.add('active-view');
        if (monthViewBtn) monthViewBtn.classList.remove('active-view');
        
        // currentWeekOffset should already be correct for week view
        renderSchedule();
    }
}

if (weekViewBtn) {
    weekViewBtn.addEventListener('click', () => switchToView('week'));
}

if (monthViewBtn) {
    monthViewBtn.addEventListener('click', () => switchToView('month'));
}

// --- Month Navigation Event Listeners ---

// Note: monthNavPrevBtn and monthNavNextBtn are already declared in DOM Elements section,
// using IDs 'prevMonthBtn' and 'nextMonthBtn' from the month view header.
if (monthNavPrevBtn) {
    monthNavPrevBtn.addEventListener('click', () => {
        currentDisplayMonth--;
        if (currentDisplayMonth < 0) {
            currentDisplayMonth = 11; // December (0-indexed)
            currentDisplayYear--;
        }
        renderMonthView(); // This will also call updateMonthDisplayHeader
    });
}

if (monthNavNextBtn) {
    monthNavNextBtn.addEventListener('click', () => {
        currentDisplayMonth++;
        if (currentDisplayMonth > 11) {
            currentDisplayMonth = 0; // January (0-indexed)
            currentDisplayYear++;
        }
        renderMonthView(); // This will also call updateMonthDisplayHeader
    });
}

// --- Week Navigation ---
function getWeekDates(offset = 0) {
    // ... (Keep existing getWeekDates logic)
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const currentDayOfWeek = today.getDay();
    const dateForTargetWeek = new Date(today);
    dateForTargetWeek.setDate(today.getDate() - currentDayOfWeek + (offset * 7));
    const startDate = new Date(dateForTargetWeek);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    return { startDate, endDate };
}

function updateWeekDisplay() {
    // ... (Keep existing updateWeekDisplay logic)
    if (!currentWeekDisplay) return;
    const { startDate, endDate } = getWeekDates(currentWeekOffset);
    const options = { month: 'short', day: 'numeric' };
    const yearOption = { year: 'numeric' };
    let displayStr;
    if (startDate.getMonth() === endDate.getMonth()) {
        displayStr = `${startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString(undefined, { day: 'numeric' })}, ${startDate.getFullYear()}`;
    } else {
        const yearStr = (startDate.getFullYear() === endDate.getFullYear()) 
                        ? startDate.toLocaleDateString(undefined, yearOption)
                        : `${startDate.toLocaleDateString(undefined, yearOption)} / ${endDate.toLocaleDateString(undefined, yearOption)}`;
        displayStr = `${startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${yearStr}`;
    }
    if (startDate.getFullYear() !== endDate.getFullYear()) {
         displayStr = `${startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} - ${endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    currentWeekDisplay.textContent = displayStr;
}

if (prevWeekBtn) prevWeekBtn.addEventListener('click', () => { currentWeekOffset--; updateWeekDisplay(); renderSchedule(); });
if (nextWeekBtn) nextWeekBtn.addEventListener('click', () => { currentWeekOffset++; updateWeekDisplay(); renderSchedule(); });
if (todayBtn) todayBtn.addEventListener('click', () => { currentWeekOffset = 0; updateWeekDisplay(); renderSchedule(); });


// --- Reminders ---
function requestNotificationPermission() { /* ... (Keep existing) ... */ 
    if (!("Notification" in window)) {
        if(notificationsArea) notificationsArea.textContent = "Browser doesn't support notifications."; return;
    }
    Notification.requestPermission().then(permission => {
        let message = "";
        if (permission === "granted") {
            message = "Notification permission granted! Reminders active.";
            if(enableRemindersBtn) enableRemindersBtn.disabled = true;
            scheduleRemindersForToday();
        } else {
            message = "Notification permission denied.";
        }
        if(notificationsArea) notificationsArea.textContent = message;
        setTimeout(() => { if (notificationsArea) notificationsArea.textContent = ''; }, 3000);
    });
}
if (enableRemindersBtn) enableRemindersBtn.addEventListener('click', requestNotificationPermission);

function scheduleRemindersForToday() { /* ... (Keep existing) ... */
    if (Notification.permission !== "granted" || !getAuthToken()) return; // Only if logged in & permission granted
    const now = new Date(); const todayDayOfWeek = now.getDay(); const reminderLeadTimeMinutes = 5;
    courses.forEach(course => {
        if (course.dayOfWeek === todayDayOfWeek) {
            const [hours, minutes] = course.startTime.split(':').map(Number);
            const courseStartTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
            const reminderTime = new Date(courseStartTime.getTime() - reminderLeadTimeMinutes * 60000);
            if (reminderTime > now) {
                const timeUntilReminder = reminderTime.getTime() - now.getTime();
                setTimeout(() => {
                    new Notification("Upcoming Class: " + course.name, {
                        body: `Starts at ${course.startTime} in ${course.location || 'class'}.`,
                        icon: './favicon.ico' 
                    });
                }, timeUntilReminder);
            }
        }
    });
}


// --- Initial Load (DOMContentLoaded) ---
document.addEventListener('DOMContentLoaded', async () => {
    updateAuthUI(); // Set initial UI based on token presence

    if (getAuthToken()) { // Only load courses if token exists
        await loadCoursesFromServer(); // This will call renderSchedule internally
        switchToView('week'); // Default to week view after login and data load
        
        // Reminder setup
        if (Notification.permission === "granted") {
            if(enableRemindersBtn) enableRemindersBtn.disabled = true;
            scheduleRemindersForToday();
        } else if (Notification.permission === "denied"){
             if(enableRemindersBtn) enableRemindersBtn.disabled = true;
        }
    } else {
        // updateAuthUI handles hiding main content if not logged in.
        // No specific view needs to be "switched to" as all content areas are hidden.
        console.log("No auth token found on load. User needs to log in.");
    }
    
    // Initialize week display for week view (it's hidden if not in week view by switchToView or updateAuthUI)
    updateWeekDisplay(); 

    // Reminder button state (can be set regardless of login, as it reflects browser permission)
    if (Notification.permission === "granted" || Notification.permission === "denied") {
        if(enableRemindersBtn) enableRemindersBtn.disabled = true;
    }
    // scheduleRemindersForToday() is called above if permission granted AND logged in.
});
