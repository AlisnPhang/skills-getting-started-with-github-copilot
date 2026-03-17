document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Handle search form submission
  const searchForm = document.getElementById("search-form");
  const searchResults = document.getElementById("search-results");
  const searchAbstract = document.getElementById("search-abstract");
  const searchTopics = document.getElementById("search-topics");
  const searchMessage = document.getElementById("search-message");
  const searchButton = document.getElementById("search-button");

  searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const query = document.getElementById("search-query").value.trim();
    if (!query) return;

    searchButton.disabled = true;
    searchButton.textContent = "Searching...";
    searchResults.classList.add("hidden");
    searchMessage.classList.add("hidden");

    try {
      const response = await fetch(`/search?query=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Search failed");
      }

      // Render abstract
      searchAbstract.innerHTML = "";
      if (data.abstract) {
        const abstractDiv = document.createElement("div");
        abstractDiv.className = "search-abstract";

        const abstractTitle = document.createElement("h4");
        abstractTitle.textContent = "Summary";
        abstractDiv.appendChild(abstractTitle);

        const abstractText = document.createElement("p");
        abstractText.textContent = data.abstract;
        abstractDiv.appendChild(abstractText);

        if (data.abstract_url) {
          const sourceP = document.createElement("p");
          const sourceLink = document.createElement("a");
          sourceLink.href = data.abstract_url;
          sourceLink.target = "_blank";
          sourceLink.rel = "noopener noreferrer";
          sourceLink.textContent = `Source: ${data.abstract_source || data.abstract_url}`;
          sourceP.appendChild(sourceLink);
          abstractDiv.appendChild(sourceP);
        }

        searchAbstract.appendChild(abstractDiv);
      }

      // Render related topics
      searchTopics.innerHTML = "";
      if (data.related_topics && data.related_topics.length > 0) {
        const topicsTitle = document.createElement("h4");
        topicsTitle.textContent = "Related Topics";
        searchTopics.appendChild(topicsTitle);

        data.related_topics.forEach((topic) => {
          const item = document.createElement("div");
          item.className = "search-result-item";

          const text = document.createElement("p");
          text.textContent = topic.text;
          item.appendChild(text);

          if (topic.url) {
            const link = document.createElement("a");
            link.href = topic.url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = topic.url;
            item.appendChild(link);
          }

          searchTopics.appendChild(item);
        });
      }

      if (!data.abstract && (!data.related_topics || data.related_topics.length === 0)) {
        const noResults = document.createElement("p");
        noResults.className = "info-text";
        const noResultsMsg = document.createTextNode('No results found for "');
        const strong = document.createElement("strong");
        strong.textContent = query;
        noResults.appendChild(noResultsMsg);
        noResults.appendChild(strong);
        noResults.appendChild(document.createTextNode('". Try a different search term.'));
        searchAbstract.appendChild(noResults);
      }

      searchResults.classList.remove("hidden");
    } catch (error) {
      searchMessage.textContent = error.message || "Search failed. Please try again.";
      searchMessage.className = "error";
      searchMessage.classList.remove("hidden");
      console.error("Error during search:", error);
    } finally {
      searchButton.disabled = false;
      searchButton.textContent = "Search";
    }
  });

  // Initialize app
  fetchActivities();
});
