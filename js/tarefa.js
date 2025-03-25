async function loadGoogleCalendarAPI() {
  return new Promise((resolve, reject) => {
      gapi.load("client", async () => {
          try {
              await gapi.client.init({
                  apiKey: "AIzaSyAt8Ygb6v0EYQJky7dvJMC_znfPoReRKO8",
                  discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
              });
              console.log("Google Calendar API carregada com sucesso.");
              resolve();
          } catch (error) {
              console.error("Erro ao inicializar API do Google:", error);
              reject(error);
          }
      });
  });
}

// Obtém um access token via OAuth
async function authenticateGoogle() {
  return new Promise((resolve, reject) => {
      google.accounts.oauth2.initTokenClient({
          client_id: '106428306924-9qgt7fjemjvde4756rl31ga6cthkj9ln.apps.googleusercontent.com',
          scope: 'https://www.googleapis.com/auth/calendar.events',
          callback: (response) => {
              if (response.error) {
                  console.error("Erro na autenticação:", response);
                  reject(response.error);
              } else {
                  localStorage.setItem("googleAccessToken", response.access_token);
                  console.log("Access Token armazenado:", response.access_token);
                  resolve(response.access_token);
              }
          }
      }).requestAccessToken();
  });
}

async function fetchGoogleCalendarEvents() {
  const accessToken = localStorage.getItem("googleAccessToken");
  if (!accessToken) {
    alert("Por favor, faça login com o Google para visualizar o calendário.");
    return;
  }

  try {
    const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar eventos do Google Calendar.");
    }

    const data = await response.json();
    console.log("Eventos do Google Calendar:", data.items);

    // Exibir os eventos na sua interface
    displayEvents(data.items);
  } catch (error) {
    console.error("Erro ao buscar eventos do Google Calendar:", error);
    alert("Erro ao buscar eventos do Google Calendar. Verifique se você está autenticado.");
  }
}

function displayEvents(events) {
  const eventList = document.getElementById("eventList");
  eventList.innerHTML = ""; // Limpa a lista de eventos anterior

  if (events.length === 0) {
    eventList.innerHTML = "<li>Nenhum evento encontrado.</li>";
    return;
  }

  events.forEach((event) => {
    const eventItem = document.createElement("li");
    eventItem.textContent = `${event.summary} - ${event.start.dateTime || event.start.date}`;
    eventList.appendChild(eventItem);
  });
}


// Função para criar evento no Google Calendar
async function createGoogleCalendarEvent(
  taskTitle,
  taskDescription,
  taskDeadline
) {
  try {
    // Verifica se a API do Google Calendar foi carregada
    if (!gapi.client.calendar) {
      throw new Error("API do Google Calendar não foi carregada corretamente.");
    }

    const event = {
      summary: taskTitle,
      description: taskDescription,
      start: {
        dateTime: new Date(taskDeadline).toISOString(),
        timeZone: "America/Sao_Paulo",
      },
      end: {
        dateTime: new Date(taskDeadline).toISOString(),
        timeZone: "America/Sao_Paulo",
      },
    };

    const response = await gapi.client.calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });

    console.log("Evento criado no Google Calendar:", response);
    alert("Evento adicionado ao Google Calendar!");
  } catch (error) {
    console.error("Erro ao criar evento no Google Calendar:", error);
    alert(
      "Erro ao criar evento no Google Calendar. Verifique se você está autenticado."
    );
  }
}

// Black4app
Parse.initialize(
  "eNJMTwJVCzZ9KR0kITkc5lnv43LaC646RmYLDnz3",
  "Sf2wHhp9n1IZl8TYuG643MxWKyCyDA2KutkwKeCW"
);
Parse.serverURL = "https://parseapi.back4app.com/";

