const container = document.querySelector("#container");
const indoor = document.querySelector("#indoor");
const outdoor = document.querySelector("#outdoor");
const showAllTasks = document.querySelector("#allTasks");
const btnContainer = document.querySelector(".btn-container");
const logInBtn = document.querySelector("#logInBtn");
const signOutBtn = document.querySelector("#signOutBtn");
const loginForm = document.querySelector(".loginForm");
const homeBtn = document.querySelector("#homeBtn");
const uploadTaskBtn = document.querySelector("#uploadTaskBtn");
const signUpBtn = document.querySelector("#signUpBtn");
const myTasksBtn = document.querySelector("#myTasksBtn");
const deleteBtn = document.querySelector("#deleteBtn");
const uploadTaskContainer = document.querySelector("#uploadTaskContainer");
const title = document.querySelector("#title");
const applyBtn = document.querySelector("#applyBtn");
const whoapplied = document.querySelector("#whoapplied");

const port = 8745;
// const url = `http://127.0.0.1:${port}/api`;
const url = `https://wad-jobportal-03.azurewebsites.net/api`;
const ls = window.sessionStorage;
// const ls = window.localStorage

window.addEventListener("DOMContentLoaded", async () => {
  try {
    let account;
    // Home page
    if (window.location.href.endsWith(".html")) {
      await addAllTasks();
      await renderFilterBtn();
      await addHandlertoFilterBtns();
    }
    // Login page
    if (window.location.href.includes("?login-page")) {
      await drawLoginHTML();
      await addHandlerToSubmitBtn();

      // redirecing to the profile page
      if (ls.getItem("account")) {
        account = JSON.parse(ls.getItem("account"));
        if (account.statusCode || Object.keys(account).length === 0) {
          await handleLoginError();
        } else {
          await fetchProfileData(account.profileid);

          if (ls.getItem("profile")) {
            const url = window.location.href;
            const urlSplit = url.split("?");
            window.location.href = `${urlSplit[0]}?profilepage`;
          }
        }
      }
    }

    // Sign up page
    if (window.location.href.includes("?signup-page")) {
      await drawSignUpPage();
      // await addHandlerToSignUpBtn();
    }

    if (window.location.href.includes("?profilepage")) {
      const profile = JSON.parse(ls.getItem("profile"));

      await drawProfilePage(profile.firstname, profile.lastname);
      await renderFilterBtn();
      await addHandlertoFilterBtns();
    }

    if (window.location.href.includes("?mytasks")) {
      await drawMyTasks();
      await addHandlerToLogout();
    }

    if (window.location.href.includes("?mytaskid=")) {
      await drawUpdateTask();
      await addHandlerToUpdateBtn();
      await addHandlerToLogout();
    }

    if (window.location.href.includes("?application=")) {
      await drawApplication();
      signUpBtn.classList.add("hidden");
      logInBtn.classList.add("hidden");
      signOutBtn.classList.remove("hidden");
    }

    if (window.location.href.includes("?uploadtask")) {
      await drawUploadPage();
      await drawUploadTask();
      await addHandlerToLogout();
    }

    // single task page
    if (window.location.href.includes("?taskid=")) {
      // Draw the task with more detail
      if (ls.getItem("token")) {
        // Add sign out profile information
        // Delete sign in sign up btns
        signUpBtn.classList.add("hidden");
        logInBtn.classList.add("hidden");
        signOutBtn.classList.remove("hidden");
        applyBtn.classList.remove("hidden");
        await drawDetailedTaskPage();

        await addHandlerToApplyBtn();

        account = JSON.parse(ls.getItem("account"));
        if (account.role.rolename == "admin") {
          deleteBtn.classList.remove("hidden");

          // Add delete btn
          await addHandlerToDeleteBtn();
        }
      } else {
        container.innerHTML = " ";
        const markup = `
            <form class="loginForm">
              <p class="success">Sorry, you need to be a member!</p>
              <a href="?login-page" class="filterBtn">Sign in</a>
            </form>
          `;

        addToHtml("#container", markup);
      }
    }
  } catch (err) {
    console.log(err);
  }
});

// Adding new route to the url
// Home page
homeBtn.addEventListener("click", (e) => {
  e.preventDefault();
  if (ls.getItem("account")) {
    window.location.href = "?profilepage";
  } else {
    gettingHomePageUrl();
  }
});

