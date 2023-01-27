/* -------------------------------------------------------------------------- */
/*                                  DATABASE                                  */
/* -------------------------------------------------------------------------- */

/**
 * @typedef {Object} Contact
 * @property {string} id
 * @property {string} name
 * @property {string} phone
 */

/**
 * @typedef {Omit<Contact, "id">} ContactInput
 */

/** @type {IDBDatabase} */
let db;

const dbRequest = window.indexedDB.open("easy-ops");

dbRequest.onerror = (event) => {
  console.log("Error opening database", event);
};

dbRequest.onsuccess = (event) => {
  db = event.target.result;
  console.log("Database opened successfully");
  fetchContacts()
    .then((contacts) => {
      contacts.forEach(addContactToHtml);
    })
    .then(setDeleteButtonListeners);
};

dbRequest.onupgradeneeded = (event) => {
  db = event.target.result;
  const objectStore = db.createObjectStore("contacts", {
    keyPath: "id",
    autoIncrement: true,
  });
  objectStore.createIndex("name", "name", { unique: true });
  objectStore.createIndex("phone", "phone", { unique: true });
  console.log("Database setup complete");
};

/* -------------------------------------------------------------------------- */
/*                                 Application                                */
/* -------------------------------------------------------------------------- */

/** @type {HTMLFormElement} */
const form = document.getElementById("contact-form");

/** @type {HTMLParagraphElement} */
const errorText = document.getElementById("error-text");

/** @type {HTMLTableElement} */
const table = document.getElementById("contacts-table");

/** @type {HTMLInputElement} */
const searchInput = document.getElementById("search-input");

const nameHeaderBtn = document.getElementById("name-header-btn");

function setDeleteButtonListeners() {
  const deleteBtns = document.getElementsByClassName("delete-btn");

  for (let i = 0; i < deleteBtns.length; i++) {
    const btn = deleteBtns[i];
    btn.addEventListener("click", async (e) => {
      const id = e.target.id.split("-")[1];
      try {
        await deleteContact(+id);
        deleteContactFromHtml(id);
        alert("Contact deleted successfully");
      } catch (error) {
        console.log("Error deleting contact", error);
      }
    });
  }
}

/**
 *
 * @param {ContactInput} contact
 * @returns {Promise<string>} id of the added contact
 */
function addContact(contact) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["contacts"], "readwrite");
    const objectStore = transaction.objectStore("contacts");
    const request = objectStore.add(contact);
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject();
    };
  });
}

/**
 *
 * @param {string} id
 * @returns
 */
function deleteContact(id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["contacts"], "readwrite");
    const objectStore = transaction.objectStore("contacts");
    const request = objectStore.delete(id);
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject();
    };
  });
}

/**
 *
 * @param {number} id
 * @returns {Promise<Contact>}
 */
function getContact(id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["contacts"], "readonly");
    const objectStore = transaction.objectStore("contacts");
    const request = objectStore.get(id);
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject();
    };
  });
}

/**
 *
 * @returns {Promise<Contact[]>}
 */
function fetchContacts() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["contacts"], "readonly");
    const objectStore = transaction.objectStore("contacts");
    const request = objectStore.getAll();
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject();
    };
  });
}

/**
 *
 * @param {string} search
 * @returns {Promise<Contact[]>}
 */
async function searchContacts(search) {
  const contacts = await fetchContacts();

  const searchedContacts = contacts.filter((contact) => {
    return contact.name.includes(search) || contact.phone.includes(search);
  });
  return searchedContacts;
}

const deleteBtnStr = (id) =>
  `<button id="delete-${id}" class="delete-btn p-2 bg-red-500 hover:bg-red-800 text-white rounded-md">Delete</button>`;

/**
 *
 * @param {Contact} contact
 */
function addContactToHtml(contact) {
  const row = table.insertRow(-1);

  row.className = "hover:bg-gray-200 transition-colors duration-200";
  row.id = contact.id;

  row.insertCell(0).innerHTML = contact.id;
  row.insertCell(1).innerHTML = contact.name;
  row.insertCell(2).innerHTML = contact.phone;
  row.insertCell(3).innerHTML = deleteBtnStr(contact.id);

  for (let i = 0; i < row.cells.length; i++) {
    row.cells[i].className = "p-3";
  }
}

/**
 *
 * @param {string} id
 */
function deleteContactFromHtml(id) {
  const row = document.getElementById(id);
  row.remove();
}

function clearTable() {
  while (table.rows.length > 1) {
    table.deleteRow(1);
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorText.innerText = "";
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  const isInvalid = Object.values(data).some((value) => !value);

  if (isInvalid) {
    console.log("Invalid form");
    return;
  }

  const name = data.firstName + " " + data.lastName;
  const phone = data.phone;

  try {
    const contactId = await addContact({ name, phone });

    const contact = await getContact(contactId);

    addContactToHtml(contact);
    setDeleteButtonListeners();
    form.reset();
  } catch (error) {
    errorText.innerText = "Please enter unique name and phone number";
    console.log("Error adding contact", error);
  }
});

searchInput.addEventListener("input", async (e) => {
  const search = e.target.value;

  const contacts = search
    ? await searchContacts(search)
    : await fetchContacts();

  clearTable();
  contacts.forEach(addContactToHtml);
  setDeleteButtonListeners();
});

nameHeaderBtn.addEventListener("click", () => {
  sortTable(1, table);
});

/* -------------------------------------------------------------------------- */
/*                         DO NOT EDIT DANGEROUS CODE                         */
/* -------------------------------------------------------------------------- */

/**
 *
 * @param {number} n Row number
 * @param {HTMLTableElement} table Table element
 */
function sortTable(n, table) {
  let rows,
    switching,
    i,
    x,
    y,
    shouldSwitch,
    dir,
    switchcount = 0;
  switching = true;
  // Set the sorting direction to ascending:
  dir = "asc";
  /* Make a loop that will continue until
  no switching has been done: */
  while (switching) {
    // Start by saying: no switching is done:
    switching = false;
    rows = table.rows;
    /* Loop through all table rows (except the
    first, which contains table headers): */
    for (i = 1; i < rows.length - 1; i++) {
      // Start by saying there should be no switching:
      shouldSwitch = false;
      /* Get the two elements you want to compare,
      one from current row and one from the next: */
      x = rows[i].getElementsByTagName("td")[n];
      y = rows[i + 1].getElementsByTagName("td")[n];
      /* Check if the two rows should switch place,
      based on the direction, asc or desc: */
      if (dir == "asc") {
        if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
          // If so, mark as a switch and break the loop:
          shouldSwitch = true;
          break;
        }
      } else if (dir == "desc") {
        if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
          // If so, mark as a switch and break the loop:
          shouldSwitch = true;
          break;
        }
      }
    }
    if (shouldSwitch) {
      /* If a switch has been marked, make the switch
      and mark that a switch has been done: */
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
      // Each time a switch is done, increase this count by 1:
      switchcount++;
    } else {
      /* If no switching has been done AND the direction is "asc",
      set the direction to "desc" and run the while loop again. */
      if (switchcount == 0 && dir == "asc") {
        dir = "desc";
        switching = true;
      }
    }
  }
}
