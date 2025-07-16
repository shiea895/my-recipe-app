let editingIndex = null;
let currentRecipeIndex = null;

function normalize(text) {
  const toHiragana = (str) =>
    str.replace(/[\u30a1-\u30f6]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0x60)
    );

  const kanjiMap = {
    "豚肉": "ぶたにく", "牛肉": "ぎゅうにく", "鶏肉": "とりにく",
    "大根": "だいこん", "人参": "にんじん", "玉ねぎ": "たまねぎ",
    "椎茸": "しいたけ", "白菜": "はくさい", "醤油": "しょうゆ",
    "キャベツ": "きゃべつ"
  };

  let result = toHiragana(text.toLowerCase());
  Object.entries(kanjiMap).forEach(([k, v]) => {
    result = result.replace(new RegExp(k, "g"), v);
  });
  return result;
}

function saveRecipe() {
  const name = document.getElementById("recipeName").value.trim();
  const category = document.getElementById("category").value;
  const ingredients = document.getElementById("ingredients").value.trim();
  const instructions = document.getElementById("instructions").value.trim();
  const notes = document.getElementById("notes").value.trim();

  if (!name || !category || !ingredients || !instructions) {
    alert("すべての項目を入力してください。");
    return;
  }

  const recipe = { name, category, ingredients, instructions, notes };
  let recipes = JSON.parse(localStorage.getItem("recipes") || "[]");

  if (editingIndex !== null) {
    recipes[editingIndex] = recipe;
    editingIndex = null;
  } else {
    recipes.push(recipe);
  }

  localStorage.setItem("recipes", JSON.stringify(recipes));
  showRecipeList();
}

function showRecipeList() {
  document.getElementById("formSection").style.display = "none";
  document.getElementById("detailSection").style.display = "none";
  document.getElementById("listSection").style.display = "block";
  updateRecipeList();
}

function updateRecipeList(filtered = null) {
  const recipeList = document.getElementById("recipeList");
  recipeList.innerHTML = "";

  const allRecipes = JSON.parse(localStorage.getItem("recipes") || "[]");
  const recipes = filtered || allRecipes;

  if (recipes.length === 0) {
    const li = document.createElement("li");
    li.textContent = "一致するレシピはありません。";
    li.style.color = "gray";
    recipeList.appendChild(li);
    return;
  }

  recipes.forEach((recipe) => {
    const actualIndex = allRecipes.findIndex((r) =>
      r.name === recipe.name &&
      r.category === recipe.category &&
      r.ingredients === recipe.ingredients &&
      r.instructions === recipe.instructions
    );

    const li = document.createElement("li");

    // ✅ レシピ名 + バッジ風カテゴリ（innerHTMLで実現）
    li.innerHTML = `${recipe.name} <span class="detailcategory category-${recipe.category}">${recipe.category}</span>`;

    li.dataset.index = actualIndex;
    li.onclick = () => showRecipeDetail(actualIndex);
    recipeList.appendChild(li);
  });
}

// ✅ カテゴリバッジの色を反映
function showRecipeDetail(index) {
  const recipes = JSON.parse(localStorage.getItem("recipes") || "[]");
  const recipe = recipes[index];
  currentRecipeIndex = index;

  document.getElementById("listSection").style.display = "none";
  document.getElementById("detailSection").style.display = "block";

  document.getElementById("detailTitle").textContent = recipe.name;

  document.getElementById("detailNotes").innerHTML =
  (recipe.notes || "").replace(/\n/g, "<br>");


  const catSpan = document.getElementById("detailCategory");
  catSpan.textContent = recipe.category;

  // ✅ 一旦 category-◯◯ クラスだけ削除（他のクラスは保持）
  catSpan.classList.forEach((cls) => {
    if (cls.startsWith("category-")) {
      catSpan.classList.remove(cls);
    }
  });

  // ✅ detailcategory クラスを常につける（一覧と統一）
  catSpan.classList.add("detailcategory");

  // ✅ バッジ色クラス追加（例: category-主菜）
  catSpan.classList.add("category-" + recipe.category.trim());

  document.getElementById("detailIngredients").innerHTML = recipe.ingredients.replace(/\n/g, "<br>");
  document.getElementById("detailInstructions").innerHTML = recipe.instructions.replace(/\n/g, "<br>");
}

function showForm(isEdit = false) {
  document.getElementById("listSection").style.display = "none";
  document.getElementById("detailSection").style.display = "none";
  document.getElementById("formSection").style.display = "block";

  if (!isEdit) {
    editingIndex = null;
    document.getElementById("recipeName").value = "";
    document.getElementById("category").value = "主菜";
    document.getElementById("ingredients").value = "";
    document.getElementById("instructions").value = "";
  }
}

function editRecipe() {
  const recipes = JSON.parse(localStorage.getItem("recipes") || "[]");
  const recipe = recipes[currentRecipeIndex];
  editingIndex = currentRecipeIndex;

  document.getElementById("recipeName").value = recipe.name;
  document.getElementById("category").value = recipe.category;
  document.getElementById("ingredients").value = recipe.ingredients;
  document.getElementById("instructions").value = recipe.instructions;
  document.getElementById("notes").value = recipe.notes || "";

  showForm(true);
}

function deleteRecipe() {
  if (!confirm("このレシピを削除しますか？")) return;

  let recipes = JSON.parse(localStorage.getItem("recipes") || "[]");
  recipes.splice(currentRecipeIndex, 1);
  localStorage.setItem("recipes", JSON.stringify(recipes));
  showRecipeList();
}

function updateSearchUI() {
  const mode = document.getElementById("searchMode").value;
  const searchInput = document.getElementById("searchInput");
  const categorySelect = document.getElementById("categorySelect");

  searchInput.style.display = mode === "ingredient" ? "block" : "none";
  categorySelect.style.display = mode === "category" ? "block" : "none";

  // ✅ 入力を初期化
  if (mode !== "ingredient") {
    searchInput.value = "";
  }

  if (mode === "all") updateRecipeList();
}

function performSearch() {
  const mode = document.getElementById("searchMode").value;
  const recipes = JSON.parse(localStorage.getItem("recipes") || "[]");
  let filtered = [];

  if (mode === "ingredient") {
    const raw = document.getElementById("searchInput").value.trim();
    const keywords = raw.split(/[ 　]+/).map(normalize).filter(Boolean);
    filtered = recipes.filter((r) =>
      keywords.every((k) => normalize(r.ingredients).includes(k))
    );
  } else if (mode === "category") {
    const selected = document.getElementById("categorySelect").value;
    filtered = recipes.filter((r) => r.category === selected);
  } else {
    updateRecipeList();
    return;
  }

  updateRecipeList(filtered);
}

window.onload = () => {
  const recipes = JSON.parse(localStorage.getItem("recipes") || "[]");
  if (recipes.length > 0) {
    showRecipeList();
  } else {
    showForm();
  }
};