const gettingHomePageUrl = function () {
  const url = window.location.href;
  if (url.includes("?")) {
    const urlSplit = url.split("?");
    window.location.href = urlSplit[0];
  }
};

// Log in page
logInBtn.addEventListener("click", (e) => {
  e.preventDefault();
  gettingLoginUrl();
});
const gettingLoginUrl = function () {
  window.location.href = "?login-page";
};



// Home page content
const addAllTasks = async function () {
  try {
    fetch(`${url}/tasks`)
      .then((response) => response.json())
      .then((data) => {
        account = JSON.parse(ls.getItem("account"));
        // console.log(account);
        if (account && account.role.roleid == 1) {
          data.forEach((task) => {
            const markup = `<a href=?taskid=${
              task.taskid
            }  class="task-a btn-collection">
              ${drawPreviewTasksHtml(task)}
              </a>`;
            container.insertAdjacentHTML("afterbegin", markup);
          });
        } else {
          let availableTasks = [];
          data.filter((task) => {
            if (task.status.statusid === 1) {
              availableTasks.push(task);
            }
          });
          availableTasks.forEach((task) => {
            const markup = `<a href=?taskid=${
              task.taskid
            }  class="task-a btn-collection">
                ${drawPreviewTasksHtml(task)}
                </a>`;
            container.insertAdjacentHTML("afterbegin", markup);
          });
        }
      });
  } catch (err) {
    console.log(err);
  }
};

const renderFilterBtn = async function () {
  try {
    const markup = `
        <h3>Categories:</h3>
        <div>
          <input  class="filterBtn categoryBtns" type="button" name="" id="indoor" value="Indoor" data-btn="?categoryname=indoor">
          <input class="filterBtn categoryBtns" type="button" name="" id="outdoor" value="Outdoor" data-btn="?categoryname=outdoor">
          <input class="filterBtn categoryBtns" type="button" name="" id="allTasks" value="Show all tasks" data-btn="/">
        </div>
    `;
    addToHtml(".btn-container", markup);
  } catch (err) {
    console.log(err);
  }
};

const addHandlertoFilterBtns = async function () {
  try {
    const categoryBtns = document.querySelectorAll(".categoryBtns");
    btnContainer.addEventListener("click", (e) => {
      e.preventDefault();
      const clickedBtn = e.target.closest(".categoryBtns");
      if (!clickedBtn) return;

      categoryBtns.forEach((btn) => btn.classList.remove("active-btn"));
      clickedBtn.classList.add("active-btn");
      const query = clickedBtn.dataset.btn;
      fetchData(query);
    });
  } catch (err) {
    console.log(err);
  }
};

const fetchData = function (query) {
  container.innerHTML = "";

  fetch(`${url}/tasks${query}`)
    .then((response) => response.json())
    .then((data) => {
      account = JSON.parse(ls.getItem("account"));
      // console.log(account);
      if (account && account.role.roleid == 1) {
        data.forEach((task) => {
          const markup = `<a href=?taskid=${
            task.taskid
          }  class="task-a btn-collection">
                ${drawPreviewTasksHtml(task)}
                </a>`;
          container.insertAdjacentHTML("afterbegin", markup);
        });
      } else {
        let availableTasks = [];
        data.filter((task) => {
          if (task.status.statusid === 1) {
            availableTasks.push(task);
          }
        });
        availableTasks.forEach((task) => {
          const markup = `<a href=?taskid=${
            task.taskid
          }  class="task-a btn-collection">
                  ${drawPreviewTasksHtml(task)}
                  </a>`;
          container.insertAdjacentHTML("afterbegin", markup);
        });
      }
    });
};

const drawLoginHTML = async function () {
  try {
    const markup = `
        <form class="loginForm">
          <input id="loginEmail" type="email" placeholder="Email address..." autofocus>
          <input id="loginPassword" type="password" name="password" placeholder="Type your password...">
          <input class="filterBtn btn-collection" id="loginSubmit" type="submit" value="Log in">
        </form>
      `;
    addToHtml("#container", markup);
  } catch (err) {
    console.log(err);
  }
};

