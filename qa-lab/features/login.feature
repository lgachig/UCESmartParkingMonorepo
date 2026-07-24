Feature: Inicio de sesión
  Como estudiante de la UCE
  Quiero iniciar sesión con mis credenciales
  Para acceder al sistema de parqueadero

  # Camino de éxito
  Scenario: Login exitoso con credenciales válidas
    Given el usuario abre la página de login
    When ingresa el correo "user1@uce.edu.ec" y la contraseña "A12345a-@"
    And presiona el botón "ACCEDER"
    Then el sistema lo redirige fuera de la página de login

  # Camino alterno
  Scenario: Login fallido con contraseña incorrecta
    Given el usuario abre la página de login
    When ingresa el correo "user1@uce.edu.ec" y la contraseña "ClaveIncorrecta1!"
    And presiona el botón "ACCEDER"
    Then el sistema muestra el mensaje de error "Credenciales incorrectas."
    And el usuario permanece en la página de login

  # Excepción
  Scenario: Intentar iniciar sesión sin ingresar datos
    Given el usuario abre la página de login
    When presiona el botón "ACCEDER"
    Then el usuario permanece en la página de login
    And no se produce ninguna redirección fuera del login