const TaskManager = (() => {
  const Task = Parse.Object.extend("Tarefa");

  const getCurrentUser = async () => {
    const idToken = localStorage.getItem("googleIdToken");
    const currentUser = Parse.User.current();
  
    if (idToken) {
      // Autenticação via Google
      try {
        const user = await Parse.Cloud.run('googleLogin', { idToken });
        if (!user) {
          console.error("Usuário não autenticado no Parse Server.");
          window.location.href = "index.html";
          return null;
        }
        console.error("Usuário autenticado com sucesso no Parse Server.");
        return user;
      } catch (error) {
        console.error("Erro ao autenticar com Google:", error);
        window.location.href = "index.html";
        return null;
      }
    } else if (currentUser) {
      // Autenticação tradicional
      return currentUser;
    } else {
      // Nenhum método de autenticação encontrado
      console.error("Nenhum método de autenticação encontrado. O usuário pode estar deslogado.");
      window.location.href = "index.html";
      return null;
    }
  };

  const logout = () => {
    Parse.User.logOut()
      .then(() => {
        localStorage.removeItem("googleIdToken");
        window.location.href = "index.html";
      })
      .catch((error) => {
        console.error("Erro ao sair:", error.message);
      });
  };

  const renderTasks = async () => {
    const user = await getCurrentUser(); // Aguarda a resolução da Promise
    if (!user) {
      alert("Você precisa estar logado para visualizar as tarefas.");
      return;
    }

    const query = new Parse.Query(Task);
    query.equalTo("owner", user);

    try {
      const results = await query.find();
      const tbody = document.querySelector("#taskTable tbody");
      tbody.innerHTML = results
        .map((task) => {
          const dataCriacao = new Date(task.createdAt).toLocaleDateString(
            "pt-BR"
          );
          const prazo = new Date(task.get("prazo")).toLocaleDateString("pt-BR");
          const status = task.get("status");
          const isStatusDisabled = status === "Concluída";

          return `
            <tr data-id="${task.id}">
              <td>${task.get("titulo")}</td>
              <td>${task.get("descricao")}</td>
              <td>${dataCriacao}</td>
              <td>${prazo}</td>
              <td>
                <select class="status-select" ${
                  isStatusDisabled ? "disabled" : ""
                }>
                  <option value="Em andamento" ${
                    status === "Em andamento" ? "selected" : ""
                  }>Em andamento</option>
                  <option value="Concluída" ${
                    status === "Concluída" ? "selected" : ""
                  }>Concluída</option>
                </select>
              </td>
              <td>${task.get("prioridade")}</td>
              <td>${task.get("responsavel")}</td>
              <td><button class="delete-btn">Excluir</button></td>
            </tr>
          `;
        })
        .join("");

      addStatusChangeListeners();
    } catch (error) {
      console.error("Erro ao buscar tarefas:", error.message);
    }
  };

  const addStatusChangeListeners = () => {
    document.querySelectorAll(".status-select").forEach((select) => {
      select.addEventListener("change", async (event) => {
        const row = event.target.closest("tr");
        const taskId = row.getAttribute("data-id");
        const newStatus = event.target.value;

        try {
          const query = new Parse.Query(Task);
          const task = await query.get(taskId);
          task.set("status", newStatus);
          await task.save();
          alert("Status atualizado com sucesso!");

          if (newStatus === "Concluída") {
            event.target.disabled = true;
          }
        } catch (error) {
          console.error("Erro ao atualizar status:", error.message);
        }
      });
    });
  };

  return {
    addTask: async (title, description, deadline, priority, responsible) => {
      const user = await getCurrentUser(); // Aguarda a resolução da Promise
      if (!user) {
        alert("Você precisa estar logado para adicionar tarefas.");
        return;
      }

      // Validação dos campos
      if (!title || !description || !deadline || !responsible) {
        alert("Preencha todos os campos corretamente.");
        return;
      }

      const task = new Task();
      task.set("titulo", title);
      task.set("descricao", description);
      task.set("prazo", new Date(deadline));
      task.set("status", "Em andamento");
      task.set("prioridade", priority);
      task.set("responsavel", responsible);
      task.set("owner", user);

      try {
        await task.save();
        alert("Tarefa adicionada com sucesso!");
        renderTasks();

        // Criar evento no Google Calendar (se o usuário estiver autenticado via Google)
        const idToken = localStorage.getItem("googleIdToken");
        if (idToken) {
          await createGoogleCalendarEvent(title, description, deadline);
        }

        resetForm();
      } catch (error) {
        console.error("Erro ao adicionar tarefa:", error.message);
      }
    },
    deleteTask: async (id) => {
      const user = await getCurrentUser(); // Aguarda a resolução da Promise
      if (!user) {
        alert("Você precisa estar logado para excluir tarefas.");
        return;
      }

      const query = new Parse.Query(Task);
      try {
        const task = await query.get(id);
        if (task.get("owner").id !== user.id) {
          alert("Você não tem permissão para excluir esta tarefa.");
          return;
        }

        await task.destroy();
        alert("Tarefa excluída com sucesso!");
        renderTasks();
      } catch (error) {
        console.error("Erro ao excluir tarefa:", error.message);
      }
    },
    render: renderTasks,
    logout,
  };
})();