const addHandlerToSubmitBtn = async function () {
  try {
    const loginSubmit = document.querySelector("#loginSubmit");
    const loginEmail = document.querySelector("#loginEmail");
    const loginPassword = document.querySelector("#loginPassword");

    loginSubmit.addEventListener("click", (e) => {
      e.preventDefault();
      addSpinner();
      const payload = {
        email: loginEmail.value,
        password: loginPassword.value,
      };

      const fetchOptions = {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify(payload),
      };

      fetch(`${url}/accounts/login`, fetchOptions)
        .then((res) => {
          const token = res.headers.get("x-authentication-token");
          ls.setItem("token", token);
          return res.json();
        })
        .then((data) => {
          ls.setItem("account", JSON.stringify(data));
          account = JSON.parse(ls.getItem("account"));

          window.location.reload();
        });
    });
  } catch (err) {
    console.log(err);
  }
};

const handleLoginError = async function () {
  try {
    await drawLoginError();
    await addhandlerErrorBtn();
  } catch (err) {
    console.log(err);
  }
};
const drawLoginError = async function () {
  try {
    container.innerHTML = "";
    const markup = `<form class="loginForm">
        <p class="error"> Invalid email address or password!</p>
        <input class="filterBtn btn-collection" id="loginErrorBtn" type="submit" value="Try again">
      </form>
    `;
    addToHtml("#container", markup);
    ls.removeItem("account");
    ls.removeItem("token");
  } catch (err) {
    console.log(err);
  }
};
const addhandlerErrorBtn = async function () {
  try {
    const loginErrorBtn = document.querySelector("#loginErrorBtn");
    loginErrorBtn.addEventListener("click", (e) => {
      e.preventDefault();
      gettingLoginUrl();
    });
  } catch (err) {
    console.log(err);
  }
};

// Sign up page content
const drawSignUpPage = async function (error, errorDetails) {
  try {
    const markup = `
    <form class="loginForm">
          <h3 class="error">${error ? error.errorMessage : ""}</h3>
          <p>${errorDetails ? error.errorObj.details[0].message : ""}</p>
          <label>Log in information</label>
          <input id="suEmail" type="email" placeholder="Email address" required>
          <input id="suPassword" type="password" name="password" placeholder="Password" required>
         
          <label>Profile information</label>
          <input id="suFirstName" type="text" placeholder="Firstname" required>
          <input id="sulastName" type="text" placeholder="Lastname" required>
          <input id="suPhoneNumber" type="text" placeholder="Phonenumber" required>
          <input id="suProfileDescription" type="textarea" placeholder="Description" >
          <input id="suProfileUrl" type="text" placeholder="Profile picture url" >
          <input class="filterBtn btn-collection" id="suSignin" type="submit" value="Log in">
        </form>
      `;
    await addToHtml("#container", markup);
    await addHandlerToSignUpBtn();
  } catch (err) {
    console.log(err);
  }
};

const addHandlerToSignUpBtn = async function () {
  try {
    const suEmail = document.querySelector("#suEmail");
    const suPassword = document.querySelector("#suPassword");
    const suFirstName = document.querySelector("#suFirstName");
    const sulastName = document.querySelector("#sulastName");
    const suPhoneNumber = document.querySelector("#suPhoneNumber");
    const suProfileDescription = document.querySelector(
      "#suProfileDescription"
    );
    const suProfileUrl = document.querySelector("#suProfileUrl");
    const suSignin = document.querySelector("#suSignin");

    suSignin.addEventListener("click", (e) => {
      e.preventDefault();
      addSpinner();
      const payload = {
        email: suEmail.value,
        password: suPassword.value,
        firstname: suFirstName.value,
        lastname: sulastName.value,
        phonenumber: suPhoneNumber.value,
      };
      if (suProfileDescription.value) {
        profiledescription: suProfileDescription.value;
        payload.profiledescription;
      }

      if (suProfileUrl.value) {
        profilepicture: suProfileUrl.value;
        payload.profilepicture;
      }

      const fetchOptions = {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify(payload),
      };
      fetch(`${url}/accounts`, fetchOptions)
        .then((res) => res.json())
        .then((data) => {
          console.log(data.statusCode);
          container.innerHTML = "";
          if (!data.statusCode || Object.keys(data).length === 0) {
            gettingLoginUrl();
          } else drawSignUpPage(data, data.errorObj.details);
        });
    });
  } catch (err) {}
};

