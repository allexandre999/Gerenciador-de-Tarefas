// Inicializa o Google Identity Services (GIS)
function initializeGis() {
    google.accounts.id.initialize({
        client_id: '106428306924-9qgt7fjemjvde4756rl31ga6cthkj9ln.apps.googleusercontent.com', // Substitua pelo seu Client ID
        callback: handleCredentialResponse, // Função de callback para processar a resposta de autenticação
        ux_mode: 'popup'
    });

    // Renderiza o botão de login do Google
    google.accounts.id.renderButton(
        document.getElementById('googleLoginButton'), // Elemento onde o botão será renderizado
        { theme: 'outline', size: 'large' } // Personalizações do botão
    );
}

// Função de callback para processar a resposta de autenticação
async function handleCredentialResponse(response) {
    try {
        const idToken = response.credential;
        
        const user = await Parse.Cloud.run('googleLogin', { idToken });
        if (user && user.sessionToken) {
            // Armazena o idToken e sessionToken
            localStorage.setItem('googleIdToken', idToken);
            localStorage.setItem('parseSessionToken', user.sessionToken);
            
            // Configura a sessão atual no Parse
            Parse.User.become(user.sessionToken).then(() => {
                window.location.href = 'tarefa.html';
            });
        } else {
            throw new Error("Falha na autenticação: sessão não criada");
        }
    } catch (error) {
        console.error("Erro no login com Google:", error);
        alert(error.message || "Erro ao autenticar com Google");
    }
}

// Função para obter o access_token via OAuth 2.0
async function authenticateGoogle() {
    return new Promise((resolve, reject) => {
      google.accounts.oauth2.initTokenClient({
        client_id: '106428306924-9qgt7fjemjvde4756rl31ga6cthkj9ln.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar',
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

// Black4app
Parse.initialize("eNJMTwJVCzZ9KR0kITkc5lnv43LaC646RmYLDnz3", "Sf2wHhp9n1IZl8TYuG643MxWKyCyDA2KutkwKeCW");
Parse.serverURL = "https://parseapi.back4app.com/";

document.addEventListener('DOMContentLoaded', function() {
    if (typeof google !== 'undefined') {
        initializeGis();
    } else {
        // Se não estiver carregado, aguarda o evento 'load' para garantir que o script foi carregado
        window.addEventListener('load', function() {
            if (typeof google !== 'undefined') {
                initializeGis();
            } else {
                console.error('Google Identity Services não foi carregado corretamente.');
            }
        });
    }

    const loginSection = document.getElementById("loginSection");
    const registerSection = document.getElementById("registerSection");
    const showRegisterButton = document.getElementById("showRegisterButton");
    const showLoginButton = document.getElementById("showLoginButton");

    // Alterna Login e Cadastro
    showRegisterButton.addEventListener("click", function() {
        loginSection.classList.remove("active");
        registerSection.classList.remove("d-none");
        registerSection.classList.add("active");
    });

    showLoginButton.addEventListener("click", function() {
        registerSection.classList.remove("active");
        registerSection.classList.add("d-none");
        loginSection.classList.add("active");
    });

    function displayError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        errorElement.textContent = message;
        errorElement.classList.remove("d-none");
    }

    function clearError(elementId) {
        const errorElement = document.getElementById(elementId);
        errorElement.textContent = '';
        errorElement.classList.add("d-none");
    }

    function clearFormFields(formId) {
        document.getElementById(formId).reset();
    }

    // Verifica autenticação via token
    function checkAuthentication() {
        const user = Parse.User.current();
        if (user && user.getSessionToken()) {
            localStorage.setItem('userToken', user.getSessionToken());
            window.location.href = 'tarefa.html';
        }
    }

    checkAuthentication();

    // Login via API REST
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        clearError('loginError');

        Parse.User.logIn(email, password)
            .then((user) => {
                localStorage.setItem('userToken', user.getSessionToken());
                alert('Login realizado com sucesso!');
                clearFormFields('loginForm');
                window.location.href = 'tarefa.html';
            })
            .catch(() => {
                displayError('loginError', 'E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.');
            });
    });

    // Cadastro de novo usuário
    document.getElementById('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        clearError('registerError');
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        if (password.length < 8) {
            return displayError('registerError', 'A senha deve ter pelo menos 8 caracteres. Escolha uma senha mais segura.');
        }

        const query = new Parse.Query(Parse.User);
        query.equalTo('username', email);
        query.first().then((user) => {
            if (user) {
                return displayError('registerError', 'Este e-mail já está cadastrado. Se você já tem uma conta, faça login ou escolha outro e-mail.');
            } else {
                const newUser = new Parse.User();
                newUser.set('username', email);
                newUser.set('password', password);
                newUser.set('email', email);
                newUser.set('name', name);

                newUser.signUp()
                    .then(() => {
                        alert('Cadastro realizado com sucesso!');
                        clearFormFields('registerForm');
                        window.location.href = 'tarefa.html';
                    })
                    .catch((error) => {
                        if (error.code === 202) {
                            displayError('registerError', 'Este e-mail já está registrado. Se você já tem uma conta, faça login.');
                        } else {
                            displayError('registerError', 'Ocorreu um erro ao tentar cadastrar sua conta. Tente novamente em instantes.');
                        }
                    });
            }
        }).catch(() => {
            displayError('registerError', 'Houve um erro ao verificar o e-mail. Por favor, tente novamente mais tarde.');
        });
    });

    
    function logout() {
        Parse.User.logOut().then(() => {
            localStorage.removeItem('userToken');
            window.location.href = 'index.html';
        });
    }
});