Feature: Registro de nuevo usuario
  Como visitante de la plataforma
  Quiero crear una cuenta institucional
  Para poder reservar espacios de parqueo

  # Camino de éxito
  Scenario: Registro exitoso con datos válidos
    Given el usuario abre la página de registro
    When completa el formulario de registro con un correo institucional único y datos válidos
    And presiona el botón "CREAR MI CUENTA"
    Then el sistema lo redirige fuera de la página de registro

  # Camino alterno
  Scenario: Intentar registrar un correo que ya existe
    Given el usuario abre la página de registro
    When completa el formulario de registro con el correo "user1@uce.edu.ec" ya existente
    And presiona el botón "CREAR MI CUENTA"
    Then el sistema muestra el mensaje "Ya existe una cuenta con ese correo."

  # Excepción
  Scenario: Intentar registrar con contraseñas que no coinciden
    Given el usuario abre la página de registro
    When completa el formulario de registro con contraseñas distintas entre sí
    And presiona el botón "CREAR MI CUENTA"
    Then el sistema muestra el mensaje "Las contraseñas no coinciden"
    And el usuario permanece en la página de registro