// Validação do formulário
const validateFields = (title, description, deadline, responsible) => {
  if (!title) return "O título é obrigatório.";
  if (!description) return "A descrição é obrigatória.";
  if (!deadline || isNaN(Date.parse(deadline)))
    return "A data de prazo deve ser uma data válida.";
  if (!responsible) return "O responsável é obrigatório.";
  return null;
};

const resetForm = () => {
  document.getElementById("titulo").value = "";
  document.getElementById("descricao").value = "";
  document.getElementById("prazo").value = "";
  document.getElementById("prioridade").value = "Baixa";
  document.getElementById("responsavel").value = "";
};

// Adiciona Tarefa
document.getElementById("addTask").addEventListener("click", async () => {
  const title = document.getElementById("titulo").value.trim();
  const description = document.getElementById("descricao").value.trim();
  const deadline = document.getElementById("prazo").value;
  const priority = document.getElementById("prioridade").value;
  const responsible = document.getElementById("responsavel").value.trim();

  // Validação dos campos
  const errorMessage = validateFields(
    title,
    description,
    deadline,
    responsible
  );
  if (errorMessage) {
    alert(errorMessage);
    return;
  }

  try {
    await TaskManager.addTask(
      title,
      description,
      deadline,
      priority,
      responsible
    );
  } catch (error) {
    console.error("Erro ao adicionar tarefa:", error.message);
  }
});

// Excluir Tarefa
document
  .querySelector("#taskTable tbody")
  .addEventListener("click", (event) => {
    if (event.target.classList.contains("delete-btn")) {
      const id = event.target.closest("tr").getAttribute("data-id");
      TaskManager.deleteTask(id);
    }
  });

  const updateSaudacao = () => {
    const idToken = localStorage.getItem("googleIdToken");
    const currentUser = Parse.User.current();
  
    if (idToken) {
      // Exibe o nome do usuário autenticado via Google
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      const nomeUsuario = payload.name || "Usuário";
      document.getElementById("nomeUsuario").textContent = nomeUsuario;
    } else if (currentUser) {
      // Exibe o nome do usuário autenticado tradicionalmente
      const nomeUsuario = currentUser.get("name") || "Usuário";
      document.getElementById("nomeUsuario").textContent = nomeUsuario;
    } else {
      // Nenhum método de autenticação encontrado
      document.getElementById("nomeUsuario").textContent = "Usuário";
    }
  };

function embedGoogleCalendar() {
  const idToken = localStorage.getItem("googleIdToken");
  if (!idToken) {
    alert("Por favor, faça login com o Google para visualizar o calendário.");
    return;
  }

  const payload = JSON.parse(atob(idToken.split('.')[1]));
  const userEmail = payload.email; // Extrai o e-mail do payload do token

  const calendarContainer = document.createElement("iframe");
  calendarContainer.src = `https://calendar.google.com/calendar/embed?src=${userEmail}L&ctz=America%2FSao_Paulo`;
  calendarContainer.style.width = "100%";
  calendarContainer.style.height = "600px";
  document.querySelector(".container").appendChild(calendarContainer);
}

document.addEventListener("DOMContentLoaded", async () => {
  updateSaudacao();
  TaskManager.render();

  // Verifica se o idToken do Google está armazenado
  const idToken = localStorage.getItem("googleIdToken");
  const currentUser = Parse.User.current();

  if (!idToken && !currentUser) {
    alert("Você precisa fazer login para acessar esta página.");
    window.location.href = "index.html"; // Redireciona para a página de login
    return;
  }

  try {
    if (idToken) {
      await loadGoogleCalendarAPI();

      // Autentica o usuário no Google para obter o accessToken
      await authenticateGoogle();

      // Busca e exibe os eventos do Google Calendar
      await fetchGoogleCalendarEvents();
    }
  } catch (error) {
    console.error("Erro ao carregar Google API:", error);
    alert("Erro ao carregar Google API. Verifique se você está autenticado.");
    localStorage.removeItem("googleIdToken");
    window.location.href = "index.html";
  }
});


document.getElementById("logout").addEventListener("click", TaskManager.logout);
