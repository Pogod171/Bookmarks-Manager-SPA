//<span class="cmdIcon fa-solid fa-ellipsis-vertical"></span>
let contentScrollPosition = 0;
Init_UI();

function Init_UI() {
  renderBookmarks();
  $("#createBookmark").on("click", async function () {
    saveContentScrollPosition();
    renderCreateBookmarkForm();
  });
  $("#abort").on("click", async function () {
    renderBookmarks();
  });
  $("#aboutCmd").on("click", function () {
    renderAbout();
  });
  $(".allCatCmd").on("click", function () {
    renderBookmarks();
  });
  let categories = document.querySelectorAll(".category");
  categories.forEach(function (categorie) {
    categorie.onclick = function () {
      renderBookmarks(categorie.textContent.trim());
    };
  });
}

function renderAbout() {
  saveContentScrollPosition();
  eraseContent();
  $("#createBookmark").hide();
  $("#abort").show();
  $("#actionTitle").text("À propos...");
  $("#content").append(
    $(`
            <div class="aboutContainer">
                <h2>Gestionnaire de favoris</h2>
                <hr>
                <p>
                    Petite application de gestion de favoris.
                </p>
                <p>
                    Auteur: Xavier Tassy
                </p>
                <p>
                    Collège Lionel-Groulx, automne 2023
                </p>
            </div>
        `)
  );
}
async function renderBookmarks(categorie = "") {
  showWaitingGif();
  $("#actionTitle").text("Liste des Bookmarks");
  $("#createBookmark").show();
  $("#abort").hide();
  let Bookmarks = await API_GetBookmarks();
  eraseContent();
  if (Bookmarks !== null) {
    Bookmarks.forEach((Bookmark) => {
      if(Bookmark.Categorie == categorie || categorie == ""){
        $("#content").append(renderBookmark(Bookmark));
      }
    });
    restoreContentScrollPosition();
    // Attached click events on command icons
    $(".editCmd").on("click", function () {
      saveContentScrollPosition();
      renderEditBookmarkForm(parseInt($(this).attr("editBookmarkId")));
    });
    $(".deleteCmd").on("click", function () {
      saveContentScrollPosition();
      renderDeleteBookmarkForm(parseInt($(this).attr("deleteBookmarkId")));
    });
    $(".BookmarkRow").on("click", function (e) {
      e.preventDefault();
    });
  } else {
    renderError("Service introuvable");
  }
}
function showWaitingGif() {
  $("#content").empty();
  $("#content").append(
    $(
      "<div class='waitingGifcontainer'><img class='waitingGif' src='Loading_icon.gif' /></div>'"
    )
  );
}
function eraseContent() {
  $("#content").empty();
}
function saveContentScrollPosition() {
  contentScrollPosition = $("#content")[0].scrollTop;
}
function restoreContentScrollPosition() {
  $("#content")[0].scrollTop = contentScrollPosition;
}
function renderError(message) {
  eraseContent();
  $("#content").append(
    $(`
            <div class="errorContainer">
                ${message}
            </div>
        `)
  );
}
function renderCreateBookmarkForm() {
  renderBookmarkForm();
}
async function renderEditBookmarkForm(id) {
  showWaitingGif();
  let Bookmark = await API_GetBookmark(id);
  if (Bookmark !== null) renderBookmarkForm(Bookmark);
  else renderError("Bookmark introuvable!");
}
async function renderDeleteBookmarkForm(id) {
  showWaitingGif();
  $("#createBookmark").hide();
  $("#abort").show();
  $("#actionTitle").text("Retrait");
  let Bookmark = await API_GetBookmark(id);
  eraseContent();
  if (Bookmark !== null) {
    $("#content").append(`
        <div class="BookmarkdeleteForm">
            <h4>Effacer le Bookmark suivant?</h4>
            <br>
            <div class="BookmarkRow" Bookmark_id=${Bookmark.Id}">
                <div class="BookmarkContainer">
                    <div class="BookmarkLayout">
                        <div class="big-favicon" style="background-image: url('http://www.google.com/s2/favicons?sz=64&domain=${Bookmark.Url}');">
                        </div>
                        <div class="BookmarkName">${Bookmark.Name}</div>
                        <a href="${Bookmark.Url}">${Bookmark.Categorie}</a>
                    </div>
                </div>  
            </div>   
            <br>
            <input type="button" value="Effacer" id="deleteBookmark" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </div>    
        `);
    $("#deleteBookmark").on("click", async function () {
      showWaitingGif();
      let result = await API_DeleteBookmark(Bookmark.Id);
      if (result) renderBookmarks();
      else renderError("Une erreur est survenue!");
    });
    $("#cancel").on("click", function () {
      renderBookmarks();
    });
  } else {
    renderError("Bookmark introuvable!");
  }
}
function newBookmark() {
  Bookmark = {};
  Bookmark.Id = 0;
  Bookmark.Name = "";
  Bookmark.Url = "";
  Bookmark.Categorie = "";
  return Bookmark;
}
function renderBookmarkForm(Bookmark = null) {
  $("#createBookmark").hide();
  $("#abort").show();
  eraseContent();
  let create = Bookmark == null;
  if (create) Bookmark = newBookmark();
  $("#actionTitle").text(create ? "Création" : "Modification");
  $("#content").append(`
        <form class="form" id="BookmarkForm">
            <input type="hidden" name="Id" value="${Bookmark.Id}"/>

            <label for="Name" class="form-label">Nom </label>
            <input 
                class="form-control Alpha"
                name="Name" 
                id="Name" 
                placeholder="Nom"
                required
                RequireMessage="Veuillez entrer un nom"
                InvalidMessage="Le nom comporte un caractère illégal" 
                value="${Bookmark.Name}"
            />
            <label for="Url" class="form-label">Url </label>
            <input 
                class="form-control URL"
                name="Url" 
                id="Url" 
                placeholder="Url"
                required
                RequireMessage="Veuillez entrer un lien"
                InvalidMessage="Le lien comporte un caractère illégal" 
                value="${Bookmark.Url}"
            />
            <label for="Categorie" class="form-label">Catégorie </label>
            <input 
                class="form-control"
                name="Categorie"
                id="Categorie"
                placeholder="Catégorie"
                required
                RequireMessage="Veuillez entrer votre courriel" 
                InvalidMessage="Veuillez entrer un courriel valide"
                value="${Bookmark.Categorie}"
            />
            <hr>
            <input type="submit" value="Enregistrer" id="saveBookmark" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </form>
    `);
  initFormValidation();
  $("#BookmarkForm").on("submit", async function (event) {
    event.preventDefault();
    let Bookmark = getFormData($("#BookmarkForm"));
    Bookmark.Id = parseInt(Bookmark.Id);
    showWaitingGif();
    let result = await API_SaveBookmark(Bookmark, create);
    if (result) renderBookmarks();
    else renderError("Une erreur est survenue!");
  });
  $("#cancel").on("click", function () {
    renderBookmarks();
  });
}

function getFormData($form) {
  const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
  var jsonObject = {};
  $.each($form.serializeArray(), (index, control) => {
    jsonObject[control.name] = control.value.replace(removeTag, "");
  });
  return jsonObject;
}

function renderBookmark(Bookmark) {
  return $(`
     <div class="BookmarkRow" Bookmark_id=${Bookmark.Id}">
        <div class="BookmarkContainer noselect">
            <div class="BookmarkLayout">
                <span class="BookmarkName"><div class="small-favicon" style="background-image: url('http://www.google.com/s2/favicons?sz=64&domain=${Bookmark.Url}');">
                </div>${Bookmark.Name}</span>
                <a href="${Bookmark.Url}">${Bookmark.Categorie}</a>
            </div>
            <div class="BookmarkCommandPanel">
                <span class="editCmd cmdIcon fa fa-pencil" editBookmarkId="${Bookmark.Id}" title="Modifier ${Bookmark.Name}"></span>
                <span class="deleteCmd cmdIcon fa fa-trash" deleteBookmarkId="${Bookmark.Id}" title="Effacer ${Bookmark.Name}"></span>
            </div>
        </div>
    </div>           
    `);
}
