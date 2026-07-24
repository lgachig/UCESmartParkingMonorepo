Feature: Cancelación de una reserva

  # Camino de éxito
  Scenario: Cancelar una reserva pendiente exitosamente
    Given el usuario "user1@uce.edu.ec" ha iniciado sesión
    And selecciona un espacio disponible en el mapa
    And confirma la reserva
    When cancela la reserva desde el panel de detalle
    Then el sistema muestra el mensaje "Reserva cancelada"

  # Camino alterno
  Scenario: Cancelar la reserva y verificar que el usuario puede volver a reservar
    Given el usuario "user1@uce.edu.ec" ha iniciado sesión
    And selecciona un espacio disponible en el mapa
    And confirma la reserva
    And cancela la reserva desde el panel de detalle
    When selecciona un espacio disponible en el mapa
    And confirma la reserva
    Then aparece la opción de hacer check-in

  # Excepción
  Scenario: El botón de cancelar reserva se deshabilita mientras se procesa la cancelación
    Given el usuario "user1@uce.edu.ec" ha iniciado sesión
    And selecciona un espacio disponible en el mapa
    And confirma la reserva
    When cancela la reserva desde el panel de detalle
    Then el botón de cancelar quedó inhabilitado durante el procesamiento