Feature: Reserva de espacio de parqueo

  Scenario: Reservar un espacio disponible
    Given el usuario "user1@uce.edu.ec" ha iniciado sesión
    When selecciona un espacio disponible en el mapa
    And confirma la reserva
    Then aparece la opción de hacer check-in