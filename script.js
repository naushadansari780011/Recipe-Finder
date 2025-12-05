// ========== Online Recipe Finder using TheMealDB API ==========

// DOM elements
const recipesContainer = document.getElementById("recipesContainer");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const timeFilter = document.getElementById("timeFilter");
const noResultsText = document.getElementById("noResults");

// Current recipes (jo API se aaye hain)
let currentRecipes = [];

// ----- Helper: API se ingredients nikalna -----
function extractIngredients(meal) {
  const list = [];
  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ing && ing.trim() !== "") {
      list.push(
        (measure ? measure.trim() + " " : "") + ing.trim()
      );
    }
  }
  return list;
}

// ----- Helper: TheMealDB response ko hamare format me convert karna -----
function mapMealsToRecipes(meals) {
  return meals.map((meal, index) => ({
    id: meal.idMeal || index,
    name: meal.strMeal,
    // TheMealDB category (e.g. Breakfast, Dessert, Chicken etc.)
    category: meal.strCategory || "Other",
    // API time nahi deta, isliye approx. value:
    time: 30,
    difficulty: "Medium",
    ingredients: extractIngredients(meal),
    // Instructions ka chhota part show karne ke liye
    instructions:
      (meal.strInstructions || "").length > 250
        ? meal.strInstructions.slice(0, 250) + "..."
        : meal.strInstructions || "No instructions available.",
    image: meal.strMealThumb
  }));
}

// ----- API se data lana -----
async function fetchRecipesFromAPI(searchText) {
  // empty search ho to 'a' se kuch random recipes mil jaati hain
  const query = searchText && searchText.trim() !== "" ? searchText.trim() : "a";
  const url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(
    query
  )}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.meals) {
      return [];
    }

    return mapMealsToRecipes(data.meals);
  } catch (err) {
    console.error("API error:", err);
    return [];
  }
}

// ----- UI me recipes show karna -----
function renderRecipes(list) {
  recipesContainer.innerHTML = "";

  if (list.length === 0) {
    noResultsText.classList.remove("hidden");
    return;
  } else {
    noResultsText.classList.add("hidden");
  }

  list.forEach((recipe) => {
    const card = document.createElement("article");
    card.className = "recipe-card";

    card.innerHTML = `
      <img
        src="${recipe.image}"
        alt="${recipe.name}"
        class="recipe-image"
      />
      <div class="recipe-content">
        <h2 class="recipe-title">${recipe.name}</h2>
        <div class="recipe-meta">
          <span class="badge">${recipe.category}</span>
          <span class="time">${recipe.time} min • ${recipe.difficulty}</span>
        </div>
        <p class="recipe-section-title">Ingredients:</p>
        <p class="recipe-ingredients">
          ${recipe.ingredients.join(", ")}
        </p>
        <p class="recipe-section-title">Instructions:</p>
        <p class="recipe-instructions">
          ${recipe.instructions}
        </p>
      </div>
    `;

    recipesContainer.appendChild(card);
  });
}

// ----- Filters apply karna (category, time, search) -----
function applyFilters() {
  const searchText = searchInput.value.toLowerCase().trim();
  const selectedCategory = categoryFilter.value;
  const maxTime = timeFilter.value ? Number(timeFilter.value) : null;

  const filtered = currentRecipes.filter((recipe) => {
    // Category filter:
    // dropdown me "All" hai, warna exact match
    const categoryMatch =
      selectedCategory === "all" ||
      (recipe.category || "").toLowerCase() ===
        selectedCategory.toLowerCase();

    // Time filter (sabko approx 30 diya hai, phir bhi chalega)
    const timeMatch = maxTime === null || recipe.time <= maxTime;

    // Search filter (name + ingredients)
    const combinedText =
      recipe.name.toLowerCase() +
      " " +
      recipe.ingredients.join(" ").toLowerCase();
    const searchMatch = combinedText.includes(searchText);

    return categoryMatch && timeMatch && searchMatch;
  });

  renderRecipes(filtered);
}

// ----- Main: search / filters change hone par API + filters -----
async function refreshRecipes() {
  const text = searchInput.value;

  // Har baar search text change hone par API call
  // Category / time change par sirf local filtering (currentRecipes) chalegi
  if (
    currentRecipes.length === 0 || // first time
    event && event.type === "input" // agar search box change hua
  ) {
    currentRecipes = await fetchRecipesFromAPI(text);
  }

  applyFilters();
}

// Event listeners
searchInput.addEventListener("input", refreshRecipes);
categoryFilter.addEventListener("change", applyFilters);
timeFilter.addEventListener("input", applyFilters);

// Initial load: kuch default recipes le aao
(async function initialLoad() {
  currentRecipes = await fetchRecipesFromAPI("");
  applyFilters();
})(); 