// Profile page content
const fetchProfileData = async function (profileid) {
  try {
    const fetchOptions = {
      method: "GET",
      headers: {},
    };
    if (ls.getItem("token")) {
      fetchOptions.headers["x-authentication-token"] = ls.getItem("token");
    }
    fetch(`${url}/profiles/${profileid}`, fetchOptions)
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        ls.setItem("profile", JSON.stringify(data));

        window.location.reload();
      });
  } catch (err) {
    console.log(err);
  }
};
const drawProfilePage = async function (firstname, lastname) {
  try {
    title.innerHTML = `${firstname} ${lastname}`;
    homeBtn.classList.add("hidden");
    uploadTaskBtn.classList.remove("hidden");
    myTasksBtn.classList.remove("hidden");
    signUpBtn.classList.add("hidden");
    logInBtn.classList.add("hidden");
    signOutBtn.classList.remove("hidden");

    await addAllTasks();

    await addHandlerToLogout();
  } catch (err) {
    console.log(err);
  }
};

// Detailed task page
const drawDetailedTaskPage = async function () {
  try {
    const urlSplit = window.location.href.split("=");
    const taskid = urlSplit[1];
    console.log(taskid);
    const fetchOptions = {
      method: "GET",
      headers: { "Content-type": "application/json" },
    };

    if (ls.getItem("token")) {
      fetchOptions.headers["x-authentication-token"] = ls.getItem("token");
    }

    fetch(`${url}/tasks/${taskid}`, fetchOptions)
      .then((res) => res.json())
      .then((data) => {
        title.innerHTML = data.tasktitle;
        const markup = drawTasksHTML(data);
        container.insertAdjacentHTML("afterbegin", markup);
      });
  } catch (err) {
    console.log(err);
  }
};

const addHandlerToDeleteBtn = async function () {
  try {
    deleteBtn.addEventListener("click", (e) => {
      e.preventDefault();
      applyBtn.classList.add('hidden')
      deleteBtn.classList.add('hidden')
      addSpinner()
      const urlSplit = window.location.href.split("=");
      const taskid = urlSplit[1];
      const fetchOptions = {
        method: "DELETE",
        headers: { "Content-type": "application/json" },
      };

      if (ls.getItem("token")) {
        fetchOptions.headers["x-authentication-token"] = ls.getItem("token");
      }

      fetch(`${url}/tasks/${taskid}`, fetchOptions)
        .then((res) => res.json())
        .then((data) => {
          console.log(data);

          if (!data.statusCode || Object.keys(data).length === 0) {
            deleteBtn.classList.add("hidden");
            container.innerHTML = " ";
            const markup = `
                  <form class="loginForm">
                    <p class="success">You succesfully deleted a task!</p>
                    <input class="filterBtn btn-collection" id="backToProfile" type="submit" value="Back to your tasks">
                  </form>
                `;
            addToHtml("#container", markup);
            addHandlerToBackToProfilePage()
          }
        });
    });
  } catch (err) {}
};

