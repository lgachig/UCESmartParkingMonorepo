Feature: Reserva de espacio de parqueo

  # Camino de éxito
  Scenario: Reservar un espacio disponible
    Given el usuario "user1@uce.edu.ec" ha iniciado sesión
    When selecciona un espacio disponible en el mapa
    And confirma la reserva
    Then aparece la opción de hacer check-in

  # Camino alterno
  Scenario: Intentar reservar un segundo espacio teniendo ya una reserva activa
    Given el usuario "user1@uce.edu.ec" ha iniciado sesión
    And selecciona un espacio disponible en el mapa
    And confirma la reserva
    When intenta seleccionar otro espacio disponible en el mapa
    Then el sistema muestra el mensaje "Ya tienes una reserva activa."

  # Excepción
  Scenario: Intentar acceder al mapa de reservas sin haber iniciado sesión
    Given el usuario no ha iniciado sesión
    When intenta navegar directamente a la ruta de usuario
    Then el sistema lo redirige a la página de login