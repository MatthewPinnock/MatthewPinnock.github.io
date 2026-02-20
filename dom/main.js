
function showFilter() {
  const filterForm = document.getElementById("filterContent");
  const newForm = document.getElementById("newContent");

  newForm.style.display = "none";


  filterForm.style.display = (filterForm.style.display === "none" || filterForm.style.display === "")
    ? "block"
    : "none";
}


function showAddNew() {
  const filterForm = document.getElementById("filterContent");
  const newForm = document.getElementById("newContent");


  filterForm.style.display = "none";

  newForm.style.display = (newForm.style.display === "none" || newForm.style.display === "")
    ? "flex"
    : "none";
}


function filterArticles() {
  const showOpinion = document.getElementById("opinionCheckbox").checked;
  const showRecipe = document.getElementById("recipeCheckbox").checked;
  const showUpdate = document.getElementById("updateCheckbox").checked;

  document.querySelectorAll("#articleList article").forEach(article => {
    const isOpinion = article.classList.contains("opinion");
    const isRecipe = article.classList.contains("recipe");
    const isUpdate = article.classList.contains("update");

    let shouldShow = true;
    if (isOpinion) shouldShow = showOpinion;
    if (isRecipe) shouldShow = showRecipe;
    if (isUpdate) shouldShow = showUpdate;

    article.style.display = shouldShow ? "" : "none";
  });
}

function addNewArticle() {
  const title = document.getElementById("inputHeader").value.trim();
  const text = document.getElementById("inputArticle").value.trim();


  let typeClass = null;
  let markerText = null;

  if (document.getElementById("opinionRadio").checked) {
    typeClass = "opinion";
    markerText = "Opinion";
  } else if (document.getElementById("recipeRadio").checked) {
    typeClass = "recipe";
    markerText = "Recipe";
  } else if (document.getElementById("lifeRadio").checked) {
    typeClass = "update";
    markerText = "Update";
  }


  if (!title || !text || !typeClass) return;

  const articleList = document.getElementById("articleList");

  const article = document.createElement("article");
  article.className = typeClass;

  const marker = document.createElement("span");
  marker.className = "marker";
  marker.textContent = markerText;

  const h2 = document.createElement("h2");
  h2.textContent = title;

  const pText = document.createElement("p");
  pText.textContent = text;

  const pLink = document.createElement("p");
  const a = document.createElement("a");
  a.href = "moreDetails.html";
  a.textContent = "Read more...";
  pLink.appendChild(a);

  article.appendChild(marker);
  article.appendChild(h2);
  article.appendChild(pText);
  article.appendChild(pLink);

  articleList.appendChild(article);

  document.getElementById("inputHeader").value = "";
  document.getElementById("inputArticle").value = "";
  document.getElementById("opinionRadio").checked = false;
  document.getElementById("recipeRadio").checked = false;
  document.getElementById("lifeRadio").checked = false;

  filterArticles();
}