// Apply for a task
const addHandlerToApplyBtn = async function () {
  try {
    applyBtn.addEventListener("click", (e) => {
      e.preventDefault();
      addSpinner();

      const urlSplit = window.location.href.split("=");
      const urlsTaskid = urlSplit[1];
      const account = JSON.parse(ls.getItem("account"));

      const payload = {
        taskid: urlsTaskid,
        account: {
          accountid: account.accountid,
          email: account.email,
        },
      };


      const fetchOptions = {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify(payload),
      };

      if (ls.getItem("token")) {
        fetchOptions.headers["x-authentication-token"] = ls.getItem("token");
      }
      fetch(`${url}/application`, fetchOptions)
        .then((res) => res.json())
        .then((data) => {
          applyBtn.classList.add("hidden");
          deleteBtn.classList.add("hidden");
          console.log(data);
          container.innerHTML = " ";
          const markup = `
                  <form class="loginForm">
                    <p class="${data.statusCode ? "error" : "success"}">${
            data.statusCode
              ? data.errorMessage
              : "You succesfully applied for this task!"
          }</p>
                    <input class="filterBtn btn-collection" id="backToProfile" type="submit" value="Back to your tasks">
                  </form>
                `;
          addToHtml("#container", markup);
          addHandlerToBackToProfilePage();
        });
    });
  } catch (err) {
    console.log(err);
  }
};
// Draw upload page
const drawUploadPage = async function () {
  try {
    title.innerHTML = "Add a new task";
    homeBtn.innerHTML = "Profile page";
    signUpBtn.classList.add("hidden");
    logInBtn.classList.add("hidden");
    signOutBtn.classList.remove("hidden");
  } catch (err) {
    console.log(err);
  }
};
// Uploadd tasks
const drawUploadTask = async function (error) {
  try {
    const markup = `
        <form class="loginForm">
          <h3 class="error">${error ? error.errorMessage : ""}</h3>
          <p>${error ? error.errorObj.details[0].message : ""}</p>
          <input id="taskTitle" type="text" placeholder="Title">
          <textarea id="taskDescription" type="text" name="" placeholder="Describe..."></textarea>
          <input id="taskAddress" type="text" value="" placeholder="Address"> 
          <input id="taskSalary" type="number" value="" placeholder="Salary">
          <label>Select category</label>
          <select name="category" id="category">
              <option value="1">Indoor</option>
              <option value="2">Outdoor</option>
          </select>
        <button class="filterBtn btn-collection" id="uploadBtn">Upload task</button>
        </form>
      `;

    await addToHtml("#container", markup);
    await addHandlerToCreateBtn();
  } catch (err) {
    console.log(err);
  }
};

const addHandlerToCreateBtn = async function () {
  try {
    const taskTitle = document.querySelector("#taskTitle");
    const taskDescription = document.querySelector("#taskDescription");
    const taskAddress = document.querySelector("#taskAddress");
    const taskSalary = document.querySelector("#taskSalary");
    const category = document.querySelector("#category");
    const uploadBtn = document.querySelector("#uploadBtn");

    uploadBtn.addEventListener("click", (e) => {
      e.preventDefault();
      addSpinner()
      console.log("hello");
      addSpinner();
      const account = JSON.parse(ls.getItem("account"));

      // Get the exact time  right now by click
      const now = new Date();

      const payload = {
        tasktitle: taskTitle.value,
        taskdescription: taskDescription.value,
        taskaddress: taskAddress.value,
        tasksalary: taskSalary.value,
        taskpostdate: now.getTime(),
        account: {
          accountid: account.accountid,
        },
        category: {
          categoryid: category.value,
        },
      };
      console.log(payload);
      const fetchOptions = {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify(payload),
      };

      if (ls.getItem("token")) {
        fetchOptions.headers["x-authentication-token"] = ls.getItem("token");
      }

      fetch(`${url}/tasks`, fetchOptions)
        .then((res) => res.json())
        .then((data) => {
          console.log(data);
          container.innerHTML = "";
          if (!data.statusCode || Object.keys(data).length === 0) {
            const markup = `
                  <form class="loginForm">
                    <p class="success">Succesfully uploaded the ${data.tasktitle} task!</p>
                    <input class="filterBtn btn-collection" id="backToOwnTask" type="submit" value="Back to your tasks">
                  </form>
                `;
            addToHtml("#container", markup);
            addHandlerToBackToMyTasks();
          } else drawUploadTask(data);
        });
    });
  } catch (err) {}
};

const drawMyTasks = async function () {
  try {
    title.innerHTML = "My tasks";
    signUpBtn.classList.add("hidden");
    logInBtn.classList.add("hidden");
    signOutBtn.classList.remove("hidden");

    const fetchOptions = {
      method: "GET",
      headers: { "Content-type": "application/json" },
    };

    if (ls.getItem("token")) {
      fetchOptions.headers["x-authentication-token"] = ls.getItem("token");
    }

    fetch(`${url}/tasks/own`, fetchOptions)
      .then((res) => res.json())
      .then((data) => {
        if (data.statusCode || Object.keys(data).length == 0) {
          const markup = `<form class="loginForm">
                            <p > You did not post any tasks yet!</p> 
                          </form>`;
          container.insertAdjacentHTML("afterbegin", markup);
        } else {
          data.forEach((task) => {
            const markup = `
                        ${drawTasksHTML(task)}
                        <div class="applied">
                        <a href=?mytaskid=${task.taskid } class="filterBtn task-a btn-collection">Edit</a>
                        <a href="?application=${task.taskid}" class="filterBtn task-a btn-collection"> Who applied </span></a>
                        </div>`;
            container.insertAdjacentHTML("afterbegin", markup);
          });
        }
      });
  } catch (err) {
    console.log(err);
  }
};
// // See how many people applied for the task
// const seeApplicationPreview =  function(taskid) {

