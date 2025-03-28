document.addEventListener('DOMContentLoaded', function() {
    const semesterFilter = document.getElementById('semester-filter');
    const coursesContainer = document.getElementById('courses-container');
    const feedbackForm = document.getElementById('feedback-form');
    const feedbackMessage = document.getElementById('feedback-message');

    // Load courses from cours.json
    async function loadCourses() {
        try {
            coursesContainer.innerHTML = '<div class="loading">Chargement des cours...</div>';
            
            const response = await fetch('cours.json');
            if (!response.ok) {
                throw new Error('Erreur de chargement des données');
            }
            
            const data = await response.json();
            displayCourses(data);
            setupFilter(data);
            
        } catch (error) {
            console.error('Error:', error);
            coursesContainer.innerHTML = `
                <div class="error">
                    <p>Erreur de chargement des cours</p>
                    <button onclick="location.reload()">Réessayer</button>
                </div>
            `;
        }
    }

    // Display courses in the DOM
    function displayCourses(coursesData) {
        coursesContainer.innerHTML = '';
        
        Object.entries(coursesData).forEach(([semester, courses]) => {
            const semesterElement = document.createElement('div');
            semesterElement.className = 'semester';
            semesterElement.dataset.semester = semester.toLowerCase().replace(' ', '-');
            
            const semesterTitle = document.createElement('h3');
            semesterTitle.textContent = semester;
            semesterElement.appendChild(semesterTitle);
            
            const coursesList = document.createElement('div');
            coursesList.className = 'course-cards';
            
            courses.forEach(course => {
                const courseCard = document.createElement('div');
                courseCard.className = 'course-card';
                
                const courseName = document.createElement('h4');
                courseName.textContent = course.name;
                
                const courseLink = document.createElement('a');
                courseLink.href = course.url;
                courseLink.className = 'course-link';
                courseLink.textContent = 'Accéder au cours';
                courseLink.target = '_blank';
                
                if (course.url === '#') {
                    courseLink.style.opacity = '0.6';
                    courseLink.style.cursor = 'not-allowed';
                    courseLink.addEventListener('click', (e) => e.preventDefault());
                }
                
                courseCard.appendChild(courseName);
                courseCard.appendChild(courseLink);
                coursesList.appendChild(courseCard);
            });
            
            semesterElement.appendChild(coursesList);
            coursesContainer.appendChild(semesterElement);
        });
    }

    // Setup semester filter
    function setupFilter(coursesData) {
        // Clear existing options except "Tous les semestres"
        while (semesterFilter.options.length > 1) {
            semesterFilter.remove(1);
        }
        
        // Add options for each semester
        Object.keys(coursesData).forEach(semester => {
            const option = document.createElement('option');
            option.value = semester.toLowerCase().replace(' ', '-');
            option.textContent = semester;
            semesterFilter.appendChild(option);
        });
        
        // Add event listener for filtering
        semesterFilter.addEventListener('change', filterCourses);
    }

    // Filter courses by semester
    function filterCourses() {
        const selectedSemester = semesterFilter.value;
        const allSemesters = document.querySelectorAll('.semester');
        
        allSemesters.forEach(semester => {
            if (selectedSemester === 'all' || semester.dataset.semester === selectedSemester) {
                semester.style.display = 'block';
            } else {
                semester.style.display = 'none';
            }
        });
    }

    // Handle feedback form submission
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = this.querySelector('input[name="name"]').value.trim();
            const email = this.querySelector('input[name="email"]').value.trim();
            const message = this.querySelector('textarea[name="message"]').value.trim();
            const submitBtn = this.querySelector('button');
            
            // Validate inputs
            if (!name || !email || !message) {
                showFeedbackMessage('Veuillez remplir tous les champs', 'error');
                return;
            }
            
            if (!validateEmail(email)) {
                showFeedbackMessage('Veuillez entrer une adresse email valide', 'error');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Envoi en cours...';

            try {
                // Send feedback to Firebase
                await window.firebaseDB.push(
                    window.firebaseDB.ref(window.firebaseDB.db, 'feedbacks'), 
                    {
                        name: name,
                        email: email,
                        message: message,
                        timestamp: new Date().toISOString(),
                        page: window.location.href
                    }
                );
                
                showFeedbackMessage('Merci pour votre feedback !', 'success');
                this.reset();
            } catch (error) {
                console.error("Erreur d'envoi:", error);
                showFeedbackMessage(`Erreur: ${error.message}`, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Envoyer';
            }
        });
    }

    // Email validation function
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Show feedback message
    function showFeedbackMessage(message, type) {
        if (feedbackMessage) {
            feedbackMessage.textContent = message;
            feedbackMessage.className = `feedback-message ${type}`;
            feedbackMessage.style.display = 'block';
            
            // Hide message after 5 seconds
            setTimeout(() => {
                feedbackMessage.style.display = 'none';
            }, 5000);
        } else {
            alert(message);
        }
    }
    
    // Initialize
    loadCourses();
});