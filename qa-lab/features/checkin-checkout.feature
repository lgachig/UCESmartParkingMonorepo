Feature: Check-in y Check-out de una reserva

  # Camino de éxito
  Scenario: Check-in y check-out exitoso de un espacio
    Given el usuario "user1@uce.edu.ec" ha iniciado sesión
    And selecciona un espacio disponible en el mapa
    And confirma la reserva
    When realiza el check-in en el espacio reservado
    And finaliza la sesión con check-out
    Then el sistema refleja el fin de la sesión de parqueo

  # Excepción
  Scenario: El botón de check-in no está disponible si no hay una reserva pendiente
    Given el usuario "user1@uce.edu.ec" ha iniciado sesión
    When navega directamente a la vista de "Mis Reservas"
    Then no se muestra ningún botón de "LLEGUE — CHECK IN" en la página