//     window.addEventListener('DOMContentLoaded', (e) => {
    
//       const fetchOptions = {
//         method: "GET",
//         headers: { "Content-type": "application/json" },
//       };
  
//       if (ls.getItem("token")) {
//         fetchOptions.headers["x-authentication-token"] = ls.getItem("token");
//       }
  
//       fetch(`${url}/application/${taskid}`, fetchOptions)
//         .then((res) => res.json())
//         .then((data) => {
//           console.log(data);
//         })
//     })
// }


// see who applied for task on a designated page
const drawApplication = async function () {
  try {
    const urlSplit = window.location.href.split("=");
    const taskid = urlSplit[1];
    console.log(taskid);
    // deleteBtn.classList.add('hidden')

    const fetchOptions = {
      method: "GET",
      headers: { "Content-type": "application/json" },
    };

    if (ls.getItem("token")) {
      fetchOptions.headers["x-authentication-token"] = ls.getItem("token");
    }

    fetch(`${url}/application/${taskid}`, fetchOptions)
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        if (data.statusCode || Object.keys(data).length == 0) {
          const markup = `<form class="loginForm">
                            <p> There are no applicants yet!</p> 
                            <input class="filterBtn btn-collection" id="backToOwnTask" type="submit" value="Back to your tasks">
                          </form>`;
          container.insertAdjacentHTML("afterbegin", markup);
          addHandlerToBackToMyTasks();
        } else {
          whoapplied.classList.remove("hidden");
          let markup =``
          data.forEach((profile) => {
             markup += `<article class="whoapplied task">
            <p>${profile.firstname} ${profile.lastname}</p>
            <p>Email: ${profile.email}</p>
            <p>Phone number: ${profile.phonenumber}</p>
            <p>${profile.profiledescription}</p>
            </article><br>
           
            `;
            
          });
          markup +=` <div class="applied">
          <input class="filterBtn btn-collection" id="backToOwnTask" type="submit" value="Back to your tasks">
          </div>`
          addToHtml("#container", markup);
          addHandlerToBackToMyTasks()
        }
      });
  } catch (err) {
    console.log(err);
  }
};

const drawUpdateTask = async function () {
  try {
    title.innerHTML = "Update your task";
    signUpBtn.classList.add("hidden");
    logInBtn.classList.add("hidden");
    signOutBtn.classList.remove("hidden");
    const urlSplit = window.location.href.split("=");
    const taskid = urlSplit[1];

    const fetchOptions = {
      method: "GET",
      headers: { "Content-type": "application/json" },
    };

    if (ls.getItem("token")) {
      fetchOptions.headers["x-authentication-token"] = ls.getItem("token");
    }

    fetch(`${url}/tasks/own/${taskid}`, fetchOptions)
      .then((res) => res.json())
      .then((data) => {
        const markup = `
        <form class="loginForm">
       
        <input id="taskTitle" type="text" value="${data.tasktitle}">
        <input id="taskDescription" type="text" name="Describe" value="${data.taskdescription}">
        <input id="taskAddress" type="text" value="${data.taskaddress}">
        <input id="taskSalary" type="number" value="${data.tasksalary}">
        <label for="">Select category</label>
        <select name="category" id="category">
            <option value="1">Indoor</option>
            <option value="2">Outdoor</option>
        </select>

        <label for="">Update status</label>
        <select name="status" id="status">
            <option value="1">Avaliable</option>
            <option value="2">Expired</option>
        </select>
      <button class="filterBtn btn-collection" id="updateTaskBtn">Update the task</button>

      </form>
        `;
        addToHtml("#container", markup);
        addHandlerToUpdateBtn(taskid);
      });
  } catch (err) {
    console.log(err);
  }
};

