console.log("Script loaded successfully"); // Debugging check

document.addEventListener("DOMContentLoaded", async function () {
    // Artwork Gallery
    const artworkContainer = document.getElementById("artwork-container");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    if (artworkContainer) {
        let artworks = [];
        let index = 0;

        async function fetchArtworks() {
            try {
                artworkContainer.innerHTML = "<p class='text-gray-500'>Loading artworks...</p>";
                const response = await fetch("/api/artworks");
                if (!response.ok) throw new Error("Failed to load artworks");

                artworks = await response.json();
                updateGallery();
            } catch (error) {
                console.error(error);
                artworkContainer.innerHTML = "<p class='text-red-500'>Failed to load artworks.</p>";
            }
        }

        function updateGallery() {
            if (artworks.length > 0) {
                const artwork = artworks[index];
                artworkContainer.innerHTML = `
                    <h3 class="text-xl font-medium p-8">${artwork.title}</h3>
                    <img src="${artwork.image}" class="w-[600px] h-[400px] rounded-3xl object-cover" alt="${artwork.title}">
                    <h4 class="text-gray-600">Style: ${artwork.style}</h4>
                `;
            }
        }

        if (prevBtn && nextBtn) {
            prevBtn.addEventListener("click", function () {
                index = (index > 0) ? index - 1 : artworks.length - 1;
                updateGallery();
            });

            nextBtn.addEventListener("click", function () {
                index = (index < artworks.length - 1) ? index + 1 : 0;
                updateGallery();
            });
        }

        fetchArtworks();
    }

    // Handle Contact Form Submission
    const contactForm = document.getElementById("contact-form");
    if (contactForm) {
        contactForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const formData = {
                name: document.getElementById("name").value.trim(),
                email: document.getElementById("email").value.trim(),
                phone: document.getElementById("phone").value.trim(),
                message: document.getElementById("message").value.trim()
            };

            if (!formData.name || !formData.email || !formData.phone || !formData.message) {
                alert("All fields are required!");
                return;
            }

            try {
                const response = await fetch("/api/contacts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    document.getElementById("response-message").classList.remove("hidden");
                    contactForm.reset();
                    setTimeout(() => {
                        document.getElementById("response-message").classList.add("hidden");
                    }, 3000);
                } else {
                    alert("Failed to submit message.");
                }
            } catch (error) {
                console.error("Error submitting form:", error);
            }
        });
    }

    // Fetch Contacts for Manage Contact Page (with authentication check)
    async function fetchContacts() {
        const contactTable = document.getElementById("contact-table");
        const errorMessage = document.getElementById("error-message");

        if (!contactTable) return;

        try {
            contactTable.innerHTML = "<tr><td colspan='4' class='text-center p-4 text-gray-500'>Loading contacts...</td></tr>";

            const response = await fetch("/api/contacts");
            if (response.status === 401) {
                window.location.href = "/login.html";
                return;
            }
            if (!response.ok) throw new Error("Failed to load contacts");

            const contacts = await response.json();

            if (contacts.length === 0) {
                contactTable.innerHTML = "<tr><td colspan='4' class='text-center p-4 text-gray-500'>No contacts found.</td></tr>";
                return;
            }

            contactTable.innerHTML = contacts.map(contact =>
                `<tr>
                    <td class="p-2 border">${contact.name}</td>
                    <td class="p-2 border">${contact.email}</td>
                    <td class="p-2 border">${contact.phone}</td>
                    <td class="p-2 border">${contact.message}</td>
                </tr>`
            ).join("");
        } catch (error) {
            console.error("Error fetching contacts:", error);
            errorMessage.classList.remove("hidden");
        }
    }

    fetchContacts();

    // Handle Login Form Submission
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const username = document.getElementById("username").value.trim();
            const password = document.getElementById("password").value.trim();

            if (!username || !password) {
                alert("Please enter both username and password.");
                return;
            }

            try {
                const response = await fetch("/api/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password })
                });

                if (response.ok) {
                    window.location.href = "/manage_contact";
                } else {
                    document.getElementById("error-message").textContent = "Invalid credentials";
                    document.getElementById("error-message").classList.remove("hidden");
                }
            } catch (error) {
                console.error("Error during login:", error);
            }
        });
    }

    // Handle Logout
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async function () {
            try {
                const response = await fetch("/api/logout", { method: "POST" });
                if (response.ok) {
                    window.location.href = "/login";
                }
            } catch (error) {
                console.error("Error during logout:", error);
            }
        });
    }
});
