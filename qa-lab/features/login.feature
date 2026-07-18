Feature: Inicio de sesión
  Como estudiante de la UCE
  Quiero iniciar sesión con mis credenciales
  Para acceder al sistema de parqueadero

  Scenario: Login exitoso con credenciales válidas
    Given el usuario abre la página de login
    When ingresa el correo "user1@uce.edu.ec" y la contraseña "A12345a-@"
    And presiona el botón "ACCEDER"
    Then el sistema lo redirige fuera de la página de login