const addHandlerToUpdateBtn = async function (taskid) {
  try {
    const taskTitle = document.querySelector("#taskTitle");
    const taskDescription = document.querySelector("#taskDescription");
    const taskAddress = document.querySelector("#taskAddress");
    const taskSalary = document.querySelector("#taskSalary");
    const category = document.querySelector("#category");
    const status = document.querySelector("#status");
    const updateTaskBtn = document.querySelector("#updateTaskBtn");

    updateTaskBtn.addEventListener("click", (e) => {
      e.preventDefault();
      addSpinner();
      console.log(status.value);
      console.log(category.value);

      const now = new Date();
      const payload = {
        tasktitle: taskTitle.value,
        taskdescription: taskDescription.value,
        taskaddress: taskAddress.value,
        tasksalary: taskSalary.value,
        category: {
          categoryid: category.value,
        },
        status: {
          statusid: status.value,
        },
        taskpostdate: now.getTime(),
      };
      if (status.value) {
        status: status.value;
        payload.status;
      }

      if (category.value) {
        category: category.value;
        payload.category;
      }

      const fetchOptions = {
        method: "PUT",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify(payload),
      };

      if (ls.getItem("token")) {
        fetchOptions.headers["x-authentication-token"] = ls.getItem("token");
      }

      fetch(`${url}/tasks/${taskid}`, fetchOptions)
        .then((res) => res.json())
        .then((data) => {
          console.log(JSON.stringify(data));
          container.innerHTML = "";
          if (!data.statusCode || Object.keys(data).length === 0) {
            const markup = `
                  <form class="loginForm">
                    <p class="success">You succesfully updated your task!</p>
                    <input class="filterBtn btn-collection" id="backToOwnTask" type="submit" value="Back to your tasks">
                  </form>
                `;
            addToHtml("#container", markup);
            addHandlerToBackToMyTasks();
          }
        });
    });
  } catch (err) {
    console.log(err);
  }
};

// Log out
const addHandlerToLogout = async function () {
  try {
    signOutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      ls.removeItem("account");
      ls.removeItem("token");
      ls.removeItem("profile");
      window.location.reload();
      gettingHomePageUrl();
    });
  } catch (err) {
    console.log(err);
  }
};

const drawTasksHTML = function (task) {
  const date = new Date(+task.taskpostdate).toLocaleDateString("dk");

  const markup = `
        <article id="task-detail" class="task ${
          task.status.statusid === 2 ? "task-expired " : ""
        }}">
            <div>
              <h3>${task.tasktitle}</h3>
              <p>${task.taskdescription}</p>
              <address>Address: ${task.taskaddress}</address>
              <p>Salary: ${task.tasksalary} DKK</p>
              <p>Phone number: +45 ${task.profile.phonenumber}</p>
            </div>
            
            <time>Posted date: ${date}</time>
            <p>Posted by: ${task.profile.firstname} ${task.profile.lastname}</p>
            
        </article>
        `;
  return markup;
};

const drawPreviewTasksHtml = function (task) {
  const markup = `
    <article id="task" class="task ${
      task.status.statusid === 2 ? "task-expired " : ""
    }}">
            <h3>${task.tasktitle}</h3>
            <p>${task.taskdescription}</p>
            <address>${task.taskaddress}</address>

            <p>${task.tasksalary} DKK</p>
    </article>
    `;
  return markup;
};

async function addToHtml(selector, newContent) {
  try {
    document.querySelector(selector).innerHTML += newContent;
  } catch (err) {
    console.log(err);
  }
}

function addSpinner() {
  container.innerHTML = "";
  const markup = `
    <div class="spinner"> </div>
  `;
  container.innerHTML = markup;
}

function addError(error, container) {
  const markup = `
    <div>
        <h3 class="error">${error.errorMessage}</h3>
        <p>${error.errorObj.details[0].message}</p>
        <input class="filterBtn btn-collection" id="backToTask" type="submit" value="Back to your tasks">
    </div>`;
  container.insertAdjacentHTML("afterbegin", markup);
}

const addHandlerToBackToMyTasks = async function () {
  try {
    const backToOwnTask = document.querySelector("#backToOwnTask");
    backToOwnTask.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "?mytasks";
    });
  } catch (err) {}
};
const addHandlerToBackToProfilePage = async function () {
  try {
    const backToProfile = document.querySelector("#backToProfile");
    backToProfile.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "?profilepage";
    });
  } catch (err) {}
};
